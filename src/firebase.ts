import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "flowing-gasket-v6d0h",
  appId: firebaseConfigData.appId || "1:676068255824:web:6ea77ed326e84807420955",
  apiKey: firebaseConfigData.apiKey || "",
  authDomain: firebaseConfigData.authDomain || `${firebaseConfigData.projectId}.firebaseapp.com`,
  storageBucket: firebaseConfigData.storageBucket || `${firebaseConfigData.projectId}.firebasestorage.app`,
  messagingSenderId: firebaseConfigData.messagingSenderId || "676068255824",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use custom Firestore Database ID if specified
const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, databaseId);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const authError = error as { code?: string; message?: string };
    // If popup was blocked or closed in iframe, attempt redirect
    if (authError.code === 'auth/popup-blocked' || authError.code === 'auth/popup-closed-by-user') {
      console.warn('Popup blocked or closed, falling back to redirect flow...');
      await signInWithRedirect(auth, googleProvider);
      const redirectResult = await getRedirectResult(auth);
      if (redirectResult?.user) {
        return redirectResult.user;
      }
    }
    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  await signOut(auth);
};

export const getIdToken = async (): Promise<string | null> => {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken(true);
};

export { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  onAuthStateChanged,
  type User
};
