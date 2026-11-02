import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBQ3fOa8s6ap4JV39usOTbgzuwCp2GSVLw",
  authDomain: "cscid-d28e7.firebaseapp.com",
  projectId: "cscid-d28e7",
  storageBucket: "cscid-d28e7.firebasestorage.app",
  messagingSenderId: "677126002730",
  appId: "1:677126002730:web:6f44a7ad295d098a538b53",
  measurementId: "G-R15X3R0LXR"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Inisialisasi Analytics (Opsional, pastikan berjalan hanya di sisi client/browser)
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Inisialisasi Auth & Google Provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged };
