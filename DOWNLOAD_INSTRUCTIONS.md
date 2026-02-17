# DOWNLOAD_INSTRUCTIONS.md

## 1) Descargar ZIP directamente desde esta interfaz (recomendado ahora)
Archivo final release:
- `/workspace/SalesManagementSystem-prueba1.zip`

En la UI de Codex, abre el explorador de archivos/artifacts del workspace y descarga ese archivo.

## 2) Subir a GitHub desde tu PC y descargar desde GitHub
En tu máquina local:

```bash
git clone <tu-repo-o-copia-local>
cd salesmanagersystem

git remote add origin <URL_DE_TU_REPO>
git push -u origin work
# opcional rama release

git checkout -b release/vercel-ready
git push -u origin release/vercel-ready
```

Luego en GitHub:
1. Entrar al repo
2. Botón **Code**
3. **Download ZIP**

## Notas
- El ZIP release excluye: `node_modules`, `.next`, `.git`, y cualquier `*.zip` interno del repo.
- Si en tu entorno corporativo hay proxy/firewall, valida acceso a `registry.npmjs.org` antes de build.
