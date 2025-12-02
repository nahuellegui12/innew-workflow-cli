import { select, input, confirm } from '@inquirer/prompts'
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
  migrateLegacyRepoFile()

  await ensureCmd('git')
  await ensureCmd('vtex')

  const resolved = { ...rc, ...opts }

  try {
    let type = resolved.type || resolved.defaultType
    let desc = resolved.desc
    let team = resolved.team || resolved.defaultTeam
    let id = resolved.id

    if (!type) {
      type = await select({
        message: 'Tipo:',
        choices: [
          { name: 'feature', value: 'feature' },
          { name: 'fix', value: 'fix' },
          { name: 'chore', value: 'chore' },
          { name: 'hotfix', value: 'hotfix' },
          { name: 'refactor', value: 'refactor' }
        ]
      })
    }

    if (!desc) {
      desc = await input({
        message: 'Descripción (breve; usa letras, números y -):',
        validate: (v) => !!sanitizeDesc(v) || 'Ingresá una descripción válida.'
      })
    }

    if (!team) {
      team = await input({
        message: 'Código de equipo (p.ej., IDE):',
        validate: (v) => /^[A-Z]{2,10}$/.test(String(v).toUpperCase()) || 'Usá 2–10 letras mayúsculas.',
        transformer: (v) => String(v).toUpperCase()
      })
    }

    if (!id) {
      id = await input({
        message: 'ID de ticket (número):',
        validate: (v) => /^[0-9]{1,8}$/.test(v) || 'Ingresá 1–8 dígitos.'
      })
    }

    desc = sanitizeDesc(desc || '')
    team = String(team).toUpperCase()
    id = String(id)

    const branch = buildBranch({ type, desc, team, id })
    const workspace = buildWorkspace({ desc, team, id })

    if (!BRANCH_REGEX.test(branch)) {
      console.error(chalk.red(`Nombre de branch inválido: ${branch}`))
      console.error('Formato: tipo/descripcion#TEAM-ID (ej: feature/cambiocolor#IDE-1233)')
      process.exit(1)
    }

    console.log(chalk.cyan(`\nBranch: ${branch}`))
    console.log(chalk.cyan(`Workspace: ${workspace}\n`))

    const ok = await confirm({ 
      message: '¿Continuar?', 
      default: true 
    })
    
    if (!ok) process.exit(0)

    await gitCheckoutNewOrExisting(branch)
    await vtexCreateIfMissingAndUse(workspace)

    await addHistoryEntry({ branch, workspace })

    console.log(chalk.green('\n✔ Listo'))
  } catch (error) {
    if (error.name === 'ExitPromptError' || error.message?.includes('User force closed') || error.message?.includes('SIGINT')) {
      console.log(chalk.yellow('\n\nOperación.'))
      process.exit(0)
    }
    throw error
  }
}