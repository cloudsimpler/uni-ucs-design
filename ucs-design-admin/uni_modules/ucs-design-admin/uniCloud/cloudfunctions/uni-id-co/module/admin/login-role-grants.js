const { actorName, updateFields } = require('../../lib/utils/record-metadata')
const { ownerOf, readDoc } = require('./tenant-scope')

async function cleanLoginRoleGrants(db, user, roles, { permissions, menuIds }) {
  const tenantId = ownerOf(user)
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
  const staleRoles = roles.filter(role => role.tenant_id === tenantId && role.role_id !== 'admin' && Object.keys(changesFor(role)).length)
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
