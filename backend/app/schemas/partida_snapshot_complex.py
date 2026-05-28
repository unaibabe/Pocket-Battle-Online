from pydantic import BaseModel
from typing import List, Optional, Literal


# PIEZAS DEL TABLERO

class CartaAdjunta(BaseModel):
    """Representa una energia o herramienta pegada al poke"""
    id_carta: str  # ID de la carta (ej: base1-98)
    tipo: Literal["ENERGIA", "HERRAMIENTA"]
    nombre: str  # ej: energia de fuego, capa noseque


class PokemonEstado(BaseModel):
    """Un Pokémon en la mesa (con todito lo que lleva encima)"""
    id_carta: str  # ID del poke (ej: sv3-125)
    nombre: str  # Nombre de la carta
    hp_actual: int  # Vida actual que cambia al recibir daño o añadir objetos
    hp_max: int  # Vida total con la que pintamos la barra

    # Estados Alterados (Checkboxes de la UI)
    condiciones: List[Literal["QUEMADO", "ENVENENADO", "DORMIDO", "PARALIZADO", "CONFUSO"]] = []

    energias_adjuntas: List[CartaAdjunta] = []  # Lista de energías
    herramientas_adjuntas: List[CartaAdjunta] = []  # Objetos adjuntos a la carta

    retirada_coste: int = 0  # Cuántas energías cuesta retirarlo


# JUGADORES

class JugadorEstado(BaseModel):
    usuario_id: int
    nombre: str

    premios_restantes: int = 6
    mano_cantidad: int = 7  

    mano_cartas: List[str] = [] 

    cementerio: List[str] = [] 
    mazo_cantidad: int = 40  


    pokemon_activo: Optional[PokemonEstado] = None
    banca: List[PokemonEstado] = []


class PartidaSnapshot(BaseModel):
    turno: int = 1
    fase: str = "PRINCIPAL"
    jugador_activo: int

    jugador_1: JugadorEstado
    jugador_2: JugadorEstado