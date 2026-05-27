import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

const DAILY_GOAL_LIMIT = 10;

function toDate(value: any): Date | null {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate(); // Firestore Timestamp
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
}

function isSameCalendarDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

async function updateDailyGoal(userId: string, incrementBy: number) {
    const ref = doc(db, 'users', userId);

    await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) return;

        const data = snap.data();
        const stats = data.stats || {};
        const now = new Date();

        const currentCount = Number(stats.dailyWordsCompleted || 0);
        const resetAt = toDate(stats.dailyGoalResetAt);

        const isNewDay = !resetAt || !isSameCalendarDay(now, resetAt);

        // If it's a new day, start from 0; otherwise continue from current count
        const baseCount = isNewDay ? 0 : currentCount;
        const newCount = Math.min(DAILY_GOAL_LIMIT, baseCount + incrementBy);

        tx.update(ref, {
            'stats.dailyWordsGoal': DAILY_GOAL_LIMIT,
            'stats.dailyWordsCompleted': newCount,
            'stats.dailyGoalResetAt': Timestamp.fromDate(now),
        });
    });
}

export async function incrementDailyGoal(userId: string) {
    return updateDailyGoal(userId, 1);
}

/**
 * Call on app load to reset the counter if it's a new calendar day.
 * Safe to call with no side effects if it's still the same day.
 */
export async function syncDailyGoal(userId: string) {
    return updateDailyGoal(userId, 0);
}