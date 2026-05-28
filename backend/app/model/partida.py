from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


class Partida(Base):
    __tablename__ = "partidas"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())

    # Código público de sala para compartir con otro jugador
    codigo_sala = Column(String(10), unique=True, nullable=False, index=True)

    # Jugadores
    jugador_1_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    jugador_2_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)

    # Estado general de la partida
    # ESPERANDO_RIVAL, EN_CURSO, FINALIZADA, ABANDONADA
    estado = Column(String, default="ESPERANDO_RIVAL")
    ganador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    resultado_detalle = Column(String, nullable=True)

    # Snapshot real del frontend
    snapshot = Column(JSONB, nullable=True)

    # Relaciones
    jugador_1 = relationship(
        "Usuario",
        foreign_keys=[jugador_1_id],
        back_populates="partidas_jugadas_j1"
    )
    jugador_2 = relationship(
        "Usuario",
        foreign_keys=[jugador_2_id],
        back_populates="partidas_jugadas_j2"
    )

    def __repr__(self):
        return (
            f"<Partida(id={self.id}, codigo_sala={self.codigo_sala}, "
            f"estado={self.estado}, j1={self.jugador_1_id}, j2={self.jugador_2_id})>"
        )