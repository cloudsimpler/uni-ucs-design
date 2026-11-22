const PLATFORM_TENANT_ID = '00000'
const TENANTS = 'ucsdb-tenants'
const PACKAGES = 'ucsdb-product-packages'

const platformTenant = {
  _id: PLATFORM_TENANT_ID,
  tenant_no: PLATFORM_TENANT_ID,
  name: '平台',
  type: 'platform',
  enabled: true
}

module.exports = { PLATFORM_TENANT_ID, TENANTS, PACKAGES, platformTenant }
