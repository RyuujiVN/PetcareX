import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'
import { getApp, getApps, initializeApp } from 'firebase/app'
import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_WEB_API_KEY || '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_WEB_APP_ID || '').trim(),
  measurementId: (import.meta.env.VITE_FIREBASE_WEB_MEASUREMENT_ID || '').trim(),
}

const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId', 'appId']
const configKeyToEnvName = {
  apiKey: 'VITE_FIREBASE_WEB_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  appId: 'VITE_FIREBASE_WEB_APP_ID',
}

const missingFirebaseKeys = requiredConfigKeys.filter((key) => !firebaseConfig[key])

let firebaseApp = null
let firebaseAuth = null
let googleProvider = null

if (missingFirebaseKeys.length === 0) {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)
  firebaseAuth = getAuth(firebaseApp)
  googleProvider = new GoogleAuthProvider()
  googleProvider.setCustomParameters({ prompt: 'select_account' })
}

export const isFirebaseGoogleAuthReady = () => missingFirebaseKeys.length === 0

export const getFirebaseConfigError = () => {
  if (missingFirebaseKeys.length === 0) return ''

  return `Google Login chưa sẵn sàng. Thiếu biến môi trường: ${missingFirebaseKeys
    .map((key) => configKeyToEnvName[key])
    .join(', ')}`
}

export const initFirebaseAnalytics = async () => {
  if (!firebaseApp || !firebaseConfig.measurementId) return null

  if (typeof window === 'undefined') return null

  const analyticsSupported = await isAnalyticsSupported()
  if (!analyticsSupported) return null

  return getAnalytics(firebaseApp)
}

export const signInWithGooglePopupToken = async () => {
  if (!firebaseAuth || !googleProvider) {
    throw new Error(getFirebaseConfigError() || 'Firebase chưa được cấu hình đúng.')
  }

  const result = await signInWithPopup(firebaseAuth, googleProvider)
  const credential = GoogleAuthProvider.credentialFromResult(result)
  const googleIdToken = credential?.idToken

  if (!googleIdToken) {
    throw new Error('Không lấy được Google token. Vui lòng thử lại.')
  }

  const fullName = result.user?.displayName || result.user?.email?.split('@')?.[0] || 'Google User'
  const avatarUrl = result.user?.photoURL || ''

  return {
    googleIdToken,
    fullName,
    avatarUrl,
  }
}
