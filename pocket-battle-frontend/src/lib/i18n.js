export const translations = {
  en: {
    // App
    appTitle: "Pocket Battle Online",
    appDescription: "Play physical TCG remotely via webcams",

    // Navigation
    camera: "Camera",
    microphone: "Microphone",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",

    // Video Arena
    localPlayer: "Your Playmat",
    opponent: "Opponent's Playmat",
    waitingForOpponent: "Waiting for opponent...",
    connecting: "Connecting...",
    connected: "Connected",
    disconnected: "Disconnected",

    // Damage Tracker
    damageTracker: "Game Tracker",
    damageCounters: "Damage Counters",
    yourDamage: "Your Damage",
    opponentDamage: "Opponent Damage",
    specialConditions: "Special Conditions",
    asleep: "Asleep",
    burned: "Burned",
    confused: "Confused",
    paralyzed: "Paralyzed",
    poisoned: "Poisoned",
    reset: "Reset All",

    // Card Search
    cardSearch: "Card Search",
    searchPlaceholder: "Search for a card...",
    searchButton: "Search",
    noResults: "No cards found",
    loading: "Loading...",
    cardDetails: "Card Details",
    attacks: "Attacks",
    abilities: "Abilities",
    rules: "Rules",
    close: "Close",
    viewFullCard: "View Full Card",
    
    // Coin Flip
    coinFlip: "Coin Flip",
    flipCoin: "Flip Coin",
    flipping: "Flipping...",
    result: "Result",
    heads: "Heads",
    tails: "Tails",

    // Active Pokemon Card
    activePokemon: "Active Pokémon",
    heal: "Heal",

    // Status
    on: "On",
    off: "Off",
  },
  es: {
    // App
    appTitle: "Pocket Battle Online",
    appDescription: "Juega TCG físico de forma remota con webcams",

    // Navigation
    camera: "Cámara",
    microphone: "Micrófono",
    darkMode: "Modo Oscuro",
    lightMode: "Modo Claro",
    language: "Idioma",

    // Video Arena
    localPlayer: "Tu Tapete",
    opponent: "Tapete del Oponente",
    waitingForOpponent: "Esperando oponente...",
    connecting: "Conectando...",
    connected: "Conectado",
    disconnected: "Desconectado",

    // Damage Tracker
    damageTracker: "Rastreador de Juego",
    damageCounters: "Contadores de Daño",
    yourDamage: "Tu Daño",
    opponentDamage: "Daño del Oponente",
    specialConditions: "Condiciones Especiales",
    asleep: "Dormido",
    burned: "Quemado",
    confused: "Confundido",
    paralyzed: "Paralizado",
    poisoned: "Envenenado",
    reset: "Reiniciar Todo",

    // Card Search
    cardSearch: "Buscar Carta",
    searchPlaceholder: "Buscar una carta...",
    searchButton: "Buscar",
    noResults: "No se encontraron cartas",
    loading: "Cargando...",
    cardDetails: "Detalles de la Carta",
    attacks: "Ataques",
    abilities: "Habilidades",
    rules: "Reglas",
    close: "Cerrar",
    viewFullCard: "Ver Carta Completa",

    // Coin Flip
    coinFlip: "Lanzar Moneda",
    flipCoin: "Lanzar Moneda",
    flipping: "Lanzando...",
    result: "Resultado",
    heads: "Cara",
    tails: "Cruz",

    // Active Pokemon Card
    activePokemon: "Pokémon Activo",
    heal: "Curar",

    // Status
    on: "Encendido",
    off: "Apagado",
  },
};

/**
 * Translates a key based on the provided language.
 * @param {string} key - The translation key.
 * @param {string} lang - 'en' or 'es'.
 * @returns {string} The translated string.
 */
export function translate(key, lang) {
  // Fallback to English if the key doesn't exist or lang is missing
  const currentLang = lang || "en";
  return translations[currentLang][key] || key;
}