import { useState } from 'react'
import BrandMark from './BrandMark'
import { signIn, signUp, signInWithGoogle, resetPassword } from '../services/authService'

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      await signInWithGoogle()
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(friendlyError(err.code))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above, then click Forgot your password.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await resetPassword(email)
      setMessage('Password reset email sent. Check your inbox.')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp((current) => !current)
    setError('')
    setMessage('')
  }

  return (
    <div className="login-page">
      <div className="login-split">
        <aside className="login-aside">
          <img
            src="/megafiber-logo.png"
            alt="MegaFiber Networks"
            className="login-aside-logo"
          />
          <h2>MegaFiber Networks</h2>
          <p className="login-aside-subtitle">Network Log System</p>
          <p className="login-aside-tagline">
            Field and infrastructure activity, logged and tracked in one place.
          </p>
        </aside>

        <div className="login-form-panel">
          <BrandMark className="brand--card login-mobile-brand" />

          <h1>{isSignUp ? 'Create an account' : 'Login to your account'}</h1>
          <p>
            {isSignUp
              ? 'Enter your details below to create your account'
              : 'Enter your email below to login to your account'}
          </p>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleSubmit}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
              />
            </label>

            <div className="login-field">
              <div className="login-field-header">
                <span>Password</span>
                {!isSignUp && (
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={handleForgotPassword}
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="primary-button login-btn" disabled={isLoading}>
              {isLoading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create Account'
                  : 'Login'}
            </button>
          </form>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Login with Google
          </button>

          <p className="login-toggle">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={toggleMode}>
              {isSignUp ? 'Login' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
