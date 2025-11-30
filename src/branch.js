import { select } from '@inquirer/prompts'
import chalk from 'chalk'
import {
    ensureCmd,
    gitCheckoutNewOrExisting,
    vtexCreateIfMissingAndUse
} from './lib.js'
import { getRecent } from './history.js'

export default async function runBranch(opts = {}) {
    await ensureCmd('git')
    await ensureCmd('vtex')

    const recent = await getRecent(3, { scope: opts.all ? 'all' : 'repo' })
    if (!recent.length) {
        console.log(chalk.yellow('Aún no hay historial. Ejecutá `innew init` para registrar tu primera branch.'))
        return
    }

    if (opts.show) {
        console.log('\nÚltimas ramas:')
        for (const r of recent) {
            console.log(`• ${r.branch}  (${r.workspace})  – ${new Date(r.date).toLocaleString()}`)
        }
        return
    }

    let chosen
    if (opts.last) {
        chosen = recent[0]
    } else {
        const selectedBranch = await select({
            message: 'Seleccioná una branch reciente:',
            pageSize: 5,
            choices: recent.map((r, idx) => ({
                name: `${chalk.cyan(r.branch)}  ${chalk.gray(`(${r.workspace})`)}  – ${chalk.dim(new Date(r.date).toLocaleString())}`,
                value: idx
            }))
        })
        chosen = recent[selectedBranch]
    }

    const { branch, workspace } = chosen
    console.log(chalk.cyan(`\n→ Checkout a ${branch} y usar workspace ${workspace}`))

    await gitCheckoutNewOrExisting(branch)
    await vtexCreateIfMissingAndUse(workspace)

    console.log(chalk.green('\n✔ Listo'))
}