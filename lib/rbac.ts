// lib/rbac.ts - Simplified version
export type Permission = 'manage_users' | 'manage_subscriptions' | 'view_analytics' | 'manage_billing';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: [
    'manage_users',
    'manage_subscriptions',
    'view_analytics',
    'manage_billing',
  ],
  USER: [],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function requirePermission(role: string, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`);
  }
}