import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyADtF-0xq1nb5WC5qGhB3bc938wWce7_6U",
  authDomain: "cafe-order-3e0cc.firebaseapp.com",
  projectId: "cafe-order-3e0cc",
  storageBucket: "cafe-order-3e0cc.firebasestorage.app",
  messagingSenderId: "254141482227",
  appId: "1:254141482227:web:e6d4eee0cf36da224a2386",
  databaseURL: "https://cafe-order-3e0cc-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);