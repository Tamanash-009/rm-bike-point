import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  points: number;
  type: 'earn' | 'redeem';
  reason: string;
  createdAt: any;
}

export const LOYALTY_RULES = {
  POINTS_PER_RS: 0.1, // 1 point per 10 Rs
  BOOKING_POINTS: 50,
  REDEMPTION_RATE: 0.1, // 100 points = 10 Rs (1 point = 0.1 Rs)
};

export const awardPoints = async (userId: string, points: number, reason: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    const currentPoints = userSnap.exists() ? (userSnap.data().loyaltyPoints || 0) : 0;
    const newPoints = currentPoints + points;

    await updateDoc(userRef, {
      loyaltyPoints: newPoints
    });

    await addDoc(collection(db, 'loyaltyTransactions'), {
      userId,
      points,
      type: 'earn',
      reason,
      createdAt: serverTimestamp()
    });

    return newPoints;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'loyaltyTransactions');
    throw error;
  }
};

export const redeemPoints = async (userId: string, points: number, discountAmount: number, reason: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    const currentPoints = userSnap.exists() ? (userSnap.data().loyaltyPoints || 0) : 0;
    
    if (currentPoints < points) {
      throw new Error("Insufficient points");
    }

    const newPoints = currentPoints - points;

    await updateDoc(userRef, {
      loyaltyPoints: newPoints
    });

    await addDoc(collection(db, 'loyaltyTransactions'), {
      userId,
      points: -points,
      type: 'redeem',
      reason: `${reason} (₹${discountAmount} discount)`,
      createdAt: serverTimestamp()
    });

    return newPoints;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'loyaltyTransactions');
    throw error;
  }
};

export const getUserPoints = (userId: string, callback: (points: number) => void) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    callback(doc.exists() ? (doc.data().loyaltyPoints || 0) : 0);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${userId}`);
  });
};

export const getLoyaltyTransactions = (userId: string, callback: (transactions: LoyaltyTransaction[]) => void) => {
  const q = query(
    collection(db, 'loyaltyTransactions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as LoyaltyTransaction)));
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'loyaltyTransactions');
  });
};
