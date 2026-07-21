# Backend — Extractor de facturas

Servicio de Python (FastAPI) que lee la foto de una factura y devuelve los datos en JSON.

## Correr localmente

```powershell
cd "C:\Rojo Home Improvement\backend"
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --port 8000
```

Abre http://localhost:8000 → debe responder `{"ok": true, ...}`.

## Modo demo vs. producción

- **Sin `ANTHROPIC_API_KEY`** → modo **demo**: devuelve una factura de ejemplo.
  Sirve para probar toda la app (subir → revisar → guardar) sin gastar nada.
- **Con `ANTHROPIC_API_KEY`** → lee la imagen de verdad con la visión de Claude.
  Consigue la clave en https://console.anthropic.com

## Endpoint

`POST /extract` — `multipart/form-data`, campo `file` = imagen.
Devuelve:

```json
{
  "proveedor": "Sherwin-Williams",
  "fecha_factura": "2026-07-15",
  "numero_factura": "12345",
  "subtotal": 142.0,
  "impuesto": 9.02,
  "total": 151.02,
  "moneda": "USD",
  "categoria": "Pintura",
  "items": [
    { "descripcion": "ProClassic (galón)", "cantidad": 2, "precio_unit": 55.0, "total_linea": 110.0 }
  ]
}
```

## Publicar en línea (opcional)

Netlify no corre Python. Para que funcione fuera de la computadora del dueño,
sube esta carpeta a **Render** o **Railway** y usa el comando de arranque:

```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Luego pon esa URL pública en `frontend/.env` → `VITE_BACKEND_URL`.
```
