import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAS_GxdKjvzYqVOhjbADoKOQG4PmtYyJg8",
  authDomain: "finalassessment-56612.firebaseapp.com",
  projectId: "finalassessment-56612",
  storageBucket: "finalassessment-56612.firebasestorage.app",
  messagingSenderId: "179739558721",
  appId: "1:179739558721:web:da4fcc30d14de2328f17c0",
  measurementId: "G-JYJ1M3YJ4G"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const checkOnboardingStatus = async (userId) => {
  try {
    if (!userId) return false;
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data().onboardingCompleted : false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const completeOnboarding = async (userId) => {
  try {
    if (!userId) return;
    
    await setDoc(doc(db, 'users', userId), {
      onboardingCompleted: true,
      completedAt: new Date(),
      lastLogin: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
  }
};

export const initializeUserDocument = async (userId, userData = {}) => {
  try {
    if (!userId) return;
    
    await setDoc(doc(db, 'users', userId), {
      createdAt: new Date(),
      onboardingCompleted: false,
      lastLogin: new Date(),
      ...userData
    }, { merge: true });
  } catch (error) {
    console.error('Error initializing user document:', error);
  }
};

export const sendPasswordResetEmail = async (email) => {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default app;