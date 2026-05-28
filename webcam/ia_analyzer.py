import google.generativeai as genai
import json
import os
import time

# --- CONFIGURACIÓN ---
API_KEY = ""

genai.configure(api_key=API_KEY)

def obtener_datos_carta(ruta_imagen):
    """
    Mandar imagen a Gemini y devuelve un JSON con los datos.
    """
    print(f" Enviando {ruta_imagen} a Gemini 1.5 Flash...")
    start_time = time.time()

    # 1. Configuración del modelo para RESPUESTA JSON
    generation_config = {
        "temperature": 0.1,            
        "response_mime_type": "application/json",
    }

    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        generation_config=generation_config
    )

    # 2. Subir el archivo (Gemini necesita procesarlo)
   
    myfile = genai.upload_file(ruta_imagen)

    # 3.  Prompt 
    prompt = """
    Analiza esta carta de Pokémon TCG. Extrae la información fielmente.
    Devuelve ÚNICAMENTE este objeto JSON:
    {
      "nombre": "Nombre de la carta",
      "hp": "XX",
      "tipo": "Tipo principal (Fuego, Agua, etc)",
      "ataques": [
        {"nombre": "Nombre ataque 1", "daño": "XX", "coste": "Energías necesarias"},
        {"nombre": "Nombre ataque 2", "daño": "XX", "coste": "Energías necesarias"}
      ],
      "debilidad": "Tipo y cantidad",
      "descripcion": "Cualquier texto de regla especial o habilidad"
    }
    Si algún dato no es visible, pon null.
    """

    # 4. Generar respuesta
    result = model.generate_content([myfile, prompt])
    
    # Calcular tiempo para ver rendimiento
    elapsed = time.time() - start_time
    print(f"Análisis completado en {elapsed:.2f} segundos.")

    # 5. Parsear el texto a un diccionario de Python real
    try:
        datos_json = json.loads(result.text)
        return datos_json
    except json.JSONDecodeError:
        print("Error: Gemini no devolvió un JSON válido.")
        return None

