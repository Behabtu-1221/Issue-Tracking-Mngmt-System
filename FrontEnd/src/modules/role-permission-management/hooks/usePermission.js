import { usePermissionContext } from '../contexts/PermissionContext';

/**
 * Custom hook for permission evaluation inside any component or page.
 * Usage:
 *   const { hasPermission, isParkAdmin, isCompanyAdmin } = usePermission();
 *   if (hasPermission('Request.Approve')) { ... }
 */
export function usePermission() {
  return usePermissionContext();
}

export default usePermission;
