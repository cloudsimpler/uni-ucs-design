const { randomInt } = require('crypto')

const validUserNumber = value => typeof value === 'string' && /^[1-9]\d{9}$/.test(value)
const generateUserNumber = () => String(randomInt(1000000000, 10000000000))

// Retry only a duplicate on this index, never contact/root conflicts or uncertain writes.
function isNumberConflict(error) {
  const message = [error.message, error.errMsg, error.errorMessage].filter(Boolean).join(' ')
  return /user_no/i.test(message) && /duplicate|unique|重复|唯一|E11000/i.test(message)
}

async function createNumberedUser(record, insert, generate = generateUserNumber) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const user_no = generate()
    if (!validUserNumber(user_no)) throw new Error('UID生成结果无效')
    try {
      return await insert({ ...record, user_no })
    } catch (error) {
      if (!isNumberConflict(error)) throw error
    }
  }
  throw { errCode: 'USER_NUMBER_BUSY', errMsg: 'UID分配失败，请重试' }
}

module.exports = { generateUserNumber, validUserNumber, createNumberedUser }
