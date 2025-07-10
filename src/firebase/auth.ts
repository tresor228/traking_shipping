import { auth } from "@/firebase/firebaseConfig";

export async function signInWithEmailAndPassword(email: string, password: string) {
  return await firebase.auth().signInWithEmailAndPassword(auth, email, password);
}

export async function sendPasswordResetEmail(email: string) {
  return await firebase.auth().sendPasswordResetEmail(auth, email);
}