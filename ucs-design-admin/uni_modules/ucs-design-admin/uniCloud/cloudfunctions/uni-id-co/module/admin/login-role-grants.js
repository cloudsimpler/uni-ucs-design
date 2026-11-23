const { PLATFORM_TENANT_ID, TENANTS } = require('../../lib/utils/platform-tenant')
const { actorName, updateFields } = require('../../lib/utils/record-metadata')
const { accessContext } = require('./admin-access')
const { enterprisePackageGrants, ownerOf, readDoc } = require('./tenant-scope')

async function cleanLoginRoleGrants(db, user) {
  const tenantId = ownerOf(user)
  const roleIds = (user.role || []).filter(id => id !== 'admin')
  if (tenantId === PLATFORM_TENANT_ID || !roleIds.length) return

  const { all } = accessContext({ db })
  const [tenant, roles] = await Promise.all([
    readDoc(db, TENANTS, tenantId),
    all('uni-id-roles', { tenant_id: tenantId, role_id: db.command.in(roleIds) })
  ])
  if (!tenant || !roles.length) return

  const { permissions, menuIds } = await enterprisePackageGrants(db, tenant)
  const allowedPermissions = new Set(permissions)
  const allowedMenus = new Set(menuIds)
  const changesFor = role => {
    const patch = {}
    const permission = (role.permission || []).filter(id => allowedPermissions.has(id))
    const menuIds = (role.menu_ids || []).filter(id => allowedMenus.has(id))
    if (permission.length < (role.permission || []).length) patch.permission = permission
    if (menuIds.length < (role.menu_ids || []).length) patch.menu_ids = menuIds
    return patch
  }
  const staleRoles = roles.filter(role => Object.keys(changesFor(role)).length)
  if (!staleRoles.length) return

  const transaction = await db.startTransaction()
  try {
    const metadata = updateFields({ uid: user._id, name: actorName(user) })
    for (const role of staleRoles) {
      const current = await readDoc(transaction, 'uni-id-roles', role._id)
      if (current?.tenant_id !== tenantId || current.role_id !== role.role_id) continue
      const patch = changesFor(current)
      if (Object.keys(patch).length) {
        await transaction.collection('uni-id-roles').doc(role._id).update({ ...patch, ...metadata })
      }
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

module.exports = { cleanLoginRoleGrants }
