import fs from 'fs'
import path from 'path'

export interface UserRecord {
  openid: string
  points: number
  updatedAt: string
}

interface StoreData {
  users: Record<string, UserRecord>
}

const DATA_DIR = path.join(__dirname, '..', 'data')
const DATA_FILE = path.join(DATA_DIR, 'users.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function writeStore(data: StoreData) {
  ensureDir()
  const tempFile = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8')
  fs.renameSync(tempFile, DATA_FILE)
}

function readStore(): StoreData {
  ensureDir()
  if (!fs.existsSync(DATA_FILE)) {
    const empty: StoreData = { users: {} }
    writeStore(empty)
    return empty
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8')
  try {
    const parsed = JSON.parse(raw) as StoreData
    return {
      users: parsed.users || {},
    }
  } catch {
    return { users: {} }
  }
}

export function getOrCreateUser(openid: string): UserRecord {
  const store = readStore()
  const existing = store.users[openid]
  if (existing) {
    return existing
  }

  const created: UserRecord = {
    openid,
    points: 0,
    updatedAt: new Date().toISOString(),
  }
  store.users[openid] = created
  writeStore(store)
  return created
}

export function addPoints(openid: string, delta: number): UserRecord {
  const store = readStore()
  const current = store.users[openid] || {
    openid,
    points: 0,
    updatedAt: new Date().toISOString(),
  }
  const next: UserRecord = {
    openid,
    points: Math.max(0, current.points + delta),
    updatedAt: new Date().toISOString(),
  }
  store.users[openid] = next
  writeStore(store)
  return next
}
