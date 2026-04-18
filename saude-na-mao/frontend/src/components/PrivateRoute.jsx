import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/store'
import { PHARMACY_ROLES } from '../constants'
import Logger from '../utils/logger'

const logger = new Logger('PrivateRoute')

export function PrivateRoute({ children, requiredRole = null, requiredRoles = null, excludeRoles = [] }) {
  const { user, isAuthenticated } = useAuthStore()
  const isAuth = isAuthenticated()

  if (!isAuth) {
    logger.warn('Attempted to access protected route without authentication')
    return <Navigate to="/login" replace />
  }

  // Support single role or array of roles
  const allowed = requiredRoles || (requiredRole ? [requiredRole] : null)
  if (allowed && !allowed.includes(user?.role)) {
    logger.warn(`User ${user?.id} attempted to access restricted route without permission`, {
      userRole: user?.role,
      requiredRoles: allowed,
    })
    return <Navigate to="/" replace />
  }

  if (excludeRoles.length > 0 && excludeRoles.includes(user?.role)) {
    const dest = PHARMACY_ROLES.includes(user?.role) ? '/farmaceutico' : user?.role === 'entregador' ? '/entregas' : '/'
    return <Navigate to={dest} replace />
  }

  return children
}

export default PrivateRoute
