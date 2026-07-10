// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGMv2IKRXerzJMVJMAkgPKH4fViVroOWo",
  authDomain: "evaluacion-info.firebaseapp.com",
  projectId: "evaluacion-info",
  storageBucket: "evaluacion-info.firebasestorage.app",
  messagingSenderId: "528270460854",
  appId: "1:528270460854:web:b89136f649f485cda66317"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };