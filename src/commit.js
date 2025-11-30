// Comando commit – formatea commits usando contexto de la branch actual
import inquirer from 'inquirer'
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
  // Formato esperado: tipo/descripcion#TEAM-ID
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
  
  // Obtener la branch actual
  const currentBranch = await getCurrentBranch()
  console.log(chalk.gray(`Branch actual: ${currentBranch}\n`))
  
  // Parsear info de la branch
  const branchInfo = parseBranchInfo(currentBranch)
  
  if (!branchInfo) {
    console.log(chalk.yellow('⚠ La branch actual no sigue el formato estándar de innew.'))
    console.log(chalk.yellow('Formato esperado: tipo/descripcion#TEAM-ID'))
    console.log(chalk.gray('Continuando sin contexto de equipo/ID...\n'))
  }
  
  // Preguntar tipo de commit y mensaje
  const answers = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: 'Tipo de cambio:',
      default: opts.type,
      choices: ['feat', 'fix', 'refactor', 'style', 'docs', 'test', 'chore'],
      when: !opts.type
    },
    {
      name: 'message',
      type: 'input',
      message: 'Descripción del cambio:',
      when: !opts.message,
      validate: (v) => v.trim().length > 0 || 'Ingresá una descripción válida.'
    }
  ])
  
  const type = opts.type || answers.type
  const message = (opts.message || answers.message || '').trim()
  
  // Construir el mensaje del commit
  let commitMessage
  if (branchInfo) {
    // Formato: [tipo] (TEAM-ID): mensaje
    commitMessage = `[${type}] (${branchInfo.team}-${branchInfo.id}): ${message}`
  } else {
    // Formato simplificado sin contexto
    commitMessage = `[${type}]: ${message}`
  }
  
  // Ejecutar git commit directamente
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