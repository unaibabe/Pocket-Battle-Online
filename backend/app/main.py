from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from passlib.context import CryptContext
import random
import string
import socketio

import os
import uuid
from app.database import get_db
from app.ia_analyzer import obtener_datos_carta
from app.model.usuario import Usuario
from app.model.partida import Partida
from app.model.carta import Carta

app = FastAPI(title="PokeTCG Tracker - MVP")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
)

socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app,
)


pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


class UsuarioCreate(BaseModel):
    nombre: str
    email: str = "test@test.com"
    password: str = "1234"


class UsuarioLogin(BaseModel):
    nombre: str
    password: str


class GameStateSnapshot(BaseModel):
    turn: str
    local: Dict[str, Any]
    opponent: Dict[str, Any]
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
    jugador_1_nombre: Optional[str] = None
    jugador_2_nombre: Optional[str] = None
    snapshot: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True



def create_empty_active():
    return {
        "id": None,
        "damage": 0,
        "name": "",
        "hp": None,
        "conditions": {},
        "pokemonData": None,
    }


def create_empty_bench():
    return [
        {
            "id": None,
            "damage": 0,
            "name": "",
            "hp": None,
            "conditions": {},
            "pokemonData": None,
        }
        for _ in range(5)
    ]


def create_initial_state():
    return {
        "turn": "local",
        "local": {
            "active": create_empty_active(),
            "bench": create_empty_bench(),
            "prizes": 6,
        },
        "opponent": {
            "active": create_empty_active(),
            "bench": create_empty_bench(),
            "prizes": 6,
        },
        "log": [{"type": "system", "message": "Partida iniciada"}],
    }


def generate_room_code(length: int = 6):
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choice(chars) for _ in range(length))


async def generate_unique_room_code(db: AsyncSession):
    while True:
        code = generate_room_code()
        result = await db.execute(select(Partida).where(Partida.codigo_sala == code))
        existing = result.scalars().first()
        if not existing:
            return code



@app.post("/usuarios/")
async def crear_usuario(usuario: UsuarioCreate, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Usuario).where(Usuario.usuario == usuario.nombre))
        existing_user = result.scalars().first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Ya existe un usuario con ese nombre")

        nuevo = Usuario(
            usuario=usuario.nombre,
            email=usuario.email,
            hashed_pw=hash_password(usuario.password),
        )

        db.add(nuevo)
        await db.commit()
        await db.refresh(nuevo)

        return {
            "id": nuevo.id,
            "usuario": nuevo.usuario,
            "mensaje": "Creado correctamente",
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR CREANDO USUARIO:", repr(e))
        raise HTTPException(status_code=500, detail=f"Error interno: {repr(e)}")


@app.post("/usuarios/login")
async def login(datos: UsuarioLogin, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Usuario).where(Usuario.usuario == datos.nombre))
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="Usuario no existe")

        if not verify_password(datos.password, user.hashed_pw):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

        return {
            "id": user.id,
            "usuario": user.usuario,
            "status": "success",
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ERROR EN LOGIN:", repr(e))
        raise HTTPException(status_code=500, detail=f"Error interno: {repr(e)}")


@app.post("/lobby/create")
async def crear_sala(datos: LobbyCreateRequest, db: AsyncSession = Depends(get_db)):
    user1 = await db.get(Usuario, datos.jugador_1_id)

    if not user1:
        raise HTTPException(status_code=404, detail="El creador no existe")

    code = await generate_unique_room_code(db)

    nueva_partida = Partida(
        jugador_1_id=user1.id,
        jugador_2_id=None,
        estado="ESPERANDO_RIVAL",
        snapshot=create_initial_state(),
        codigo_sala=code,
    )

    db.add(nueva_partida)
    await db.commit()
    await db.refresh(nueva_partida)

    return {
        "partida_id": nueva_partida.id,
        "code": nueva_partida.codigo_sala,
        "estado": nueva_partida.estado,
    }


@app.post("/lobby/join")
async def unirse_sala(datos: LobbyJoinRequest, db: AsyncSession = Depends(get_db)):
    code = datos.code.strip().upper()

    result = await db.execute(select(Partida).where(Partida.codigo_sala == code))
    partida = result.scalars().first()

    if not partida:
        raise HTTPException(status_code=404, detail="Código de sala no encontrado")

    if partida.jugador_1_id == datos.jugador_2_id:
        raise HTTPException(status_code=400, detail="No puedes unirte a tu propia sala como rival")

    if partida.estado == "FINALIZADA":
        raise HTTPException(status_code=400, detail="La partida ya está finalizada")

    if partida.estado == "ABANDONADA":
        raise HTTPException(status_code=400, detail="La partida está abandonada")

    user2 = await db.get(Usuario, datos.jugador_2_id)
    if not user2:
        raise HTTPException(status_code=404, detail="El usuario rival no existe")

    if partida.jugador_2_id is not None and partida.jugador_2_id != user2.id:
        raise HTTPException(status_code=400, detail="La sala ya está ocupada")

    partida.jugador_2_id = user2.id
    partida.estado = "EN_CURSO"

    await db.commit()
    await db.refresh(partida)

    return {
        "partida_id": partida.id,
        "code": partida.codigo_sala,
        "estado": partida.estado,
    }


@app.post("/iniciar-partida/")
async def iniciar_partida(datos: PartidaCreateRequest, db: AsyncSession = Depends(get_db)):
    user1 = await db.get(Usuario, datos.jugador_1_id)
    user2 = await db.get(Usuario, datos.jugador_2_id) if datos.jugador_2_id else None

    if not user1:
        raise HTTPException(status_code=404, detail="Jugador 1 no válido")

    if datos.jugador_2_id is not None and not user2:
        raise HTTPException(status_code=404, detail="Jugador 2 no válido")

    if user2 and user1.id == user2.id:
        raise HTTPException(status_code=400, detail="No puedes crear una partida contra ti mismo")

    codigo_sala = await generate_unique_room_code(db)

    nueva_partida = Partida(
        jugador_1_id=user1.id,
        jugador_2_id=user2.id if user2 else None,
        estado="EN_CURSO" if user2 else "ESPERANDO_RIVAL",
        snapshot=create_initial_state(),
        codigo_sala=codigo_sala,
    )

    db.add(nueva_partida)
    await db.commit()
    await db.refresh(nueva_partida)
    return nueva_partida


@app.get("/partida/{partida_id}", response_model=PartidaResponse)
async def obtener_partida(partida_id: int, db: AsyncSession = Depends(get_db)):
    partida = await db.get(Partida, partida_id)

    if not partida:
        raise HTTPException(status_code=404, detail="Partida no encontrada")

    jugador_1 = await db.get(Usuario, partida.jugador_1_id)
    jugador_2 = await db.get(Usuario, partida.jugador_2_id) if partida.jugador_2_id else None

    return {
        "id": partida.id,
        "codigo_sala": partida.codigo_sala,
        "estado": partida.estado,
        "jugador_1_id": partida.jugador_1_id,
        "jugador_2_id": partida.jugador_2_id,
        "jugador_1_nombre": jugador_1.usuario if jugador_1 else None,
        "jugador_2_nombre": jugador_2.usuario if jugador_2 else None,
        "snapshot": partida.snapshot,
    }


@app.post("/partida/{partida_id}/sync")
async def guardar_snapshot_real(
    partida_id: int,
    estado_front: GameStateSnapshot,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Partida).where(Partida.id == partida_id))
    partida = result.scalars().first()

    if not partida:
        raise HTTPException(status_code=404, detail="Partida no encontrada")

    partida.snapshot = estado_front.dict()

    await db.commit()

    print(f"SNAPSHOT GUARDADO -> Partida {partida_id}")
    return {"status": "ok"}


@app.get("/usuarios/{usuario_id}/partidas", response_model=List[PartidaResponse])
async def obtener_mis_partidas(usuario_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Partida)
        .where(
            (Partida.jugador_1_id == usuario_id) |
            (Partida.jugador_2_id == usuario_id)
        )
        .order_by(Partida.id.desc())
    )
    return result.scalars().all()



@app.post("/escanear-carta")
async def escanear_carta(file: UploadFile = File(...)):
    try:
        temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
        with open(temp_filename, "wb") as buffer:
            buffer.write(await file.read())
        
        datos = obtener_datos_carta(temp_filename)
        
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                print(f"Error borrando temp img: {e}")
                
        if datos:
            hp_val = datos.get("hp", 0)
            if isinstance(hp_val, str) and hp_val.isdigit():
                hp_val = int(hp_val)
                
            return {
                "name": datos.get("nombre", "Desconocido"),
                "hp": hp_val,
                "id": "scanned-" + uuid.uuid4().hex[:8],
                "ataques": datos.get("ataques", []),
                "debilidad": datos.get("debilidad", ""),
                "descripcion": datos.get("descripcion", ""),
                "tipo": datos.get("tipo", "")
            }
            
        return {
            "name": "Error escaneando",
            "hp": 0,
            "id": "error-id",
        }
    except Exception as e:
        print(f"Error en escanear_carta: {e}")
        return {
            "name": "Error",
            "hp": 0,
            "id": "error-id",
        }


# ==========================================
# 4. HEALTH CHECK
# ==========================================

@app.get("/")
async def health_check():
    return {
        "status": "online",
        "version": "1.7.1",
        "engine": "FastAPI + Socket.IO + PostgreSQL + Lobby Codes + WebRTC Relay",
    }


@sio.event
async def connect(sid, environ):
    print(f"SOCKET CONNECTED: {sid}")


@sio.event
async def disconnect(sid):
    print(f"SOCKET DISCONNECTED: {sid}")


@sio.event
async def JOIN_ROOM(sid, data):
    room_id = str(data.get("roomId"))
    if not room_id:
        await sio.emit("ERROR", {"message": "roomId no válido"}, to=sid)
        return

    await sio.enter_room(sid, room_id)
    print(f" {sid} joined room {room_id}")

    await sio.emit(
        "PLAYER_CONNECTED",
        {"sid": sid, "roomId": room_id},
        room=room_id,
    )


@sio.event
async def GAME_ACTION(sid, data):
    room_id = str(data.get("roomId"))
    payload = data.get("payload")

    if not room_id or payload is None:
        await sio.emit("ERROR", {"message": "GAME_ACTION inválido"}, to=sid)
        return

    print(f"GAME_ACTION room={room_id} sid={sid} type={payload.get('type')}")

    await sio.emit(
        "GAME_ACTION",
        payload,
        room=room_id,
        skip_sid=sid,
    )


@sio.event
async def CHAT_MESSAGE(sid, data):
    room_id = str(data.get("roomId"))
    payload = data.get("payload")

    if not room_id or payload is None:
        await sio.emit("ERROR", {"message": "CHAT_MESSAGE inválido"}, to=sid)
        return

    await sio.emit(
        "CHAT_MESSAGE",
        payload,
        room=room_id,
        skip_sid=sid,
    )


@sio.event
async def WEBRTC_SIGNAL(sid, data):
    room_id = str(data.get("roomId"))
    payload = data.get("payload") or data.get("data")

    if not room_id or payload is None:
        await sio.emit("ERROR", {"message": "WEBRTC_SIGNAL inválido"}, to=sid)
        return

    print(f"WEBRTC_SIGNAL room={room_id} from={sid} type={payload.get('type')}")

    await sio.emit(
        "WEBRTC_SIGNAL",
        payload,
        room=room_id,
        skip_sid=sid,
    )


@sio.event
async def PING(sid, data):
    await sio.emit("PONG", data or {}, to=sid)
