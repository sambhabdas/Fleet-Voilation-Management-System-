import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/constants'

export function usePermission() {
  const { user } = useAuth()

  return {
    canEditDrivers: user?.role === ROLES.ADMIN,
    canGenerateReports: [ROLES.ADMIN, ROLES.MANAGER].includes(user?.role),
    canManageUsers: user?.role === ROLES.ADMIN,
    canCreateViolation: user?.role === ROLES.ADMIN,
  }
}
