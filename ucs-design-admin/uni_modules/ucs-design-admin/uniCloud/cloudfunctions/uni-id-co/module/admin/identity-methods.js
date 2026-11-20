const { createUserAdmin } = require('./user-admin')
const { accountTypeOf, hasAccountType } = require('./account-types')
const { findUser } = require('../../lib/utils/account')
const { createHash } = require('crypto')
const PasswordUtils = require('../../lib/utils/password')
const accountSnapshot = user => createHash('sha256').update(JSON.stringify([user._id, user.mobile, user.email, accountTypeOf(user), user.status || 0, user.nickname, user.gender, user.role, user.dcloud_appid, user.department_id, Boolean(user.password)])).digest('hex')
const { mutateIdentity } = require('../../lib/utils/identity-lifecycle')
const fail = (errMsg) => { throw { errCode: 'ACCOUNT_IDENTITY_INVALID', errMsg } }
const typeOfMethod = context => 0
const service = context => createUserAdmin({ db: uniCloud.database(), uid: context.authInfo.uid,
  appId: context.getUniversalClientInfo().appId, accountType: typeOfMethod(context) })

async function findAccount(params = {}) {
  const admin = service(this), auth = await admin.authorize('create')
  const mobileCheck = params.mobile !== undefined
  if (mobileCheck && (typeof params.mobile !== 'string' || !/^1\d{10}$/.test(params.mobile))) fail('请输入有效的 11 位手机号')
  if (!mobileCheck && (typeof params.keyword !== 'string' || !params.keyword.trim() || params.keyword.length > 100)) fail('请输入完整账号、手机号或邮箱')
  const keyword = mobileCheck ? params.mobile : params.keyword.trim()
  const { userMatched } = await findUser({ userQuery: mobileCheck ? { mobile: keyword } : { username: keyword, mobile: keyword, email: keyword }, uniqueAccountType: 0 })
  if (userMatched.length > 1) fail('账号或联系方式匹配多个账号，请先处理重复数据')
  const user = userMatched[0]
  if (!user && mobileCheck) return { errCode: 0, found: false, data: null }
  if (!user) fail('未找到账号，请使用新增账号')
  if (!auth.isAdmin && (user.is_root || user.role?.includes('admin') || hasAccountType(user, 0))) fail('无权关联该账号')
  if (!mobileCheck && (user.status || 0) !== 0) fail('账号已停用或注销，不能开通身份')
  if (!mobileCheck && hasAccountType(user, typeOfMethod(this))) fail('该账号已具有当前身份')
  return { errCode: 0, found: true, alreadyEnrolled: hasAccountType(user, typeOfMethod(this)),
    canEnroll: (user.status || 0) === 0 && !hasAccountType(user, typeOfMethod(this)),
    snapshot: accountSnapshot(user), data: { _id: user._id, username: user.username || '', nickname: user.nickname || '',
    has_password: Boolean(user.password),
    avatar: user.avatar || '', register_date: user.register_date, status: user.status || 0,
    gender: user.gender, mobile: user.mobile || '', account_type: accountTypeOf(user) } }
}

const { updateFields } = require('../../lib/utils/record-metadata')

async function enroll(params = {}) {
  if (Object.keys(params).some(key => !['uid', 'nickname', 'password', 'gender', 'role', 'department_id', 'snapshot'].includes(key))) fail('开通身份不允许修改账号凭据和共享资料')
  if (typeof params.uid !== 'string' || !params.uid || params.uid.length > 100) fail('账号参数无效')
  if (params.role !== undefined && (!Array.isArray(params.role) || params.role.some(id => typeof id !== 'string'))) fail('角色格式无效')
  const type = typeOfMethod(this), admin = service(this), auth = await admin.authorize('create')
  const old = await admin.getUser(params.uid)
  if (!old || (old.status || 0) !== 0) fail('账号不存在、已停用或注销')
  if (params.snapshot !== undefined && params.snapshot !== accountSnapshot(old)) fail('账号资料或身份已变化，请重新核验')
  if (hasAccountType(old, type)) fail('该账号已具有当前身份')
  if (!auth.isAdmin && (old.is_root || hasAccountType(old, 0))) fail('无权关联该账号')
  const role = [...new Set([...(old.role || []), ...(params.role || [])])]
  const nickname = old.nickname || params.nickname
  if (old.nickname && params.nickname !== undefined && params.nickname !== old.nickname) fail('开通身份不能覆盖已有昵称')
  const gender = [1, 2].includes(old.gender) ? old.gender : params.gender
  // Reuse role/menu grant bounds and employee profile validation without allowing
  // an enrollment request to overwrite the existing password or contact details.
  await admin.validateChange({ username: old.username || '', nickname, gender, mobile: old.mobile || '',
    role, ...(params.department_id ? { department_id: params.department_id } : {}) }, undefined, auth)
  let passwordData
  if (old.password) {
    if (params.password !== undefined) fail('该账号已设置密码，开通身份不能覆盖已有密码')
  } else {
    this.middleware.validate({ password: params.password }, { password: 'password' })
    const passwordUtils = new PasswordUtils({ clientInfo: this.getUniversalClientInfo(), passwordSecret: this.config.passwordSecret })
    const { passwordHash, version } = passwordUtils.generatePasswordHash({ password: params.password })
    passwordData = { password: passwordHash, password_secret_version: version }
  }
  const actor = await admin.getUser(this.authInfo.uid)
  const result = await mutateIdentity(uniCloud.database(), old._id, async current => {
    if (JSON.stringify(current) !== JSON.stringify(old)) fail('账号资料已变化，请重新查询后开通')
    const latestActor = await admin.getUser(this.authInfo.uid)
    if (JSON.stringify(latestActor) !== JSON.stringify(actor)) fail('操作者授权已变化，请重新操作')
    const patch = { account_type: [...accountTypeOf(current), type].sort(), role, ...updateFields(auth) }
    if (passwordData) Object.assign(patch, passwordData)
    if (!current.nickname && nickname) patch.nickname = nickname
    if (![1, 2].includes(current.gender)) patch.gender = gender
    if (type === 0 && params.department_id) patch.department_id = params.department_id
    return patch
  })
  return { errCode: 0, account_type: accountTypeOf(result) }
}
async function checkEmployeeMobile(params = {}) {
  this.middleware.validate(params, { uid: 'string', mobile: 'mobile' })
  const admin = service(this), auth = await admin.authorize('update')
  const old = await admin.getUser(params.uid)
  await admin.validateChange({ uid: params.uid, mobile: params.mobile }, old, auth)
  const { userMatched } = await findUser({ userQuery: { mobile: params.mobile }, uniqueAccountType: 0 })
  if (userMatched.some(user => user._id !== params.uid)) fail('该手机号已被其他账号使用，请更换手机号')
  return { errCode: 0, mobile: params.mobile }
}
module.exports = { checkEmployeeMobile, findAccountForDeveloper: findAccount, findAccountForEmployee: findAccount,
  enrollDeveloper: enroll, enrollEmployee: enroll }
