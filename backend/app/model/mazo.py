from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


# tabla intermedia
class MazoCarta(Base):
    __tablename__ = "mazos_cartas"

    mazo_id = Column(Integer, ForeignKey("mazos.id"), primary_key=True)
    carta_id = Column(Integer, ForeignKey("cartas.id"), primary_key=True)
    cantidad = Column(Integer, default=1, nullable=False)  # numero de cartas

    # relaciones
    mazo = relationship("Mazo", back_populates="cartas_en_mazo")
    carta = relationship("Carta", back_populates="detalles_mazo")


# tabla mazos
class Mazo(Base):
    __tablename__ = "mazos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)  #nombre mazo
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    usuario = relationship("Usuario", back_populates="mazos")

    # relacion n:m con cartas
    cartas_en_mazo = relationship("MazoCarta", back_populates="mazo", cascade="all, delete-orphan")