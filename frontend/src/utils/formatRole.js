export function formatRole(memberOrRole) {
  if (typeof memberOrRole === 'string') return memberOrRole
  if (Array.isArray(memberOrRole)) return memberOrRole.join(', ')
  if (memberOrRole?.role) return memberOrRole.role
  return (memberOrRole?.roles || []).join(', ')
}
