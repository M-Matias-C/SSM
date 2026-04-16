import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import Logger from '../utils/logger'

const logger = new Logger('PrivateRoute')

export function PrivateRoute({ children, requiredRole = null, excludeRoles = [] }) {
  const { user, isAuthenticated } = useAuthStore()
  const isAuth = isAuthenticated()

  if (!isAuth) {
    logger.warn('Attempted to access protected route without authentication')
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    logger.warn(`User ${user?.id} attempted to access ${requiredRole} route without permission`, {
      userRole: user?.role,
      requiredRole,
    })
    return <Navigate to="/" replace />
  }

  if (excludeRoles.length > 0 && excludeRoles.includes(user?.role)) {
    const dest = user?.role === 'farmacia' ? '/farmaceutico' : '/'
    return <Navigate to={dest} replace />
  }

  return children
}

export default PrivateRoute
