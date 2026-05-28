from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import uvicorn

# Importamos funciones para detectar cartas
from car_detector import preprocess_image, find_card_contours, flatten_card
from ia_analyzer import obtener_datos_carta

app = FastAPI(title="Motor de IA - Pocket Battle")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/escanear-carta")
async def escanear_carta(file: UploadFile = File(...)):
    print(f"Recibiendo imagen desde React: {file.filename}")
    
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Guardamos la imagen tal cual la saca la webcam
    ruta_imagen = "temp_web_card.jpg"
    cv2.imwrite(ruta_imagen, img)
    
    # Intentamos usar OpenCV para recortarla
    try:
        pre_proc = preprocess_image(img)
        approx_poly, card_cnt = find_card_contours(pre_proc)
        
        if len(approx_poly) > 0:
            print("OpenCV logró detectar el contorno. Aplanando...")
            flat_card = flatten_card(img, approx_poly)
            cv2.imwrite(ruta_imagen, flat_card) # Sobrescribimos con la versión mejorada
        else:
            print("OpenCV no pudo aislar la carta. Pasando al Plan B...")
    except Exception as e:
        print(f"Error menor en OpenCV ignorado. Pasando al Plan B...")

    #  Mandamos la foto a Gemini 
    print("Consultando a la IA...")
    datos_json = obtener_datos_carta(ruta_imagen)
    
    if datos_json:
        return datos_json
    else:
        return {"error": "Error al analizar la carta con la IA."}

if __name__ == "__main__":
    print("Iniciando Servidor de IA en el puerto 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
