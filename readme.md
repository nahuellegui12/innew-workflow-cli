# Innew Workflow CLI

CLI para estandarizar el flujo de trabajo en proyectos **VTEX IO**:  
- Genera **branches** con el formato definido: `tipo/descripcion#TEAM-ID`.  
- Crea y cambia automáticamente al **workspace VTEX** correspondiente.  
- Evita malas prácticas (nombres inconsistentes, workspaces incorrectos).  

---

## 📦 Requisitos

- [Node.js](https://nodejs.org/) 18+
- [Git](https://git-scm.com/)
- [VTEX Toolbelt](https://developers.vtex.com/docs/guides/vtex-io-documentation-vtex-io-cli-install) con sesión activa (`vtex login`)

---

## ⬇️ Instalación

### Opción 1: Instalar desde NPM (Recomendado)

```bash
# Instalar globalmente
npm i -g innew-cli

# O usar sin instalar
npx -y -p innew-cli innew --help
```

### Opción 2: Instalación local (para desarrollo)

```bash
# Clonar el repositorio
git clone https://github.com/tu-org/innew-workflow-cli.git
cd innew-workflow-cli

# Instalar dependencias
npm install

# Vincular globalmente para desarrollo
npm link
```

---

## 🔄 Actualizar o reinstalar en local

Si ya tenés el CLI instalado localmente y querés actualizarlo:

```bash
# Desvincular la versión anterior
npm unlink -g innew-cli

# Limpiar dependencias y cache
rm -rf node_modules package-lock.json

# Reinstalar dependencias
npm install

# Volver a vincular
npm link
```

---

## 🗑️ Desinstalar

### Si instalaste desde NPM:
```bash
npm uninstall -g innew-cli
```

### Si instalaste en local (con npm link):
```bash
# Desvincular el paquete global
npm unlink -g innew-cli

# Opcional: eliminar el repositorio clonado
cd ..
rm -rf innew-workflow-cli
```

---

## 🚀 Uso

### Comando: `innew init`

Crea una nueva branch y workspace siguiendo el estándar del equipo.

```bash
innew init
```

**Opciones CLI** (saltean prompts):
```bash
innew init -t feature -d "nueva-funcionalidad" -T IDE -i 1234
```

| Flag | Descripción | Ejemplo |
|------|-------------|---------|
| `-t, --type` | Tipo de branch | `feature`, `fix`, `chore`, `hotfix`, `refactor` |
| `-d, --desc` | Descripción breve | `nueva-funcionalidad` |
| `-T, --team` | Código de equipo | `IDE` |
| `-i, --id` | ID del ticket | `1234` |

**Resultado:**
- Branch: `feature/nueva-funcionalidad#IDE-1234`
- Workspace: `nuevafuncionalidadide1234`

---

### Comando: `innew branch`

Muestra las últimas 3 branches del historial y permite cambiar rápidamente.

```bash
innew branch
```

**Opciones:**
```bash
innew branch --last    # Usa la más reciente sin prompt
innew branch --show    # Solo lista, sin cambiar nada
innew branch --all     # Usa historial global en vez del repo actual
```

---

### Comando: `innew commit`

Crea commits formateados usando el contexto de la branch actual.

```bash
innew commit
```

**Opciones CLI:**
```bash
innew commit -t fix -m "corrige error en el footer"
```

| Flag | Descripción | Ejemplo |
|------|-------------|---------|
| `-t, --type` | Tipo de commit | `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore` |
| `-m, --message` | Descripción del cambio | `corrige error en el footer` |

**Formato del commit:**
```
[fix] (IDE-1234): corrige error en el footer
```

Si la branch no sigue el formato estándar:
```
[fix]: corrige error en el footer
```

---

## 🔧 Configuración (.innewrc.json)

Podés crear un archivo `.innewrc.json` en la raíz de tu proyecto para establecer valores por defecto:

```json
{
  "defaultType": "feature",
  "defaultTeam": "IDE"
}
```

---

## 📂 Historial

El CLI guarda un historial global de branches en:
- **Linux/Mac**: `~/.config/innew/history.json`
- **Windows**: `%APPDATA%\innew\history.json`

---

## 🛠️ Desarrollo

```bash
# Clonar repo
git clone https://github.com/tu-org/innew-workflow-cli.git
cd innew-workflow-cli

# Instalar dependencias
npm install

# Vincular para desarrollo
npm link

# Probar comandos
innew init
innew branch
innew commit

# Ver ayuda
innew --help
```