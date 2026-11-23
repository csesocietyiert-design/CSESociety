const financeEntryManagerRoles = new Set([
  'treasurer',
  'secretary',
  'general_secretary',
  'technical_secretary',
  'cultural_secretary',
]);

export function canManageFinanceEntries(role: string) {
  return role === 'admin' || financeEntryManagerRoles.has(role);
}

export function canViewPendingFinanceEntries(role: string) {
  return canManageFinanceEntries(role);
}