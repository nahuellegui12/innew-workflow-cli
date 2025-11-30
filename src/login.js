// Comando login – lee vendor del manifest.json y hace vtex login
import chalk from 'chalk'
import fs from 'fs'
import path from 'path'
import { execa } from 'execa'
import { ensureCmd } from './lib.js'

function findManifest() {
  const manifestPath = path.join(process.cwd(), 'manifest.json')
  
  if (!fs.existsSync(manifestPath)) {
    throw new Error('No se encontró manifest.json en el directorio actual')
  }
  
  return manifestPath
}

function readVendor(manifestPath) {
  try {
    const content = fs.readFileSync(manifestPath, 'utf8')
    const manifest = JSON.parse(content)
    
    if (!manifest.vendor) {
      throw new Error('El manifest.json no tiene el campo "vendor"')
    }
    
    return manifest.vendor
  } catch (e) {
    if (e.message.includes('vendor')) {
      throw e
    }
    throw new Error(`Error al leer manifest.json: ${e.message}`)
  }
}

export default async function runLogin() {
  await ensureCmd('vtex')
  
  try {
    // Buscar y leer manifest.json
    const manifestPath = findManifest()
    const vendor = readVendor(manifestPath)
    
    console.log(chalk.cyan(`\n→ Vendor encontrado: ${vendor}`))
    console.log(chalk.gray(`→ Ejecutando: vtex login ${vendor}\n`))
    
    // Ejecutar vtex login con el vendor
    await execa('vtex', ['login', vendor], { stdio: 'inherit' })
    
    console.log(chalk.green('\n✔ Login exitoso'))
  } catch (e) {
    console.error(chalk.red(`\n✗ Error: ${e.message}`))
    process.exit(1)
  }
}