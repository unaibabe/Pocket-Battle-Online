# Pocket Battle Online

## Descripción del Proyecto

Pocket Battle Online es una plataforma web integral diseñada para digitalizar la experiencia de los juegos de cartas coleccionables (TCG), específicamente enfocada en Pokémon TCG. A diferencia de los simuladores digitales convencionales, este sistema permite a los usuarios utilizar sus mazos de cartas físicos originales mediante el uso de cámaras web y tecnologías de visión artificial.

El proyecto resuelve la problemática de la distancia geográfica y las barreras económicas de las versiones digitales, permitiendo partidas remotas fluidas que respetan la inversión física del jugador.

## Objetivos Técnicos

*   **Comunicación de baja latencia:** Implementación de un sistema punto a punto (P2P) mediante el protocolo WebRTC para garantizar una transmisión de vídeo y audio fluida.
*   **Identificación mediante Visión Artificial:** Integración de algoritmos de procesamiento de imagen con OpenCV y modelos de Inteligencia Artificial multimodal para automatizar el reconocimiento de activos físicos.
*   **Sincronización de estado:** Gestión bidireccional del estado de la partida mediante WebSockets (Socket.IO) para evitar discrepancias entre los clientes.
*   **Arquitectura Escalable:** Diseño basado en microservicios desacoplados y una base de datos relacional con soporte para datos semiestructurados.

## Stack Tecnológico

### Frontend

*   **React:** Biblioteca principal para la creación de interfaces basadas en componentes.
*   **Tailwind CSS:** Marco de trabajo para el diseño visual y la adaptabilidad de la interfaz.
*   **WebRTC & Socket.IO:** Protocolos para la comunicación multimedia y la sincronización de datos en tiempo real.

### Backend

*   **Python & FastAPI:** Framework de alto rendimiento para la construcción de la API asíncrona.
*   **PostgreSQL:** Sistema de gestión de base de datos relacional, utilizando campos JSONB para la persistencia de snapshots de las partidas.
*   **Alembic:** Herramienta para la gestión de migraciones de la base de datos.

### Visión Artificial e IA

*   **OpenCV:** Procesamiento técnico de imágenes, detección de contornos y correcciones de perspectiva.
*   **Gemini 1.5 Flash:** Modelo multimodal utilizado para el análisis semántico y la extracción de datos estructurados a partir de capturas de vídeo.

## Guía de Imágenes Sugeridas

Para mejorar la documentación visual del repositorio, se recomienda incluir las siguientes capturas en las secciones correspondientes:

*   **Interfaz Principal de Combate:** (Sugerida tras la sección de Descripción). Utilizar la Figura 10: UI web del documento, que muestra el tablero compartido, los flujos de vídeo y el tracker de daño.
*   **Diagrama de Arquitectura de Datos:** (Sugerida en la sección de Stack Tecnológico). Utilizar la Figura 3: Diagrama de Clases UML, que detalla la relación entre usuarios, mazos y la persistencia en JSONB.
*   **Proceso de Reconocimiento de IA:** (Sugerida en la sección de Visión Artificial). Incluir una composición de la Figura 13: Tablero webcam junto a la Figura 15: JSON Gemini, para ilustrar la transición de imagen física a datos estructurados.
*   **Especificación de la API:** (Sugerida en la sección de Backend). Utilizar la Figura 16: Endpoints, que muestra la interfaz de Swagger y los puntos de acceso del sistema.

## Instalación y Despliegue

Para la puesta en marcha de Pocket Battle Online, es necesario disponer de un entorno configurado con Python 3.10+, Node.js 18+ y una instancia activa de PostgreSQL.

### 1. Clonación del Repositorio

El primer paso consiste en obtener una copia local del código fuente desde el repositorio oficial:

```bash
git clone https://github.com/davidcruzart/APP_TCG_WEB
cd APP_TCG_WEB
```

### 2. Configuración del Servidor (Backend)

El backend requiere la creación de un entorno virtual para aislar las dependencias.

#### En sistemas Unix (Linux y macOS)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

#### En sistemas Windows (PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

#### Migraciones de Base de Datos

Una vez activado el entorno, aplica las migraciones para establecer el esquema en PostgreSQL:

```bash
alembic upgrade head
```

### 3. Configuración del Cliente (Frontend)

La aplicación de React requiere la instalación de sus dependencias mediante npm.

```bash
cd ../pocket-battle-frontend
npm install
```

### Ejecución del Cliente (Frontend)

```bash
# Instalación de dependencias
npm install

# Inicio en modo desarrollo
npm run dev
```

## Autores y Tutoría

*   **Desarrolladores:** David Malagón, Unai Ibabe, Xavier Valverde.
*   **Tutor:** Ignacio Seguí Tomás.
*   **Institución:** UNIR FP - Técnico Superior en Desarrollo de Aplicaciones Multiplataforma.
*   **Fecha:** Marzo 2026.