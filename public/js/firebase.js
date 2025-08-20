// @ts-nocheck
// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



const firebaseConfig = {
  apiKey: "AIzaSyAe52fWPYRgfwmkfhT1oq17cG3brSiQxfA",
  authDomain: "youngt-5717b.firebaseapp.com",
  projectId: "youngt-5717b",
  storageBucket: "youngt-5717b.appspot.com",
  messagingSenderId: "824452788058",
  appId: "1:824452788058:web:c968088ae259c546b10d63"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

const getFirebaseErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé par un autre compte.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    case 'auth/user-not-found':
      return 'Aucun utilisateur trouvé avec cet email.';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect.';
    case 'auth/popup-closed-by-user':
      return 'La fenêtre de connexion a été fermée.';
    case 'auth/network-request-failed':
      return 'Erreur de réseau. Veuillez vérifier votre connexion.';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer plus tard.';
    case 'auth/user-disabled':
      return 'Ce compte a été désactivé.';
    case 'auth/operation-not-allowed':
      return 'Cette opération n\'est pas autorisée.';
    default:
      return error.message || 'Une erreur est survenue. Veuillez réessayer.';
  }
};

export { 
  app,
  auth, 
  db,
  googleProvider, 
  facebookProvider,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc, 
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  getFirebaseErrorMessage
};