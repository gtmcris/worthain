import { Timestamp, doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function getDateKey(
    date = new Date(),
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);

    const lookup = Object.fromEntries(parts.map(p => [p.type, p.value]));
    return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function shiftDateKey(dateKey: string, days: number) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

export async function recordStreakActivity(userId: string) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayKey = getDateKey(new Date(), timeZone);
    const yesterdayKey = shiftDateKey(todayKey, -1);

    const ref = doc(db, 'users', userId);

    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;

        const stats = (snap.data().stats || {}) as any;
        const lastKey = stats.streakLastActivityDayKey as string | undefined;
        let streak = Number(stats.streak || 0);

        if (!lastKey) {
            streak = 1;
        } else if (lastKey === todayKey) {
            streak = streak; // already counted today
        } else if (lastKey === yesterdayKey) {
            streak += 1; // consecutive day
        } else {
            streak = 1; // missed a day
        }

        tx.set(
            ref,
            {
                stats: {
                    streak,
                    streakLastActivityDayKey: todayKey,
                    streakTimeZone: timeZone,
                    lastActivity: Timestamp.now(),
                },
            },
            { merge: true }
        );
    });
}

export async function normalizeStreakOnLoad(userId: string): Promise<number | null> {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const todayKey = getDateKey(new Date(), timeZone);
    const yesterdayKey = shiftDateKey(todayKey, -1);

    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const stats = (snap.data().stats || {}) as any;
    const lastKey = stats.streakLastActivityDayKey as string | undefined;
    let streak = Number(stats.streak || 0);

    if (!lastKey) return streak;

    if (lastKey === todayKey || lastKey === yesterdayKey) {
        return streak; // still valid
    }

    // missed day → reset
    streak = 0;

    await setDoc(ref, { stats: { streak } }, { merge: true });

    return streak;
}