from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Carta(Base):
    __tablename__ = "cartas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    descripcion = Column(Text, nullable=True)
    imagen_url = Column(String, nullable=True)

    # atributos carta
    tipo = Column(String, nullable=False)
    ataque = Column(Integer, nullable=True)
    defensa = Column(Integer, nullable=True)
    coste = Column(Integer, nullable=False)
    rareza = Column(String, nullable=False)

    # en que mazo esta la carta
    detalles_mazo = relationship("MazoCarta", back_populates="carta")