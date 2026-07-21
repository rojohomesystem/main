# 🖥️ Comandos de terminal — Rojo Home Improvement

Todo apunta a la carpeta del proyecto en Windows:

```
C:\Rojo Home Improvement
```

> Necesitas tener instalado: **Node.js 18+** y **Python 3.10+**.
> Verifícalo con: `node -v` y `python --version`

---

## 1) Abrir el proyecto en Claude Code

```powershell
cd "C:\Rojo Home Improvement"
claude
```

---

## 2) Frontend (la página que ve el dueño) — puerto 3003

Abre una terminal:

```powershell
cd "C:\Rojo Home Improvement\frontend"
npm install
copy .env.example .env      REM luego edita .env con tus datos de Supabase
npm run dev
```

Se abrirá solo en: **http://localhost:3003**

---

## 3) Backend de Python (extractor de facturas) — puerto 8000

Abre OTRA terminal (déjala corriendo aparte del frontend):

```powershell
cd "C:\Rojo Home Improvement\backend"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env      REM opcional: pega tu ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

Pruébalo abriendo: **http://localhost:8000** (debe decir `"ok": true`).

> Sin `ANTHROPIC_API_KEY` funciona en **modo demo** (datos de ejemplo),
> para que puedas probar todo el flujo antes de configurar la API.

---

## Resumen del día a día

Cada vez que quieras trabajar, abre **dos terminales**:

| Terminal 1 (frontend)                 | Terminal 2 (backend)                    |
|---------------------------------------|-----------------------------------------|
| `cd "C:\Rojo Home Improvement\frontend"` | `cd "C:\Rojo Home Improvement\backend"` |
| `npm run dev`                         | `venv\Scripts\activate`                 |
|                                       | `uvicorn main:app --reload --port 8000` |

Frontend → http://localhost:3003
Backend  → http://localhost:8000
