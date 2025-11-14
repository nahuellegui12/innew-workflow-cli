#!/usr/bin/env node
import { Command } from 'commander'
import runInit from '../src/init.js'
import runBranch from '../src/branch.js'

const program = new Command()
  .name('innew')
  .description('CLI: estandariza branches y workspaces VTEX')
  .version('1.2.0')

program
  .command('init')
  .description('Crea/checkout de branch y crea/usa workspace VTEX')
  .option('-t, --type <type>', 'feature|fix|chore|hotfix|refactor')
  .option('-d, --desc <desc>', 'Breve descripción (kebab-case recomendado)')
  .option('-T, --team <team>', 'Código de equipo (ej: IDE)')
  .option('-i, --id <id>', 'ID de ticket (número)')
  .action(runInit)

program
  .command('branch')
  .description('Muestra las 3 últimas branches (repo actual por defecto), permite elegir y usa su workspace')
  .option('--last', 'Saltear prompt y usar la más reciente')
  .option('--show', 'Solo listar, sin cambiar nada')
  .option('--all', 'Usar historial GLOBAL en vez del repo actual')
  .action(runBranch)

program.parse(process.argv)
