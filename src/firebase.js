// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCFr0zmclnmKITo6UUHnLkS6A0HD0FsWQ",
  authDomain: "ipl-picks.firebaseapp.com",
  projectId: "ipl-picks",
  storageBucket: "ipl-picks.firebasestorage.app",
  messagingSenderId: "210585153880",
  appId: "1:210585153880:web:373f81c63717aadcbdb52d",
  measurementId: "G-2N11G90PYH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);