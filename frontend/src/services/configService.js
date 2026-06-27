import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

const membersCollection = collection(db, 'teamMembers')
const devicesCollection = collection(db, 'devices')
const activityTypesCollection = collection(db, 'activityTypes')

const fromSnapshot = (snapshot) =>
  snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))

const stripId = ({ id, ...rest }) => rest

const normalizeEmail = (email) => (email || '').trim().toLowerCase()

export const getTeamMembers = async () => {
  const snapshot = await getDocs(membersCollection)
  return fromSnapshot(snapshot)
}

// Team members are keyed by their lowercased email so Firestore security
// rules can resolve a signed-in user's access level via get(...).
export const addTeamMember = (data) => {
  const email = normalizeEmail(data.email)
  return setDoc(doc(db, 'teamMembers', email), { ...stripId(data), email })
}

export const updateTeamMember = (id, data) =>
  updateDoc(doc(db, 'teamMembers', id), stripId(data))

export const deleteTeamMember = (id) =>
  deleteDoc(doc(db, 'teamMembers', id))

export const getDevices = async () => {
  const snapshot = await getDocs(devicesCollection)
  return fromSnapshot(snapshot)
}

export const addDevice = (data) => addDoc(devicesCollection, stripId(data))

export const updateDevice = (id, data) =>
  updateDoc(doc(db, 'devices', id), stripId(data))

export const deleteDevice = (id) => deleteDoc(doc(db, 'devices', id))

export const getActivityTypes = async () => {
  const snapshot = await getDocs(activityTypesCollection)
  return fromSnapshot(snapshot)
}

export const addActivityType = (data) =>
  addDoc(activityTypesCollection, stripId(data))

export const updateActivityType = (id, data) =>
  updateDoc(doc(db, 'activityTypes', id), stripId(data))

export const deleteActivityType = (id) =>
  deleteDoc(doc(db, 'activityTypes', id))
