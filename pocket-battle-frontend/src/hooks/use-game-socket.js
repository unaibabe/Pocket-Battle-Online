import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";

const PLAYER_LOCAL = "local";
const PLAYER_OPPONENT = "opponent";

const MSG_DAMAGE_UPDATE = "damage_counter_update";
const MSG_BENCH_DAMAGE_UPDATE = "bench_damage_update";
const MSG_CONDITION_TOGGLE = "condition_toggle";
const MSG_PRIZES_UPDATE = "prizes_update";
const MSG_STATE_RESET = "state_reset";
const MSG_KO = "knock_out";
const MSG_SWAP = "swap";
const MSG_END_TURN = "end_turn";
const MSG_ADD_TO_BENCH = "add_to_bench";
const MSG_COIN_FLIP = "coin_flip";
const MSG_CHAT_MESSAGE = "chat_message";
const MSG_SET_ACTIVE_POKEMON = "set_active_pokemon";

const STATUS_CONNECTING = "connecting";
const STATUS_CONNECTED = "connected";
const STATUS_DISCONNECTED = "disconnected";

const API_BASE_URL = "https://app-tcg-web.onrender.com";

const createBench = () =>
  Array(5)
    .fill(null)
    .map(() => ({
      id: null,
      damage: 0,
      name: "",
      hp: null,
      conditions: {},
      pokemonData: null,
    }));

const createActive = () => ({
  id: null,
  damage: 0,
  name: "",
  hp: null,
  conditions: {},
  pokemonData: null,
});

const INITIAL_GAME_STATE = {
  turn: PLAYER_LOCAL,
  [PLAYER_LOCAL]: {
    active: createActive(),
    bench: createBench(),
    prizes: 6,
  },
  [PLAYER_OPPONENT]: {
    active: createActive(),
    bench: createBench(),
    prizes: 6,
  },
  log: [],
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

function getCurrentUserId() {
  try {
    const raw = sessionStorage.getItem("poke_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Number(parsed?.id ?? parsed?.usuario?.id ?? null);
  } catch {
    return null;
  }
}

function swapPerspective(snapshot) {
  if (!snapshot) return snapshot;

  return {
    ...snapshot,
    local: deepClone(snapshot.opponent),
    opponent: deepClone(snapshot.local),
    turn:
      snapshot.turn === PLAYER_LOCAL
        ? PLAYER_OPPONENT
        : snapshot.turn === PLAYER_OPPONENT
          ? PLAYER_LOCAL
          : snapshot.turn,
  };
}

function swapPlayerLabel(player) {
  if (player === PLAYER_LOCAL) return PLAYER_OPPONENT;
  if (player === PLAYER_OPPONENT) return PLAYER_LOCAL;
  return player;
}

function transformMessagePerspective(message, shouldSwap) {
  const transformed = deepClone(message);

  if (!shouldSwap) {
    return transformed;
  }

  if (transformed?.payload?.player) {
    transformed.payload.player = swapPlayerLabel(transformed.payload.player);
  }

  return transformed;
}

export function useGameSocket(roomId) {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(STATUS_DISCONNECTED);
  const [perspectiveReady, setPerspectiveReady] = useState(false);
  const [playerNames, setPlayerNames] = useState({
    local: "Jugador local",
    opponent: "Rival",
  });
  const [isCaller, setIsCaller] = useState(false);

  const socketRef = useRef(null);
  const hasLoadedInitialStateRef = useRef(false);
  const isPerspectiveSwappedRef = useRef(false);

  const normalizeMessageForSocket = useCallback((message) => {
    return transformMessagePerspective(message, isPerspectiveSwappedRef.current);
  }, []);

  const denormalizeMessageFromSocket = useCallback((message) => {
    return transformMessagePerspective(message, isPerspectiveSwappedRef.current);
  }, []);

  const applyMessage = useCallback((message) => {
    const { type, payload } = message;

    setGameState((prev) => {
      const newState = deepClone(prev);

      if (type === MSG_DAMAGE_UPDATE) {
        newState[payload.player].active.damage = payload.value;
      } else if (type === MSG_BENCH_DAMAGE_UPDATE) {
        newState[payload.player].bench[payload.benchIndex].damage = payload.newDamage;
      } else if (type === MSG_KO) {
        const opponent = payload.player === PLAYER_LOCAL ? PLAYER_OPPONENT : PLAYER_LOCAL;
        newState[payload.player].active = createActive();
        newState[opponent].prizes = Math.max(0, newState[opponent].prizes - 1);
        newState.log.push({ type: "system", message: "KO! Prize taken." });
      } else if (type === MSG_SWAP) {
        const field = newState[payload.player];
        const newActive = deepClone(field.bench[payload.benchIndex]);
        const movedToBench = {
          ...deepClone(field.active),
          conditions: {},
        };

        field.active = newActive;
        field.bench[payload.benchIndex] = movedToBench;
      } else if (type === MSG_ADD_TO_BENCH) {
        newState[payload.player].bench[payload.benchIndex] = {
          id: payload.pokemonData?.id ?? null,
          name: payload.pokemonData?.name ?? "",
          hp: payload.pokemonData?.hp ?? null,
          damage: 0,
          conditions: {},
          pokemonData: payload.pokemonData,
        };
      } else if (type === MSG_END_TURN) {
        newState.turn = prev.turn === PLAYER_LOCAL ? PLAYER_OPPONENT : PLAYER_LOCAL;
      } else if (type === MSG_CONDITION_TOGGLE) {
        const current = prev[payload.player].active.conditions || {};
        newState[payload.player].active.conditions = {
          ...current,
          [payload.condition]: !current[payload.condition],
        };
      } else if (type === MSG_PRIZES_UPDATE) {
        newState[payload.player].prizes = payload.value;
      } else if (type === MSG_SET_ACTIVE_POKEMON) {
        const currentActive = prev[payload.player].active || createActive();
        newState[payload.player].active = {
          ...currentActive,
          id: payload.pokemonData?.id ?? currentActive.id ?? null,
          name: payload.pokemonData?.name ?? currentActive.name ?? "",
          hp: payload.pokemonData?.hp ?? currentActive.hp ?? null,
          pokemonData: payload.pokemonData,
        };
      } else if (type === MSG_STATE_RESET) {
        return deepClone(INITIAL_GAME_STATE);
      } else if (type === MSG_COIN_FLIP) {
        newState.log.push({
          type: "system",
          message: `Coin: ${payload.result.toUpperCase()}`,
        });
      } else if (type === MSG_CHAT_MESSAGE) {
        newState.log.push({
          type: "user",
          player: payload.player,
          message: payload.message,
        });
      }

      return newState;
    });
  }, []);

  const persistSnapshot = useCallback(
    async (stateOverride = null, useKeepalive = false) => {
      if (!roomId || roomId === "demo-room") return;
      if (!hasLoadedInitialStateRef.current) return;

      try {
        const stateToPersistBase = stateOverride ?? gameState;
        const stateToPersist = isPerspectiveSwappedRef.current
          ? swapPerspective(stateToPersistBase)
          : stateToPersistBase;

        await fetch(`${API_BASE_URL}/partida/${roomId}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stateToPersist),
          keepalive: useKeepalive,
        });
      } catch (err) {
        console.error("SINCRO: Error guardando snapshot", err);
      }
    },
    [gameState, roomId]
  );

  useEffect(() => {
    const cargarPartida = async () => {
      setPerspectiveReady(false);

      if (!roomId || roomId === "demo-room") {
        console.warn("SINCRO: roomId inválido o demo-room, no se carga partida real");
        hasLoadedInitialStateRef.current = true;
        setPerspectiveReady(true);
        return;
      }

      try {
        console.log("SINCRO: Intentando recuperar sala", roomId);
        const response = await fetch(`${API_BASE_URL}/partida/${roomId}`);

        if (!response.ok) {
          console.error("SINCRO: Error al cargar partida:", response.status);
          hasLoadedInitialStateRef.current = true;
          setPerspectiveReady(true);
          return;
        }

        const data = await response.json();
        console.log("SINCRO: Respuesta GET /partida:", data);

        const currentUserId = getCurrentUserId();
        const jugador1Id = Number(data?.jugador_1_id);
        const jugador2Id = Number(data?.jugador_2_id);

        const isPlayer1 = currentUserId === jugador1Id;
        const isPlayer2 = currentUserId === jugador2Id;

        const jugador1Nombre = data?.jugador_1_nombre || "Jugador 1";
        const jugador2Nombre = data?.jugador_2_nombre || "Jugador 2";

        if (!isPlayer1 && !isPlayer2) {
          console.warn(
            "SINCRO: El usuario actual no coincide con jugador_1_id ni jugador_2_id",
            {
              currentUserId,
              jugador1Id,
              jugador2Id,
            }
          );
        }

        isPerspectiveSwappedRef.current = isPlayer2;
        setIsCaller(isPlayer1);

        setPlayerNames(
          isPlayer2
            ? {
                local: jugador2Nombre,
                opponent: jugador1Nombre,
              }
            : {
                local: jugador1Nombre,
                opponent: jugador2Nombre,
              }
        );

        if (data?.snapshot) {
          const normalizedSnapshot = isPlayer2
            ? swapPerspective(data.snapshot)
            : data.snapshot;

          setGameState(normalizedSnapshot);
          console.log(
            isPlayer2
              ? "SINCRO: Snapshot cargado e invertido para jugador 2"
              : "SINCRO: Snapshot cargado con éxito"
          );
        } else {
          console.warn("SINCRO: La partida no trae snapshot");
        }
      } catch (err) {
        console.error("SINCRO: Error carga inicial", err);
      } finally {
        hasLoadedInitialStateRef.current = true;
        setPerspectiveReady(true);
      }
    };

    hasLoadedInitialStateRef.current = false;
    cargarPartida();
  }, [roomId]);

  useEffect(() => {
    if (!roomId || roomId === "demo-room" || !perspectiveReady) return;

    setConnectionStatus(STATUS_CONNECTING);

    const socket = io(API_BASE_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("SOCKET CONNECTED:", socket.id);
      setIsConnected(true);
      setConnectionStatus(STATUS_CONNECTED);

      socket.emit("JOIN_ROOM", {
        roomId: String(roomId),
        userId: getCurrentUserId(),
      });
    });

    socket.on("disconnect", () => {
      console.log("SOCKET DISCONNECTED");
      setIsConnected(false);
      setConnectionStatus(STATUS_DISCONNECTED);
    });

    socket.on("PLAYER_CONNECTED", (data) => {
      console.log("PLAYER_CONNECTED:", data);
    });

    socket.on("GAME_ACTION", (message) => {
      console.log("GAME_ACTION RECIBIDA:", message);
      const localMessage = denormalizeMessageFromSocket(message);
      applyMessage(localMessage);
    });

    socket.on("CHAT_MESSAGE", (payload) => {
      console.log("CHAT_MESSAGE RECIBIDO:", payload);
      const localPayload =
        isPerspectiveSwappedRef.current && payload?.player
          ? { ...payload, player: swapPlayerLabel(payload.player) }
          : payload;

      applyMessage({
        type: MSG_CHAT_MESSAGE,
        payload: localPayload,
      });
    });

    socket.on("ERROR", (payload) => {
      console.error("SOCKET ERROR:", payload);
    });

    socket.on("PONG", (payload) => {
      console.log("PONG:", payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, perspectiveReady, applyMessage, denormalizeMessageFromSocket]);

  useEffect(() => {
    if (!roomId || roomId === "demo-room") return;
    if (!hasLoadedInitialStateRef.current) return;

    const timeoutId = setTimeout(() => {
      persistSnapshot();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [gameState, roomId, persistSnapshot]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      persistSnapshot(gameState, true);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameState, persistSnapshot]);

  const sendMessage = useCallback(
    (message) => {
      console.log("ACCIÓN ENVIADA:", message.type);

      applyMessage(message);

      const socket = socketRef.current;
      if (socket && socket.connected && roomId && roomId !== "demo-room") {
        const canonicalMessage = normalizeMessageForSocket(message);

        socket.emit("GAME_ACTION", {
          roomId: String(roomId),
          payload: canonicalMessage,
        });
      } else {
        console.warn("SOCKET no conectado. Acción solo aplicada localmente.");
      }
    },
    [applyMessage, roomId, normalizeMessageForSocket]
  );

  const updateDamage = useCallback(
    (player, delta) =>
      sendMessage({
        type: MSG_DAMAGE_UPDATE,
        payload: {
          player,
          value: Math.max(0, (gameState[player].active.damage || 0) + delta),
        },
      }),
    [gameState, sendMessage]
  );

  const setActivePokemon = useCallback(
    (player, pokemonData) =>
      sendMessage({
        type: MSG_SET_ACTIVE_POKEMON,
        payload: { player, pokemonData },
      }),
    [sendMessage]
  );

  const updateBenchDamage = useCallback(
    (player, benchIndex, delta) =>
      sendMessage({
        type: MSG_BENCH_DAMAGE_UPDATE,
        payload: {
          player,
          benchIndex,
          newDamage: Math.max(0, (gameState[player].bench[benchIndex]?.damage ?? 0) + delta),
        },
      }),
    [gameState, sendMessage]
  );

  const toggleCondition = useCallback(
    (player, condition) =>
      sendMessage({
        type: MSG_CONDITION_TOGGLE,
        payload: { player, condition },
      }),
    [sendMessage]
  );

  const handleKO = useCallback(
    (player) =>
      sendMessage({
        type: MSG_KO,
        payload: { player },
      }),
    [sendMessage]
  );

  const handleSwap = useCallback(
    (player, benchIndex) =>
      sendMessage({
        type: MSG_SWAP,
        payload: { player, benchIndex },
      }),
    [sendMessage]
  );

  const endTurn = useCallback(
    () =>
      sendMessage({
        type: MSG_END_TURN,
        payload: {},
      }),
    [sendMessage]
  );

  const addToBench = useCallback(
    (player, benchIndex, pokemonData) =>
      sendMessage({
        type: MSG_ADD_TO_BENCH,
        payload: { player, benchIndex, pokemonData },
      }),
    [sendMessage]
  );

  const sendCoinFlipResult = useCallback(
    (result) =>
      sendMessage({
        type: MSG_COIN_FLIP,
        payload: { result },
      }),
    [sendMessage]
  );

  const sendChatMessage = useCallback(
    (player, message) =>
      sendMessage({
        type: MSG_CHAT_MESSAGE,
        payload: { player, message },
      }),
    [sendMessage]
  );

  const updatePrizes = useCallback(
    (player, delta) =>
      sendMessage({
        type: MSG_PRIZES_UPDATE,
        payload: {
          player,
          value: Math.max(0, Math.min(6, gameState[player].prizes + delta)),
        },
      }),
    [gameState, sendMessage]
  );

  const resetGameState = useCallback(
    () =>
      sendMessage({
        type: MSG_STATE_RESET,
        payload: {},
      }),
    [sendMessage]
  );

  return {
    gameState,
    isConnected,
    connectionStatus,
    updateDamage,
    updateBenchDamage,
    toggleCondition,
    updatePrizes,
    resetGameState,
    handleKO,
    handleSwap,
    addToBench,
    endTurn,
    sendCoinFlipResult,
    sendChatMessage,
    sendMessage,
    socketRef,
    setActivePokemon,
    localPlayerName: playerNames.local,
    opponentPlayerName: playerNames.opponent,
    isCaller,
  };
}
