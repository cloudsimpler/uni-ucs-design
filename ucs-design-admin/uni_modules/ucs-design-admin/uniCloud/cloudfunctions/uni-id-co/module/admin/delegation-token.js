const { createHmac, timingSafeEqual } = require('crypto')
const { fail } = require('./tenant-scope')

const format = 'ucs-delegation-v1'
const base64url = /^[A-Za-z0-9_-]+$/

function signature(context, message) {
  const key = createHmac('sha256', context.config.tokenSecret).update('ucs-admin/delegation/v1').digest()
  return createHmac('sha256', key).update(message).digest('base64url')
}

function signDelegationToken(context, { uid, scope, expiresAt }) {
  const now = Math.floor(Date.now() / 1000)
  const exp = Math.min(Math.floor(expiresAt / 1000), now + Math.floor(context.config.tokenExpiresIn))
  if (!Number.isSafeInteger(exp) || exp <= now)
    fail('登录会话已失效，请重新登录', 'uni-id-token-expired')

  const payload = Buffer.from(JSON.stringify({ uid, exp, ucsDelegation: scope })).toString('base64url')
  const message = `${format}.${payload}`
  return { token: `${message}.${signature(context, message)}`, tokenExpired: exp * 1000 }
}

function verifyDelegationToken(context, token) {
  if (typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== format || !base64url.test(parts[1]) ||
    parts[2].length !== 43 || !base64url.test(parts[2])) return null

  const expected = signature(context, `${format}.${parts[1]}`)
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(parts[2]))) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (typeof payload?.uid !== 'string' || !payload.uid || !Number.isSafeInteger(payload.exp) ||
    payload.exp * 1000 <= Date.now()) return null
  return payload
}

module.exports = { signDelegationToken, verifyDelegationToken }
