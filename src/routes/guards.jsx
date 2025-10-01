import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export function RequireAuth() {
  const { user } = useSelector((s) => s.auth || {})
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireRole({ role }) {
  const { user, profile } = useSelector((s) => s.auth || {})
  // If not authenticated, bounce to login
  if (!user) return <Navigate to="/login" replace />
  // While profile not loaded yet, render nothing to avoid mis-redirects
  if (!profile) return null
  // If role mismatch, redirect to the user's own dashboard route
  if (profile.user_type !== role) {
    const dest = profile.user_type === 'interviewer' ? '/interviewer' : '/interviewee'
    return <Navigate to={dest} replace />
  }
  return <Outlet />
}

// Prevent authenticated users from accessing public routes like /, /login, /signup
export function RedirectIfAuthed() {
  const { user, profile } = useSelector((s) => s.auth || {})
  if (user && profile) {
    const dest = profile.user_type === 'interviewer' ? '/interviewer' : '/interviewee'
    return <Navigate to={dest} replace />
  }
  return <Outlet />
}
