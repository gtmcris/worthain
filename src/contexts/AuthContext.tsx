import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { syncTotalWords } from '../lib/stats';
import { normalizeStreakOnLoad } from '../lib/streak';
import { syncDailyGoal } from '../lib/dailyGoal';

/**
 * Recursively strip `undefined` values from an object.
 * Firestore SDK throws "Unsupported field value: undefined" if any
 * property in the data payload is `undefined`.  This helper removes
 * those keys so the write succeeds.
 */
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value.toDate !== 'function') {
      cleaned[key] = stripUndefined(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildDefaultStats = () => ({
  totalWords: 0,
  masteredWords: 0,
  streak: 0,
  lastActivity: Timestamp.now(),
  dailyWordsGoal: 10,
  dailyWordsCompleted: 0,
  dailyGoalResetAt: Timestamp.now(),
});

const buildDefaultProfile = (
  id: string,
  name: string,
  email = '',
  photoURL?: string
): UserProfile => {
  const profile: UserProfile = {
    userId: id,
    displayName: name,
    email,
    goal: { dailyWords: 10 },
    stats: buildDefaultStats(),
  };
  if (photoURL) profile.photoURL = photoURL;
  return profile;
};

const mergeProfile = (
  fbUser: User,
  existing?: Partial<UserProfile>,
  overrideName?: string
): UserProfile => {
  // For email/password users, fbUser.displayName and fbUser.photoURL are null.
  // Prefer the override name, then existing stored values.
  const displayName = overrideName || fbUser.displayName || existing?.displayName || fbUser.email?.split('@')[0] || 'Learner';
  const photoURL = fbUser.photoURL || existing?.photoURL || undefined;

  const fallback = buildDefaultProfile(
    fbUser.uid,
    displayName,
    fbUser.email || '',
    photoURL
  );

  const result: UserProfile = {
    ...fallback,
    ...existing,
    userId: fbUser.uid,
    email: fbUser.email || existing?.email || '',
    displayName,
    goal: {
      ...fallback.goal,
      ...(existing?.goal ?? {}),
    },
    stats: {
      ...buildDefaultStats(),
      ...(existing?.stats ?? {}),
    },
  };
  // Only set photoURL if it has a real value — never set it to undefined.
  if (photoURL) result.photoURL = photoURL;
  // Preserve premium status from existing profile
  if (existing?.premium) result.premium = existing.premium;
  if (existing?.premiumSince) result.premiumSince = existing.premiumSince;
  return result;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Guard flag: when true, onAuthStateChanged should NOT run upsertProfile
  // because signUpWithEmail will handle it after setting the display name.
  const signupInProgress = useRef(false);

  const upsertProfile = async (fbUser: User, overrideName?: string) => {
    try {
      const profileRef = doc(db, 'users', fbUser.uid);
      const profileSnap = await getDoc(profileRef);

      const mergedProfile = mergeProfile(
        fbUser,
        profileSnap.exists() ? (profileSnap.data() as Partial<UserProfile>) : undefined,
        overrideName
      );

      // Ensure the user document exists in Firestore BEFORE running
      // sync operations so they don't fail on missing doc.
      if (!profileSnap.exists()) {
        await setDoc(profileRef, stripUndefined(mergedProfile));
      }

      // Run all sync operations in parallel for speed.
      await Promise.all([
        syncTotalWords(fbUser.uid),
        normalizeStreakOnLoad(fbUser.uid),
        syncDailyGoal(fbUser.uid),
      ]);

      // Re-read after sync ops to get freshly-written values.
      const freshSnap = await getDoc(profileRef);
      const freshData = freshSnap.exists()
        ? (freshSnap.data() as UserProfile)
        : mergedProfile;

      const finalProfile: UserProfile = {
        ...mergedProfile,
        ...freshData,
        goal: { ...mergedProfile.goal, ...(freshData.goal ?? {}) },
        stats: { ...buildDefaultStats(), ...(freshData.stats ?? {}) },
      };

      await setDoc(profileRef, stripUndefined(finalProfile), { merge: true });
      setProfile(finalProfile);
    } catch (err) {
      console.error('[upsertProfile] FAILED:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      setProfile(profileSnap.data() as UserProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        setUser(fbUser);
        if (fbUser) {
          // Skip upsert if signup is in progress — signUpWithEmail will handle it
          if (!signupInProgress.current) {
            await upsertProfile(fbUser);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error('upsertProfile failed in onAuthStateChanged:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await upsertProfile(result.user);
  };

  const signUpWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await upsertProfile(result.user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await upsertProfile(result.user);
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    // Set the guard so onAuthStateChanged does NOT run upsertProfile.
    signupInProgress.current = true;
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Set the display name on the Firebase Auth user first.
      await updateProfile(result.user, { displayName });
      // Now run upsert with the correct display name.
      await upsertProfile(result.user, displayName);
      setLoading(false);
    } finally {
      signupInProgress.current = false;
    }
  };

  const logout = async () => {
    setProfile(null);
    await signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      signInWithGoogle,
      signUpWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout,
      refreshProfile,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}