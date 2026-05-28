import { useState, useEffect, useRef } from "react";
import { TopNavigation } from "./TopNavigation";
import { PlayerField } from "./DamageTracker";
import { CardSearch } from "./CardSearch";
import { useGameSocket } from "../hooks/use-game-socket";
import { GameConsole } from "./GameConsole";
import { Video, VideoOff, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { translate } from "../lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "./GameCard";

import { Loader2, Scan } from "lucide-react";
import { Button } from "./ui/button";


const CAMERA_DISABLED_MESSAGE = "Camera disabled";
const OPPONENT_FEED_MESSAGE = "Opponent video feed";

const STATUS_CONNECTED = "connected";
const STATUS_CONNECTING = "connecting";
const STATUS_DISCONNECTED = "disconnected";

const VARIANT_DEFAULT = "default";
const VARIANT_SECONDARY = "secondary";
const VARIANT_DESTRUCTIVE = "destructive";


const LANG_EN = "en";
const LANG_ES = "es";
const DEMO_ROOM = "demo-room";
const THEME_DARK = "dark";


function LocalVideoFeed({ language, isCameraEnabled, onCardScanned, isMyTurn }) {
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false); // Estado para saber si la IA está pensando

  useEffect(() => {
    let isMounted = true;

    const stopCameraStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };

    async function setupCamera() {
      if (isCameraEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" } // Intentar usar la cámara trasera si es móvil
          });
          if (isMounted) {
            streamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          } else {
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
        }
      } else {
        stopCameraStream();
      }
    }

    setupCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [isCameraEnabled]);

  const scanCard = async () => {
    if (!localVideoRef.current) return;

    setIsScanning(true); // Encendemos el loader
    try {
      // 1. Coger el frame actual del vídeo
      const video = localVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);

      // 2. Convertir a Blob usando una Promesa para que el código quede más limpio
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));

      const formData = new FormData();
      formData.append('file', blob, 'captura.jpg');

      // 3. Enviar a backend
      const response = await fetch('http://localhost:8000/escanear-carta', {
        method: 'POST',
        body: formData
      });

      const cardData = await response.json();

      // 4. Feedback temporal para ver que funciona
      if (!cardData.error) {
        console.log("Card processed successfully by AI!", cardData);
        alert(`You have registered ${cardData.name} with ${cardData.hp} HP.`);
        onCardScanned(cardData);

      } else {
        alert(cardData.error);
      }

    } catch (error) {
      console.error("Error en el escaneo:", error);
      alert("Hubo un error al conectar con la IA.");
    } finally {
      setIsScanning(false); // Apagamos el loader
    }
  };

  return (
    <Card className="h-full flex flex-col relative overflow-hidden"> {/* Removed aspect-video from Card */}
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{translate("localCamera", language)}</CardTitle>
        </div>
        {isMyTurn ? (
          <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/50 animate-pulse">
            {translate("yourTurn", language)}
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent className="p-2 flex-1 flex flex-col relative overflow-hidden">
        <div className="relative flex-1 bg-muted rounded-lg overflow-hidden aspect-video">
          {isCameraEnabled ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />

              { }
              <div className="absolute bottom-4 right-4 z-10">
                <Button
                  onClick={scanCard}
                  disabled={isScanning}
                  variant="default"
                  className="shadow-lg font-bold"
                >
                  {isScanning ? (
                    <><Loader2 className="animate-spin mr-2 h-4 w-4" /> {translate("analyzing", language)}</>
                  ) : (
                    <><Scan className="mr-2 h-4 w-4" /> {translate("scanCard", language)}</>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <VideoOff className="h-12 w-12 mb-2 opacity-20" />
              <span className="text-sm">{CAMERA_DISABLED_MESSAGE}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// video
function OpponentVideoFeed({ language, connectionStatus, isMyTurn }) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col h-full"> {/* Removed aspect-video from Card */}
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{translate("opponent", language)}</CardTitle>
          {isMyTurn ? (
            <Badge className="bg-secondary text-secondary-foreground shadow-lg shadow-secondary/50 animate-pulse">
              {translate("opponentTurn", language)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="p-2 flex-1 flex flex-col relative overflow-hidden">
        <div className="relative flex-1 bg-muted rounded-lg overflow-hidden aspect-video">
          {connectionStatus === STATUS_CONNECTED ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <User className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-sm">{OPPONENT_FEED_MESSAGE}</span>
            </div>
          ) : connectionStatus === STATUS_CONNECTING ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm">{translate(STATUS_CONNECTING, language)}</span>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <User className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-sm">{translate("waitingForOpponent", language)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function GameArena() {
  const [language, setLanguage] = useState(LANG_EN);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [prizeReminderFor, setPrizeReminderFor] = useState(null); // 'local' or 'opponent'

  const {
    gameState,
    connectionStatus,
    updateDamage,
    toggleCondition,
    updatePrizes,
    setActivePokemon,
    handleKO: originalHandleKO,
    handleSwap,
    addToBench,
    updateBenchDamage,
    sendCoinFlipResult,
    sendChatMessage,
    endTurn,
  } = useGameSocket(DEMO_ROOM);

  const handleKO = (player) => {
    // Wrap the original KO handler to show a prize reminder
    originalHandleKO(player);
    const opponent = player === 'local' ? 'opponent' : 'local';
    setPrizeReminderFor(opponent);
    setTimeout(() => {
      setPrizeReminderFor(null);
    }, 3000); // Hide reminder after 3 seconds
  };

  useEffect(() => {
    document.documentElement.classList.toggle(THEME_DARK, isDarkMode);
  }, [isDarkMode]);

  const handleToggleTheme = () => setIsDarkMode((prev) => !prev);
  const handleToggleLanguage = () => setLanguage((prev) => (prev === LANG_EN ? LANG_ES : LANG_EN));
  const handleToggleCamera = () => setIsCameraEnabled((prev) => !prev);
  const handleToggleMicrophone = () => setIsMicrophoneEnabled((prev) => !prev);

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">

      <TopNavigation
        language={language}
        isDarkMode={isDarkMode}
        isCameraEnabled={isCameraEnabled}
        isMicrophoneEnabled={isMicrophoneEnabled}
        turn={gameState.turn}
        onToggleTheme={handleToggleTheme}
        onToggleLanguage={handleToggleLanguage}
        onToggleCamera={handleToggleCamera}
        onToggleMicrophone={handleToggleMicrophone}
        onCoinFlip={sendCoinFlipResult}
        onEndTurn={endTurn}
      />

      <main className="flex-1 p-4 overflow-hidden">

        <div className="flex flex-row w-full h-full gap-4 overflow-hidden"> {/* Fluid main container for top row */}
          {/* Column 1: Local Player */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
            <div className="h-1/2 min-h-0"> {/* Camera takes 50% height */}
              <LocalVideoFeed language={language} isCameraEnabled={isCameraEnabled} onCardScanned={(cardData) => setActivePokemon("local", { name: cardData.name, hp: cardData.hp })} isMyTurn={gameState.turn === 'local'} />
            </div>
            <div className="h-1/2 min-h-0 overflow-y-auto pr-2">
              <PlayerField
                playerType="local"
                data={gameState.local}
                onUpdateDamage={updateDamage}
                onToggleCondition={toggleCondition}
                onUpdatePrizes={updatePrizes}
                onHandleKO={handleKO}
                onHandleSwap={handleSwap}
                onUpdateBenchDamage={updateBenchDamage}
                isEditable={true}
                language={language}
                showPrizeReminder={prizeReminderFor === 'local'}
              />
            </div>
          </div>

          {/* Column 2: Opponent Player */}
          <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
            <div className="h-1/2 min-h-0"> {/* Camera takes 50% height */}
              <OpponentVideoFeed language={language} connectionStatus={connectionStatus} isMyTurn={gameState.turn === 'opponent'} />
            </div>
            <div className="h-1/2 min-h-0 overflow-y-auto pr-2">
              <PlayerField
                playerType="opponent"
                data={gameState.opponent}
                onUpdateDamage={updateDamage}
                onToggleCondition={toggleCondition}
                onUpdatePrizes={updatePrizes}
                onHandleKO={handleKO}
                onHandleSwap={handleSwap}
                onUpdateBenchDamage={updateBenchDamage}
                isEditable={false}
                language={language}
                showPrizeReminder={prizeReminderFor === 'opponent'}
              />
            </div>
          </div>

          {/* Column 3: Search & Console (fixed width, flex-shrink-0) */}
          <div className="hidden xl:flex flex-col gap-4 w-[360px] flex-shrink-0 h-full overflow-hidden">
            <div className="h-1/2 min-h-0"> {/* CardSearch takes 50% height */}
              <CardSearch
                language={language}
                playerType="local"
                onSetActivePokemon={setActivePokemon}
                onAddToBench={addToBench}
                bench={gameState.local.bench}
              />
            </div>
            <div className="h-1/2 min-h-0">
              <GameConsole
                log={gameState.log}
                onSendMessage={sendChatMessage}
                language={language}
                playerType="local"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}