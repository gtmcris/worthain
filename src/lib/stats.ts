import { collection, doc, getCountFromServer, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';

export async function syncTotalWords(userId: string) {
    const q = query(
        collection(db, 'vocabularies'),
        where('userId', '==', userId)
    );

    const snapshot = await getCountFromServer(q);
    const total = snapshot.data().count;

    await setDoc(
        doc(db, 'users', userId),
        {
            stats: {
                totalWords: total,
            },
        },
        { merge: true }
    );

    return total;
}