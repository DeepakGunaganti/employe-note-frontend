// employer-notification-frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// This has been updated with the config you provided.
const firebaseConfig = {
  apiKey: "AIzaSyDcHRCARn5GBPvROv6tp-4w6mHO9J7He48",
  authDomain: "employer-notification-app-auth.firebaseapp.com",
  projectId: "employer-notification-app-auth",
  storageBucket: "employer-notification-app-auth.firebasestorage.app",
  messagingSenderId: "80107512964",
  appId: "1:80107512964:web:825b57ea937091d5f3ced1",
  measurementId: "G-PQT45RMV02"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// You can export other Firebase services here if you initialize them
// import { getFirestore } from "firebase/firestore";
// export const db = getFirestore(app);
