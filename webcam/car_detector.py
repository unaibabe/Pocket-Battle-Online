import cv2
import numpy as np
import time
from threading import Thread
import threading 
from ia_analyzer import obtener_datos_carta 

# --- VARIABLES GLOBALES (ESTADO DEL JUEGO) ---
# Estas variables permiten que el hilo de la cámara y el hilo de la IA se comuniquen
datos_carta_actual = None 
analizando = False         

# --- PARTE 1: VIDEO STREAM  ---
class VideoStream:
    def __init__(self, resolution=(1280, 720), framerate=30, src=0):
        self.stream = cv2.VideoCapture(src)
        self.stream.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*'MJPG'))
        self.stream.set(3, resolution[0])
        self.stream.set(4, resolution[1])
        (self.grabbed, self.frame) = self.stream.read()
        self.stopped = False

    def start(self):
        Thread(target=self.update, args=()).start()
        return self

    def update(self):
        while True:
            if self.stopped:
                self.stream.release()
                return
            (self.grabbed, self.frame) = self.stream.read()

    def read(self):
        return self.frame

    def stop(self):
        self.stopped = True

# --- PARTE 2: LÓGICA DE PROCESAMIENTO  ---
BKG_THRESH = 60       
CARD_MIN_AREA = 25000 
CARD_MAX_AREA = 120000 

def preprocess_image(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    img_w, img_h = np.shape(image)[:2]
    bkg_level = gray[int(img_h/100)][int(img_w/2)]
    thresh_level = bkg_level + BKG_THRESH
    retval, thresh = cv2.threshold(blur, thresh_level, 255, cv2.THRESH_BINARY)
    return thresh

def find_card_contours(thresh_image):
    cnts, hier = cv2.findContours(thresh_image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    cnts = sorted(cnts, key=cv2.contourArea, reverse=True)
    if len(cnts) == 0:
        return [], None
    for i in range(len(cnts)):
        card_cnt = cnts[i]
        size = cv2.contourArea(card_cnt)
        peri = cv2.arcLength(card_cnt, True)
        approx = cv2.approxPolyDP(card_cnt, 0.01 * peri, True)
        if (size < CARD_MAX_AREA) and (size > CARD_MIN_AREA) and (len(approx) == 4):
            return approx, card_cnt 
    return [], None

def flatten_card(image, pts):
    rect = np.zeros((4, 2), dtype="float32")
    s = np.sum(pts, axis=2)
    rect[0] = pts[np.argmin(s)] 
    rect[2] = pts[np.argmax(s)] 
    diff = np.diff(pts, axis=-1)
    rect[1] = pts[np.argmin(diff)] 
    rect[3] = pts[np.argmax(diff)] 
    maxWidth = 400
    maxHeight = 560
    dst = np.array([
        [0, 0],
        [maxWidth - 1, 0],
        [maxWidth - 1, maxHeight - 1],
        [0, maxHeight - 1]], dtype="float32")
    M = cv2.getPerspectiveTransform(rect, dst)
    warp = cv2.warpPerspective(image, M, (maxWidth, maxHeight))
    return warp

# --- PARTE 3: NUEVAS FUNCIONES PARA AR Y HILOS ---

def dibujar_hud_pokemon(frame, approx_poly, datos):
    """ Dibuja la info del Pokémon pegada a la carta """
    if not datos: return
    
    # Coordenada superior izquierda de la carta
    x, y = approx_poly[0][0] 
    
    # Fondo negro para el texto
    cv2.rectangle(frame, (x - 20, y - 80), (x + 250, y - 10), (0, 0, 0), -1)
    cv2.rectangle(frame, (x - 20, y - 80), (x + 250, y - 10), (255, 255, 255), 2) # Borde blanco
    
    # Datos
    nombre = datos.get('nombre', '???')
    hp = datos.get('hp', '??')
    
    # Escribir Nombre
    cv2.putText(frame, nombre, (x, y - 50), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    
    # Escribir Vida
    cv2.putText(frame, f"HP: {hp}", (x, y - 25), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

def tarea_analisis_ia(imagen_plana):
    """ Esta función se ejecuta en segundo plano  """
    global datos_carta_actual, analizando
    analizando = True
    
    # Guardar imagen temp
    ruta = "temp_card.jpg"
    cv2.imwrite(ruta, imagen_plana)
    
    # LLAMAR A GEMINI
    print("Hilo: Enviando a Gemini...")
    resultado = obtener_datos_carta(ruta)
    
    if resultado:
        datos_carta_actual = resultado
        print("Hilo: Datos recibidos.")
    
    analizando = False

# --- PARTE 4: BUCLE PRINCIPAL ---

def main():
    global datos_carta_actual, analizando

    # Inicializar cámara
    videostream = VideoStream(resolution=(1280, 720), src=0).start()
    time.sleep(1) 

    font = cv2.FONT_HERSHEY_SIMPLEX
    print("Iniciando Pocket Battle AR... Pulsa 'q' para salir, 's' para escanear.")

    while True:
        frame = videostream.read()
        if frame is None: break

        # 1. Preprocesar y Detectar
        pre_proc = preprocess_image(frame)
        approx_poly, card_cnt = find_card_contours(pre_proc)

        # Si detectamos carta...
        if len(approx_poly) != 0:
            
            # Dibujar contorno verde siempre
            cv2.drawContours(frame, [approx_poly], -1, (0, 255, 0), 2)

            # --- GESTIÓN DE LA INTERFAZ (AR) ---
            
            # CASO A: Estamos esperando a la IA
            if analizando:
                x, y = approx_poly[0][0]
                cv2.putText(frame, "Cargando IA...", (x, y - 20), 
                            font, 1, (0, 255, 255), 2)
                # Dibujar un circulito o algo que indique carga en la esquina
                cv2.circle(frame, (x+200, y-30), 10, (0,255,255), -1)

            # CASO B: Ya tenemos los datos -> MOSTRAR HUD
            elif datos_carta_actual:
                dibujar_hud_pokemon(frame, approx_poly, datos_carta_actual)

            # CASO C: No estamos haciendo nada -> INSTRUCCIONES
            else:
                x, y = approx_poly[0][0]
                cv2.putText(frame, "Pulsa 'S' para analizar", (x, y - 10), 
                            font, 0.7, (0, 255, 0), 2)

            # --- INPUT DEL USUARIO ---
            key = cv2.waitKey(1) & 0xFF
            
            # Solo permitimos pulsar 'S' si no estamos ya analizando
            if key == ord("s") and not analizando:
                print("Captura iniciada. Procesando en segundo plano...")
                
                # Preparamos la imagen plana
                flat_card = flatten_card(frame, approx_poly)
                
                hilo_ia = threading.Thread(target=tarea_analisis_ia, args=(flat_card,))
                hilo_ia.start()

        else:
           
            datos_carta_actual = None 
            cv2.putText(frame, "Buscando carta...", (10, 30), font, 0.7, (0, 0, 255), 2)

        # Mostrar video final
        cv2.imshow("Pocket Battle AR", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cv2.destroyAllWindows()
    videostream.stop()

if __name__ == "__main__":
    main()