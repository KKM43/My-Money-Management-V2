import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCNkzF3LvqbF6YBXgCnuUKC4xS10LkEsXg",
  authDomain: "moneymanagerapp-dfeab.firebaseapp.com",
  projectId: "moneymanagerapp-dfeab",
  storageBucket: "moneymanagerapp-dfeab.firebasestorage.app",
  messagingSenderId: "301274590441",
  appId: "1:301274590441:web:e430f291d05d542745d478"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
