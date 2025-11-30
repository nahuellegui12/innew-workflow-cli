// Persistencia GLOBAL por usuario + scoping por repo; migración desde archivo legacy
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execa } from 'execa'

function getUserConfigDir () {
  const home = os.homedir()
  return process.env.XDG_CONFIG_HOME
    ? process.env.XDG_CONFIG_HOME
    : (process.env.APPDATA || path.join(home, '.config'))
}

const CONFIG_DIR = path.join(getUserConfigDir(), 'innew')
const HISTORY_PATH = path.join(CONFIG_DIR, 'history.json')
const MAX_ENTRIES = 50

function ensureDir () {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })
}

export async function getRepoRoot () {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--show-toplevel'])
    return stdout.trim()
  } catch {
    return null
  }
}

export function readHistoryRaw () {
  if (!fs.existsSync(HISTORY_PATH)) return []
  try {
    const raw = fs.readFileSync(HISTORY_PATH, 'utf8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function writeHistoryRaw (list) {
  ensureDir()
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(list, null, 2))
}

export async function addHistoryEntry ({ branch, workspace, date = new Date().toISOString() }) {
  const repo = await getRepoRoot()
  const list = readHistoryRaw()
  const filtered = list.filter(e => !(e.branch === branch && e.workspace === workspace && e.repo === repo))
  const next = [{ branch, workspace, date, repo }, ...filtered].slice(0, MAX_ENTRIES)
  writeHistoryRaw(next)
}

export async function getRecent (n = 3, { scope = 'repo' } = {}) {
  const all = readHistoryRaw()
  if (scope === 'all') return all.slice(0, n)
  const repo = await getRepoRoot()
  const byRepo = repo ? all.filter(e => e.repo === repo) : all
  return byRepo.slice(0, n)
}

export function migrateLegacyRepoFile () {
  const legacyPath = path.join(process.cwd(), '.innew-history.json')
  if (!fs.existsSync(legacyPath)) return
  try {
    const legacy = JSON.parse(fs.readFileSync(legacyPath, 'utf8'))
    if (Array.isArray(legacy) && legacy.length) {
      const merged = [...legacy, ...readHistoryRaw()]
      writeHistoryRaw(merged)
    }
    fs.unlinkSync(legacyPath)
  } catch {
    // ignorar errores de migración
  }
}

export { HISTORY_PATH as HISTORY_PATH_ABS }
