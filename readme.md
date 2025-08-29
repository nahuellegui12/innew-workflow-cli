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

## ⬇️ Clonar y preparar el repo

```bash
git clone https://github.com/tu-org/innew-workflow-cli.git
cd innew-workflow-cli
npm install
```

## ⬇️ instalacion de manera local
```bash
npm init
```

## ⬇️ Instalar de paquete npm
npm i -g innew-cli
## o sin instalar
npx -y -p innew-cli innew --help
