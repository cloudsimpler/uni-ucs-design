const {
  dbCmd,
  userCollection
} = require('../../common/constants')
const {
  USER_IDENTIFIER
} = require('../../common/constants')
const { PLATFORM_TENANT_ID } = require('./platform-tenant')
const { tenantWhere } = require('../../module/admin/tenant-scope')
const {
  batchFindObjctValue,
  getType,
  isMatchUserApp
} = require('../../common/utils')

/**
 * 查询满足条件的用户
 * @param {Object} params
 * @param {Object} params.userQuery 用户唯一标识组成的查询条件
 * @param {Object} params.authorizedApp 用户允许登录的应用
 * @returns userMatched 满足条件的用户列表
 */
async function findUser (params = {}) {
  const {
    userQuery,
    authorizedApp = [],
    matchAllApps = false,
    accountTypes,
    uniqueAccountType,
    tenantId = PLATFORM_TENANT_ID
  } = params
  const typeCondition = types => types.includes(0)
    ? dbCmd.or([{ account_type: dbCmd.in(types) }, { account_type: dbCmd.exists(false) }])
    : { account_type: dbCmd.in(types) }
  const uniqueTypes = Array.isArray(uniqueAccountType) ? uniqueAccountType : [uniqueAccountType]
  const condition = getUserQueryCondition(userQuery, uniqueAccountType !== undefined).map(query =>
    uniqueAccountType !== undefined && query.mobile
      ? dbCmd.and([query, typeCondition(uniqueTypes)])
      : query
  )
  if (condition.length === 0) {
    throw new Error('Invalid user query')
  }
  const authorizedAppType = getType(authorizedApp)
  if (authorizedAppType !== 'string' && authorizedAppType !== 'array') {
    throw new Error('Invalid authorized app')
  }

  let finalQuery

  if (condition.length === 1) {
    finalQuery = condition[0]
  } else {
    finalQuery = dbCmd.or(condition)
  }
  if (accountTypes) finalQuery = dbCmd.and([finalQuery, typeCondition(accountTypes)])
  const userQueryRes = await userCollection.where(dbCmd.and([finalQuery, tenantWhere({ command: dbCmd }, tenantId)])).get()
  return {
    total: userQueryRes.data.length,
    userMatched: userQueryRes.data.filter(item => {
      return uniqueAccountType !== undefined || matchAllApps || isMatchUserApp(item.dcloud_appid, authorizedApp)
    })
  }
}

function getUserIdentifier (userRecord = {}) {
  const keys = Object.keys(USER_IDENTIFIER)
  return batchFindObjctValue(userRecord, keys)
}

function getUserQueryCondition (userRecord = {}, uniqueness = false) {
  const userIdentifier = getUserIdentifier(userRecord)
  const condition = []
  for (const key in userIdentifier) {
    const value = userIdentifier[key]
    if (!value) {
      // 过滤所有value为假值的条件，在查询用户时没有意义
      continue
    }
    const queryItem = {
      [key]: value
    }
    // 邮箱兼容旧数据；账号始终按原始大小写精确匹配。
    if (key === 'mobile') {
      queryItem.mobile_confirmed = 1
    } else if (key === 'email') {
      if (!uniqueness) queryItem.email_confirmed = 1
      const email = userIdentifier.email
      if (email.toLowerCase() !== email) {
        condition.push({
          email: email.toLowerCase(),
          ...(!uniqueness ? { email_confirmed: 1 } : {})
        })
      }
    } else if (key === 'identities') {
      queryItem.identities = dbCmd.elemMatch(value)
    }
    if (uniqueness && key === 'email') {
      queryItem[key] = new RegExp('^' + value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
    }
    condition.push(queryItem)
  }
  return condition
}

module.exports = {
  findUser,
  getUserIdentifier
}
