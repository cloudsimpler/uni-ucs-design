function actorName(user) {
  return [user.nickname, user.username].find(value =>
    typeof value === 'string' && value.trim()
  )?.trim() || ''
}

function updateFields({ uid, name }, now = Date.now()) {
  return { updater_id: uid, updater_name: name, update_date: now }
}

function createFields(actor, now = Date.now()) {
  return {
    creator_id: actor.uid,
    creator_name: actor.name,
    create_date: now,
    ...updateFields(actor, now)
  }
}

module.exports = { actorName, createFields, updateFields }
