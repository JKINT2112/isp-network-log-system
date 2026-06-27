import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase/firebaseConfig'

const googleProvider = new GoogleAuthProvider()

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const signUp = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider)

export const resetPassword = (email) => sendPasswordResetEmail(auth, email)

export const logOut = () => signOut(auth)
