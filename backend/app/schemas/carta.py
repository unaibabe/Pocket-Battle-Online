from pydantic import BaseModel
from typing import Optional

class CartaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    tipo: str
    rareza: str
    ataque: Optional[int] = 0
    defensa: Optional[int] = 0
    coste: Optional[int] = 0

class CartaCreate(CartaBase):
    pass

class CartaResponse(CartaBase):
    id: int

    class Config:
        from_attributes = True