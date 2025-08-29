import { Command } from 'commander';
import inquirer from 'inquirer';
import { execa } from 'execa';
import chalk from 'chalk';

import fs from 'fs';
import path from 'path';

const rcPath = path.join(process.cwd(), '.innewrc.json');
let rc = {};
if (fs.existsSync(rcPath)) {
  try { rc = JSON.parse(fs.readFileSync(rcPath, 'utf8')); } catch {}
}

// --- Helpers ---
const stripDiacritics = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const sanitizeDesc = (s) =>
  stripDiacritics(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const buildBranch = ({ type, desc, team, id }) => `${type}/${desc}#${team}-${id}`;
const buildWorkspace = ({ desc, team, id }) =>
  `${desc}${team.toLowerCase()}${id}`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28);

const BRANCH_REGEX = /^(feature|fix|chore|hotfix|refactor)\/[a-z0-9-]+#[A-Z]{2,10}-[0-9]{1,8}$/;

async function ensureCmd(cmd, args = ['--version']) {
  try { await execa(cmd, args, { stdio: 'ignore' }); }
  catch { throw new Error(`No encontré '${cmd}'. Instalalo/configuralo antes de seguir.`); }
}

async function gitCheckoutNew(branch) {
  try {
    const { stdout } = await execa('git', ['branch', '--list', branch]);
    if (!stdout.trim()) {
      await execa('git', ['checkout', '-b', branch], { stdio: 'inherit' });
      console.log(chalk.green(`✔ Branch local creada: ${branch}`));
    } else {
      await execa('git', ['checkout', branch], { stdio: 'inherit' });
      console.log(chalk.yellow(`✔ Branch local ya existía: ${branch}`));
    }

    console.log(chalk.gray('No se realizó push al remoto.'));
  } catch (e) {
    throw new Error(`Git error: ${e.shortMessage || e.message}`);
  }
}

async function vtexCreateAndUseWorkspace(workspace) {
  try {
    const { stdout } = await execa('vtex', ['whoami']);
    console.log(chalk.gray(stdout));
  } catch {
    console.log(chalk.gray('VTEX whoami no disponible (asegurate de estar logueado).'));
  }

  let exists = false;
  try {
    const { stdout } = await execa('vtex', ['workspace', 'list']);
    exists = stdout.split('\n').some(line => line.split(/\s+/)[0] === workspace);
  } catch {

  }

  if (!exists) {
    await execa('vtex', ['workspace', 'create', workspace], { stdio: 'inherit' });
  } else {
    console.log(chalk.yellow(`✔ El workspace '${workspace}' ya existe.`));
  }

  await execa('vtex', ['use', workspace], { stdio: 'inherit' });
}

async function main() {
  const program = new Command();
  program
    .name('innew vtex workflow init')
    .description('Estandariza branch y crea workspace VTEX a partir del nombre.')
    .argument('[cmd]', 'subcomando', 'vtex')
    .argument('[area]', 'área', 'workflow')
    .argument('[action]', 'acción', 'init')
    .option('-t, --type <type>', 'feature|fix|chore|hotfix|refactor', rc.defaultType)
    .option('-d, --desc <desc>', 'Breve descripción (kebab-case recomendado)')
    .option('-T, --team <team>', 'Código de equipo (ej: IDE)', rc.defaultTeam)
    .option('-i, --id <id>', 'ID de ticket (número)')
    .parse(process.argv);

  const opts = program.opts();

  // Prechequeos
  await ensureCmd('git');
  await ensureCmd('vtex');

  const answers = await inquirer.prompt([
    {
      name: 'type',
      type: 'list',
      message: 'Tipo:',
      default: opts.type,
      choices: ['feature', 'fix', 'chore', 'hotfix', 'refactor'],
      when: !opts.type
    },
    {
      name: 'desc',
      type: 'input',
      message: 'Descripción (breve; usa letras, números y -):',
      when: !opts.desc,
      validate: (v) => !!sanitizeDesc(v) || 'Ingresá una descripción válida.'
    },
    {
      name: 'team',
      type: 'input',
      message: 'Código de equipo (p.ej., IDE):',
      default: opts.team,
      when: !opts.team,
      filter: (v) => String(v).toUpperCase(),
      validate: (v) => /^[A-Z]{2,10}$/.test(v) || 'Usá 2–10 letras mayúsculas.'
    },
    {
      name: 'id',
      type: 'input',
      message: 'ID de ticket (número):',
      when: !opts.id,
      validate: (v) => /^[0-9]{1,8}$/.test(v) || 'Ingresá 1–8 dígitos.'
    }
  ]);

  const type = opts.type || answers.type;
  const desc = sanitizeDesc(opts.desc || answers.desc || '');
  const team = (opts.team || answers.team || '').toUpperCase();
  const id = String(opts.id || answers.id || '');

  const branch = buildBranch({ type, desc, team, id });
  const workspace = buildWorkspace({ desc, team, id });

  if (!BRANCH_REGEX.test(branch)) {
    console.error(chalk.red(`Nombre de branch inválido: ${branch}`));
    console.error('Formato: tipo/descripcion#TEAM-ID (ej: feature/cambiocolor#IDE-1233)');
    process.exit(1);
  }

  console.log(chalk.cyan(`\nBranch:    ${branch}`));
  console.log(chalk.cyan(`Workspace: ${workspace}\n`));

  const { ok } = await inquirer.prompt([{ name: 'ok', type: 'confirm', message: '¿Continuar?', default: true }]);
  if (!ok) process.exit(0);

  await gitCheckoutNew(branch);
  await vtexCreateAndUseWorkspace(workspace);

  console.log(chalk.green('\n✔ Listo'));
}

main().catch((e) => {
  console.error(chalk.red('❌ Error:'), e?.shortMessage || e?.message || e);
  process.exit(1);
});
