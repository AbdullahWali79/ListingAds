import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDkIG5Cuh48u8syommPl1eOoshBY7qbrps",
  authDomain: "classified-ads-app-4f856.firebaseapp.com",
  projectId: "classified-ads-app-4f856",
  storageBucket: "classified-ads-app-4f856.firebasestorage.app",
  messagingSenderId: "783962945706",
  appId: "1:783962945706:web:fb2141bfa104e780af38d3"
};

const app: FirebaseApp = initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

console.log("Firebase initialized successfully");

export default app;
