from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class JugadorTracker(BaseModel):
    id: int
    nombre: str
    vida_activa: int = 0 
    premios_tomados: int = 0 
 
    estados: List[str] = []
  
    pokemon_activo_data: Dict[str, Any] = {}


class PartidaTracker(BaseModel):
    """
    Estado simplificado para el MVP.
    Es un JSON flexible que comparten los dos ordenadores.
    """
    turno: int = 1
    jugador_activo: int
    fase: str = "JUEGO"

    jugador_1: JugadorTracker
    jugador_2: JugadorTracker

    log_acciones: List[str] = []

    class Config:
        from_attributes = True