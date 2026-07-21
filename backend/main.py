"""
Extractor de facturas — Rojo Home Improvement
--------------------------------------------------------------
Recibe una foto de una factura/recibo y devuelve los datos en
JSON, listos para guardar en Supabase.

Usa la visión de Claude para leer la imagen (mucho más preciso
que un OCR tradicional con facturas de formatos distintos).

Endpoints:
  GET  /          -> estado del servicio
  POST /extract   -> sube una imagen (campo "file"), devuelve JSON

Si no hay ANTHROPIC_API_KEY configurada, funciona en MODO DEMO
y devuelve datos de ejemplo para que puedas probar todo el flujo.
"""

import os
import json
import base64
import datetime as dt

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5").strip()

app = FastAPI(title="Rojo — Extractor de facturas")

# Permitir que el frontend (localhost:3003) llame a este servicio
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción, pon aquí tu dominio de Netlify
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CATEGORIAS = [
    "Pintura", "Materiales", "Herramientas", "Wallpaper", "Pisos",
    "Carpintería", "Transporte / Gasolina", "Renta de equipo", "Otro",
]

PROMPT = f"""Eres un asistente que lee facturas y recibos de una empresa de pintura.
Analiza la imagen y devuelve ÚNICAMENTE un objeto JSON válido (sin explicaciones,
sin markdown, sin ```), con exactamente estas claves:

{{
  "proveedor": string,            // nombre de la tienda/proveedor, ej: "Sherwin-Williams"
  "fecha_factura": string,        // formato "YYYY-MM-DD"; "" si no se ve
  "numero_factura": string,       // número/folio del recibo; "" si no hay
  "subtotal": number,             // sin impuesto
  "impuesto": number,             // solo el impuesto/tax
  "total": number,                // total final pagado
  "moneda": string,               // ej: "USD"
  "categoria": string,            // UNA de: {", ".join(CATEGORIAS)}
  "items": [                      // renglones; [] si no se distinguen
    {{ "descripcion": string, "cantidad": number, "precio_unit": number, "total_linea": number }}
  ]
}}

Reglas:
- Los montos son NÚMEROS (12.5), sin símbolos ni comas de miles.
- Si un dato no aparece, usa "" para texto y 0 para números.
- Elige la categoría más lógica según lo comprado.
- Devuelve SOLO el JSON."""


def _demo(nombre_archivo: str) -> dict:
    return {
        "proveedor": "Sherwin-Williams (DEMO)",
        "fecha_factura": dt.date.today().isoformat(),
        "numero_factura": "DEMO-0001",
        "subtotal": 142.00,
        "impuesto": 9.02,
        "total": 151.02,
        "moneda": "USD",
        "categoria": "Pintura",
        "items": [
            {"descripcion": "ProClassic Interior (galón)", "cantidad": 2, "precio_unit": 55.0, "total_linea": 110.0},
            {"descripcion": "Rodillos y brochas", "cantidad": 1, "precio_unit": 32.0, "total_linea": 32.0},
        ],
        "demo": True,
        "_archivo": nombre_archivo,
    }


def _parse_json(texto: str) -> dict:
    """Extrae el JSON aunque venga con texto o ```json alrededor."""
    t = texto.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1]
        if t.lstrip().lower().startswith("json"):
            t = t.lstrip()[4:]
    ini, fin = t.find("{"), t.rfind("}")
    if ini != -1 and fin != -1:
        t = t[ini:fin + 1]
    return json.loads(t)


@app.get("/")
def estado():
    return {
        "servicio": "Rojo — Extractor de facturas",
        "ok": True,
        "modo": "produccion" if API_KEY else "demo",
        "modelo": MODEL if API_KEY else None,
    }


@app.post("/extract")
async def extract(file: UploadFile = File(...)):
    contenido = await file.read()
    if not contenido:
        raise HTTPException(400, "Archivo vacío")

    # Modo demo: sin API key devolvemos datos de ejemplo
    if not API_KEY:
        return _demo(file.filename)

    media_type = file.content_type or "image/jpeg"
    b64 = base64.standard_b64encode(contenido).decode("utf-8")

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=API_KEY)
        msg = client.messages.create(
            model=MODEL,
            max_tokens=1500,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": PROMPT},
                ],
            }],
        )
        texto = "".join(b.text for b in msg.content if getattr(b, "type", "") == "text")
        datos = _parse_json(texto)
    except Exception as e:
        raise HTTPException(502, f"Error al extraer con Claude: {e}")

    # Normalizar tipos numéricos
    for k in ("subtotal", "impuesto", "total"):
        try:
            datos[k] = float(datos.get(k, 0) or 0)
        except (TypeError, ValueError):
            datos[k] = 0.0
    datos.setdefault("moneda", "USD")
    datos.setdefault("items", [])
    return datos


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
