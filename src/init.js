// Comando init – guarda historial GLOBAL y migra legacy del repo
import inquirer from 'inquirer'
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import {
  ensureCmd,
  sanitizeDesc,
  buildBranch,
  buildWorkspace,
  BRANCH_REGEX,
  gitCheckoutNewOrExisting,
  vtexCreateIfMissingAndUse
} from './lib.js'
import { addHistoryEntry, migrateLegacyRepoFile } from './history.js'

const rcPath = path.join(process.cwd(), '.innewrc.json')
let rc = {}
if (fs.existsSync(rcPath)) {
  try { rc = JSON.parse(fs.readFileSync(rcPath, 'utf8')) } catch {}
}

export default async function runInit (opts = {}) {
  // Migrar historial legacy si existiera en el repo actual
  migrateLegacyRepoFile()

  // Prechequeos
  await ensureCmd('git')
  await ensureCmd('vtex')

  // Resolver defaults con rc + opts CLI
  const resolved = { ...rc, ...opts }

  const answers = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: 'Tipo:',
      default: resolved.defaultType || resolved.type,
      choices: ['feature', 'fix', 'chore', 'hotfix', 'refactor'],
      when: !(resolved.type || resolved.defaultType)
    },
    {
      name: 'desc',
      type: 'input',
      message: 'Descripción (breve; usa letras, números y -):',
      when: !resolved.desc,
      validate: (v) => !!sanitizeDesc(v) || 'Ingresá una descripción válida.'
    },
    {
      name: 'team',
      type: 'input',
      message: 'Código de equipo (p.ej., IDE):',
      default: resolved.defaultTeam || resolved.team,
      when: !(resolved.team || resolved.defaultTeam),
      filter: (v) => String(v).toUpperCase(),
      validate: (v) => /^[A-Z]{2,10}$/.test(v) || 'Usá 2–10 letras mayúsculas.'
    },
    {
      name: 'id',
      type: 'input',
      message: 'ID de ticket (número):',
      when: !resolved.id,
      validate: (v) => /^[0-9]{1,8}$/.test(v) || 'Ingresá 1–8 dígitos.'
    }
  ])

  const type = resolved.type || answers.type
  const desc = sanitizeDesc(resolved.desc || answers.desc || '')
  const team = String(resolved.team || answers.team || '').toUpperCase()
  const id = String(resolved.id || answers.id || '')

  const branch = buildBranch({ type, desc, team, id })
  const workspace = buildWorkspace({ desc, team, id })

  if (!BRANCH_REGEX.test(branch)) {
    console.error(chalk.red(`Nombre de branch inválido: ${branch}`))
    console.error('Formato: tipo/descripcion#TEAM-ID (ej: feature/cambiocolor#IDE-1233)')
    process.exit(1)
  }

  console.log(chalk.cyan(`\nBranch: ${branch}`))
  console.log(chalk.cyan(`Workspace: ${workspace}\n`))

  const { ok } = await inquirer.prompt([
    { name: 'ok', type: 'confirm', message: '¿Continuar?', default: true }
  ])
  if (!ok) process.exit(0)

  await gitCheckoutNewOrExisting(branch)
  await vtexCreateIfMissingAndUse(workspace)

  // Guardar en historial GLOBAL (con campo repo)
  await addHistoryEntry({ branch, workspace })

  console.log(chalk.green('\n✔ Listo'))
}
