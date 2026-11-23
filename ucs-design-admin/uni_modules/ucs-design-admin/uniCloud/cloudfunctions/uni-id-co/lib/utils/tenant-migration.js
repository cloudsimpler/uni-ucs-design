const { PLATFORM_TENANT_ID, TENANTS, platformTenant } = require('./platform-tenant')
const { updateFields, createFields } = require('./record-metadata')
const { readDoc } = require('../../module/admin/tenant-scope')

const collections = [
  'uni-id-users', 'uni-id-roles', 'uni-id-tag', 'uni-id-log',
  'ucsdb-department',
  'ucsdb-assets', 'ucsdb-asset-groups', 'ucsdb-asset-references'
]

async function migrateTenantRecords(db, { assignments, actor, preview = true }) {
  if (!Array.isArray(assignments) || assignments.length === 0 || assignments.length > 100 ||
    !actor?.uid || typeof actor.name !== 'string') throw new Error('请提供 1–100 条已核对的归属及操作者')
  const rows = []
  const seen = new Set()
  for (const { collection, id, tenant_id } of assignments) {
    if (!collections.includes(collection) || typeof id !== 'string' || !id ||
      typeof tenant_id !== 'string' || !tenant_id || seen.has(collection + ':' + id)) throw new Error('迁移对象不正确或重复')
    seen.add(collection + ':' + id)
    const record = await readDoc(db, collection, id)
    if (!record) throw new Error('记录不存在：' + collection + '/' + id)
    if (record.tenant_id && record.tenant_id !== tenant_id) throw new Error('记录已有其他租户归属：' + id)
    if (tenant_id !== PLATFORM_TENANT_ID) {
      const tenant = await readDoc(db, TENANTS, tenant_id)
      if (!tenant || tenant.type !== 'enterprise') throw new Error('企业租户不存在：' + tenant_id)
      if (collection === 'ucsdb-assets' || collection === 'ucsdb-asset-references' || record.is_root || record.role?.includes('admin') ||
        (collection === 'uni-id-roles' && record.role_id === 'admin')) throw new Error('素材与平台超级管理员需要保留平台归属或单独处理：' + id)
    }
    rows.push({ collection, id, tenant_id, alreadyAssigned: record.tenant_id === tenant_id })
  }
  if (preview) return rows
  if (!await readDoc(db, TENANTS, PLATFORM_TENANT_ID))
    await db.collection(TENANTS).add({ ...platformTenant, ...createFields(actor) })
  const transaction = await db.startTransaction()
  try {
    for (const row of rows) {
      if (row.alreadyAssigned) continue
      const reference = transaction.collection(row.collection).doc(row.id)
      const current = await readDoc(transaction, row.collection, row.id)
      if (!current || (current.tenant_id && current.tenant_id !== row.tenant_id))
        throw new Error('迁移期间数据归属已变化：' + row.id)
      const patch = { tenant_id: row.tenant_id, ...updateFields(actor) }
      if (row.collection === 'uni-id-users') Object.assign(patch, { token: [], valid_token_date: Date.now() })
      await reference.update(patch)
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback().catch(() => {})
    throw error
  }
  return rows
}

module.exports = { migrateTenantRecords }
