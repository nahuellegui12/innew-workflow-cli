import { select, input, confirm } from '@inquirer/prompts'
import chalk from 'chalk'
import { execa } from 'execa'
import { ensureCmd } from './lib.js'

async function getCurrentBranch() {
  try {
    const { stdout } = await execa('git', ['branch', '--show-current'])
    return stdout.trim()
  } catch (e) {
    throw new Error('No se pudo obtener la branch actual')
  }
}

function parseBranchInfo(branch) {
  const match = branch.match(/^(?:feature|fix|chore|hotfix|refactor)\/[a-z0-9-]+#([A-Z]{2,10})-([0-9]{1,8})$/)
  
  if (!match) {
    return null
  }
  
  return {
    team: match[1],
    id: match[2]
  }
}

export default async function runCommit(opts = {}) {
  await ensureCmd('git')
  
  const currentBranch = await getCurrentBranch()
  console.log(chalk.gray(`Branch actual: ${currentBranch}\n`))
  
  const branchInfo = parseBranchInfo(currentBranch)
  
  if (!branchInfo) {
    console.log(chalk.yellow('⚠ La branch actual no sigue el formato estándar de innew.'))
    console.log(chalk.yellow('Formato esperado: tipo/descripcion#TEAM-ID'))
    console.log(chalk.gray('Continuando sin contexto de equipo/ID...\n'))
  }
  
  let type = opts.type
  let message = opts.message
  
  if (!type) {
    type = await select({
      message: 'Tipo de cambio:',
      choices: [
        { name: 'feat', value: 'feat' },
        { name: 'fix', value: 'fix' },
        { name: 'refactor', value: 'refactor' },
        { name: 'style', value: 'style' },
        { name: 'docs', value: 'docs' },
        { name: 'test', value: 'test' },
        { name: 'chore', value: 'chore' }
      ]
    })
  }
  
  if (!message) {
    message = await input({
      message: 'Descripción del cambio:',
      validate: (v) => v.trim().length > 0 || 'Ingresá una descripción válida.'
    })
  }
  
  message = message.trim()
  
  let commitMessage
  if (branchInfo) {
    commitMessage = `[${type}] (${branchInfo.team}-${branchInfo.id}): ${message}`
  } else {
    commitMessage = `[${type}]: ${message}`
  }
  
  try {
    await execa('git', ['commit', '-m', commitMessage], { stdio: 'inherit' })
    console.log(chalk.green('\n✔ Commit creado exitosamente'))
  } catch (e) {
    if (e.message.includes('nothing to commit')) {
      console.log(chalk.yellow('\n⚠ No hay cambios para commitear. Usá `git add` primero.'))
    } else {
      throw new Error(`Error al crear commit: ${e.shortMessage || e.message}`)
    }
  }
}