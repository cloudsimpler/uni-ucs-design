async function checkLoginToken(context, token) {
  const payload = await context.uniIdCommon.checkToken(token, { autoRefresh: false })
  if (payload.errCode) throw payload
  // Older deployments signed delegation credentials with the login token key.
  if (Object.hasOwn(payload, 'ucsDelegation')) throw { errCode: 'uni-id-check-token-failed' }
  return payload
}

module.exports = { checkLoginToken }
