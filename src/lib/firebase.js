// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: "AIzaSyBmLA25wsbkq1iJNwF4TwflA2-Wfs81nKk",
	authDomain: "pearl-backend.firebaseapp.com",
	projectId: "pearl-backend",
	storageBucket: "pearl-backend.firebasestorage.app",
	messagingSenderId: "613291985965",
	appId: "1:613291985965:web:17e0141e6140107a20fca4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
