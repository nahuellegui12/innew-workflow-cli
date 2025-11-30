import { execa } from 'execa'
import chalk from 'chalk'

export const stripDiacritics = (s) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export const sanitizeDesc = (s) =>
  stripDiacritics(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

export const buildBranch = ({ type, desc, team, id }) =>
  `${type}/${desc}#${team}-${id}`

export const buildWorkspace = ({ desc, team, id }) =>
  `${desc}${String(team).toLowerCase()}${String(id)}`
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 28)

export const BRANCH_REGEX =
  /^(feature|fix|chore|hotfix|refactor)\/[a-z0-9-]+#[A-Z]{2,10}-[0-9]{1,8}$/

export async function ensureCmd (cmd, args = ['--version']) {
  try {
    await execa(cmd, args, { stdio: 'ignore' })
  } catch {
    throw new Error(`No encontré '${cmd}'. Instalalo/configuralo antes de seguir.`)
  }
}

export async function gitLocalBranchExists (branch) {
  const { stdout } = await execa('git', ['branch', '--list', branch])
  return !!stdout.trim()
}

export async function gitCheckoutNewOrExisting (branch) {
  try {
    const exists = await gitLocalBranchExists(branch)
    if (!exists) {
      await execa('git', ['checkout', '-b', branch], { stdio: 'inherit' })
      console.log(chalk.green(`✔ Branch local creada: ${branch}`))
    } else {
      await execa('git', ['checkout', branch], { stdio: 'inherit' })
      console.log(chalk.yellow(`✔ Branch local ya existía: ${branch}`))
    }
    console.log(chalk.gray('No se realizó push al remoto.'))
  } catch (e) {
    throw new Error(`Git error: ${e.shortMessage || e.message}`)
  }
}

export async function vtexCreateIfMissingAndUse (workspace) {
  try {
    try {
      const { stdout } = await execa('vtex', ['whoami'])
      console.log(chalk.gray(stdout))
    } catch {
      console.log(chalk.gray('VTEX whoami no disponible (asegurate de estar logueado).'))
    }

    let exists = false
    try {
      const { stdout } = await execa('vtex', ['workspace', 'list'])
      exists = stdout
        .split('\n')
        .some(line => line.split(/\s+/)[0].replace(/^\*/, '') === workspace)
    } catch {
    
    }

    if (!exists) {
      await execa('vtex', ['workspace', 'create', workspace], { stdio: 'inherit' })
    } else {
      console.log(chalk.yellow(`✔ El workspace '${workspace}' ya existe.`))
    }

    await execa('vtex', ['use', workspace], { stdio: 'inherit' })
  } catch (e) {
    throw new Error(`VTEX error: ${e.shortMessage || e.message}`)
  }
}
