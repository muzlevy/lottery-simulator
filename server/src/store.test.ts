import assert from 'assert'
import fs from 'fs'
import path from 'path'
import { addPoints, getOrCreateUser } from './store'

const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json')
const OPENID = 'unit_test_points_user'

function cleanup() {
  if (!fs.existsSync(DATA_FILE)) return
  const raw = fs.readFileSync(DATA_FILE, 'utf8')
  const data = JSON.parse(raw)
  delete data.users[OPENID]
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

cleanup()
const created = getOrCreateUser(OPENID)
assert.strictEqual(created.points, 0)

const after5 = addPoints(OPENID, 5)
assert.strictEqual(after5.points, 5)

const after10 = addPoints(OPENID, 10)
assert.strictEqual(after10.points, 15)

const reloaded = getOrCreateUser(OPENID)
assert.strictEqual(reloaded.points, 15)

cleanup()
console.log('[store] points persistence tests passed')
