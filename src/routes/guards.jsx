import { Navigate, Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

export function RequireAuth() {
  const { user } = useSelector((s) => s.auth || {})
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RequireRole({ role }) {
  const { profile } = useSelector((s) => s.auth || {})
  if (!profile || profile.user_type !== role) return <Navigate to="/" replace />
  return <Outlet />
}