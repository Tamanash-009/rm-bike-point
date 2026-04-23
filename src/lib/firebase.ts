import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export async function syncUser(user: User, additionalData?: { displayName?: string }) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // First login
    const isAdmin = user.email === "chakrabortytamanash@gmail.com";
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: additionalData?.displayName || user.displayName || 'Rider',
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
      role: isAdmin ? 'admin' : 'client',
      loyaltyPoints: 0,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      devices: [navigator.userAgent],
    });
  } else {
    // Update last login and check device limit
    const userData = userSnap.data();
    const existingDevices = userData.devices || [];
    const currentDevice = navigator.userAgent;
    
    let updatedDevices = [...existingDevices];
    if (!existingDevices.includes(currentDevice)) {
      if (existingDevices.length >= 2) {
        // Simple rotation logic for device limit
        updatedDevices = [existingDevices[existingDevices.length - 1], currentDevice];
      } else {
        updatedDevices.push(currentDevice);
      }
    }

    await setDoc(userRef, {
      lastLogin: serverTimestamp(),
      devices: updatedDevices,
    }, { merge: true });
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
