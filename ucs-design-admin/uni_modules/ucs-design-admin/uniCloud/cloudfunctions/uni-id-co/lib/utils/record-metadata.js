function actorName(user) {
  return [user.nickname, user.username].find(value =>
    typeof value === 'string' && value.trim()
  )?.trim() || ''
}

function updateFields({ uid = '', name = '' } = {}, now = Date.now()) {
  return { update_id: uid, update_name: name, update_date: now }
}

function createFields({ uid = '', name = '' } = {}, now = Date.now()) {
  return {
    create_id: uid,
    create_name: name,
    create_date: now,
    ...updateFields({ uid, name }, now)
  }
}

module.exports = { actorName, createFields, updateFields }
