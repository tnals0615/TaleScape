// Import the functions you need from the SDKs you need
// export한것만 쓸 수 있음.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, where, updateDoc, deleteDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTB-W-mxgGkU-ugWXtL3l5G7B7QfhWHgM",
  authDomain: "talescape-d61b8.firebaseapp.com",
  projectId: "talescape-d61b8",
  storageBucket: "talescape-d61b8.firebasestorage.app",
  messagingSenderId: "391020372559",
  appId: "1:391020372559:web:8a6d20ae84e2bfe5ae403a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, addDoc, collection, getDoc, doc, onSnapshot, query, orderBy, where, updateDoc, deleteDoc, getDocs };