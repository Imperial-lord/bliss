import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Logs high-level cinema streaming session metadata for future analytics.
 * Strictly guarantees ZERO storage of chat messages, video call frames, or peer audio.
 */
export async function logCinemaSession({ roomId, hostUid, title, duration, totalViewers }) {
  try {
    const docRef = await addDoc(collection(db, 'cinema_sessions'), {
      roomId,
      hostUid: hostUid || 'anonymous_host',
      movieTitle: title || 'Untitled Stream',
      durationSeconds: Math.floor(duration || 0),
      totalViewers: totalViewers || 1,
      createdAt: serverTimestamp()
    });
    console.log('[Analytics] Cinema session logged:', docRef.id);
    return docRef.id;
  } catch (err) {
    console.warn('[Analytics] Failed to log session metadata:', err.message);
    return null;
  }
}
