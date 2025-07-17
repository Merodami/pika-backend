// import { customRoles } from '@pika/config'
// import { getEnvVariable } from '@pika/environment'
// import { getAvailableRoles } from '@pika/shared'
// s
// function mapRoleToPermissions(
//   role: string,
//   availableRoles: ReturnType<typeof getAvailableRoles>,
// ) {
//   // e.g. admin:editor, which maps to service:create, patron:edit, ...
//   const [portalName, roleType] = role.split(':', 2)

//   if (!availableRoles.hasOwnProperty(portalName)) {
//     throw { status_code: 400, message: `portal does not exist: ${portalName}` }
//   }

//   const portal = (availableRoles as any)[portalName]
//   const permissions = []

//   for (const [action, capability] of Object.entries(portal)) {
//     if (
//       // `{ 'order:read': true }` provides "order:read" permission for all roles
//       capability === true ||
//       // `{ 'order:read': { editor: true } }` provides "order:read" permission
//       // only for "editor" role
//       (capability as any)[roleType]
//     ) {
//       permissions.push(action)
//     }
//   }

//   return permissions
// }

// export function mapRolesToPermissions(userRoles: string[]) {
//   const tenant = getEnvVariable('TENANT', String)
//   const additionalRoles = (customRoles as any)[tenant] ?? []
//   const availableRoles = getAvailableRoles(additionalRoles)
//   const permissions = []

//   for (const role of userRoles) {
//     permissions.push(...mapRoleToPermissions(role, availableRoles))
//   }

//   return Array.from(new Set(permissions)).sort()
// }
