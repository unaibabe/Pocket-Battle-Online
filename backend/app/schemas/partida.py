from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal


class CartaAdjunta(BaseModel):
    id_carta: str
    tipo: Literal["ENERGIA", "HERRAMIENTA"]
    nombre: str

class PokemonEstado(BaseModel):
    id_carta: Optional[str] = None
    nombre: str = ""
    damage: int = 0
    hp_max: int = 0
    conditions: Dict[str, bool] = Field(default_factory=dict)
    energias_adjuntas: List[CartaAdjunta] = Field(default_factory=list)
    pokemonData: Optional[Dict[str, Any]] = None

class JugadorEstado(BaseModel):
    usuario_id: Optional[int] = None
    nombre: str = ""
    prizes: int = 6
    active: Optional[PokemonEstado] = None
    bench: List[PokemonEstado] = Field(default_factory=list)
    mano_cantidad: int = 7
    cementerio: List[str] = Field(default_factory=list)

class PartidaSnapshot(BaseModel):
    turno: str = "local"
    fase: str = "PRINCIPAL"
    jugador_activo_id: Optional[int] = None
    local: JugadorEstado
    opponent: JugadorEstado
    log: List[Dict[str, Any]] = Field(default_factory=list)

class PartidaCreateRequest(BaseModel):
    jugador_1_id: int
    jugador_2_id: Optional[int] = None

class LobbyCreateRequest(BaseModel):
    jugador_1_id: int

class LobbyJoinRequest(BaseModel):
    jugador_2_id: int
    code: str

class PartidaResponse(BaseModel):
    id: int
    codigo_sala: Optional[str] = None
    estado: str
    jugador_1_id: int
    jugador_2_id: Optional[int] = None
    snapshot: Optional[PartidaSnapshot] = None

    class Config:
        from_attributes = True