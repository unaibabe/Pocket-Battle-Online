from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    usuario = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_pw = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # relacion 1:n (un usuario crea muchos mazos)
    mazos = relationship("Mazo", back_populates="usuario")

    partidas_jugadas_j1 = relationship("Partida", foreign_keys="[Partida.jugador_1_id]", back_populates="jugador_1")
    partidas_jugadas_j2 = relationship("Partida", foreign_keys="[Partida.jugador_2_id]", back_populates="jugador_2")