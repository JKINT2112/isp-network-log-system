import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'

const logsCollection = collection(db, 'logs')

const toFirestoreLog = (logData) => ({
  dateTime: logData.dateTime,
  engineerName: logData.engineerName,
  role: logData.role,
  site: logData.site || logData.siteBranch,
  device: logData.device || logData.deviceServer,
  ipAddress: logData.ipAddress,
  activityType: logData.activityType,
  status: logData.status,
  remarks: logData.remarks,
  engineerId: logData.engineerId || '',
  deviceId: logData.deviceId || '',
})

const fromFirestoreLog = (documentSnapshot) => {
  const data = documentSnapshot.data()

  return {
    id: documentSnapshot.id,
    ...data,
    siteBranch: data.site || '',
    deviceServer: data.device || '',
  }
}

export const addLog = (logData) =>
  addDoc(logsCollection, {
    ...toFirestoreLog(logData),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

export const getLogs = async () => {
  const logsQuery = query(logsCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(logsQuery)

  return snapshot.docs.map(fromFirestoreLog)
}

export const updateLog = (logId, updatedData) =>
  updateDoc(doc(db, 'logs', logId), {
    ...toFirestoreLog(updatedData),
    updatedAt: serverTimestamp(),
  })

export const deleteLog = (logId) => deleteDoc(doc(db, 'logs', logId))
