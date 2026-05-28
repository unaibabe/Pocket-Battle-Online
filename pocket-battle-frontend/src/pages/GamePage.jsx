import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { TopNavigation } from "../components/TopNavigation";
import { PlayerField } from "../components/DamageTracker";
import { CardSearch } from "../components/CardSearch";
import { useGameSocket } from "../hooks/use-game-socket";
import { GameConsole } from "../components/GameConsole";
import { Video, VideoOff, MicOff, User } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { translate } from "../lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "../components/GameCard";
import { Loader2, Scan } from "lucide-react";
import { Button } from "../components/ui/button";

const CAMERA_DISABLED_MESSAGE = "Camera disabled";
const OPPONENT_FEED_MESSAGE = "Opponent video feed";

const STATUS_CONNECTED = "connected";
const STATUS_CONNECTING = "connecting";

const LANG_EN = "en";
const LANG_ES = "es";

const WEBRTC_STUN_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

function LocalVideoFeed({
  language,
  isCameraEnabled,
  isMicrophoneEnabled,
  isMyTurn,
  playerName,
  localVideoRef,
  isScanning,
  onScanCard,
}) {
  return (
    <Card className="h-full flex flex-col relative overflow-hidden">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">{playerName}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {!isMicrophoneEnabled ? (
            <Badge variant="outline" className="gap-1">
              <MicOff className="h-3 w-3" />
              Mic Off
            </Badge>
          ) : null}
          {isMyTurn ? (
            <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/50 animate-pulse">
              {translate("yourTurn", language)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-2 flex-1 flex flex-col relative overflow-hidden">
        <div className="relative flex-1 bg-muted rounded-lg overflow-hidden aspect-video">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${isCameraEnabled ? "block" : "hidden"}`}
          />

          {!isCameraEnabled ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <VideoOff className="h-12 w-12 mb-2 opacity-20" />
              <span className="text-sm">{CAMERA_DISABLED_MESSAGE}</span>
            </div>
          ) : null}

          <div className="absolute bottom-4 right-4 z-10">
            <Button
              onClick={onScanCard}
              disabled={isScanning || !isCameraEnabled}
              variant="default"
              className="shadow-lg font-bold"
            >
              {isScanning ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  {translate("analyzing", language)}
                </>
              ) : (
                <>
                  <Scan className="mr-2 h-4 w-4" />
                  {translate("scanCard", language)}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OpponentVideoFeed({
  language,
  connectionStatus,
  isMyTurn,
  playerName,
  remoteVideoRef,
  hasRemoteStream,
}) {
  return (
    <Card className="bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{playerName}</CardTitle>
          {isMyTurn ? (
            <Badge className="bg-secondary text-secondary-foreground shadow-lg shadow-secondary/50 animate-pulse">
              {translate("opponentTurn", language)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-2 flex-1 flex flex-col relative overflow-hidden">
        <div className="relative flex-1 bg-muted rounded-lg overflow-hidden aspect-video">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${hasRemoteStream ? "block" : "hidden"}`}
          />

          {!hasRemoteStream && connectionStatus === STATUS_CONNECTED ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <User className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-sm">{OPPONENT_FEED_MESSAGE}</span>
            </div>
          ) : null}

          {!hasRemoteStream && connectionStatus === STATUS_CONNECTING ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm">{translate(STATUS_CONNECTING, language)}</span>
            </div>
          ) : null}

          {!hasRemoteStream &&
          connectionStatus !== STATUS_CONNECTED &&
          connectionStatus !== STATUS_CONNECTING ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <User className="h-16 w-16 mb-2 opacity-50" />
              <span className="text-sm">{translate("waitingForOpponent", language)}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function GamePage() {
  const { roomId } = useParams();
  const gameCode = roomId;

  const [language, setLanguage] = useState(LANG_EN);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [prizeReminderFor, setPrizeReminderFor] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerRef = useRef(null);
  const hasSentOfferRef = useRef(false);

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
    localPlayerName,
    opponentPlayerName,
    socketRef,
    isCaller,
  } = useGameSocket(gameCode || "demo-room");

  const stopLocalMedia = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const closePeerConnection = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.ontrack = null;
      peerRef.current.onicecandidate = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setHasRemoteStream(false);
    hasSentOfferRef.current = false;
  }, []);

  const emitWebRTCSignal = useCallback(
    (signalData) => {
      const socket = socketRef.current;
      if (!socket || !gameCode) return;

      socket.emit("WEBRTC_SIGNAL", {
        roomId: String(gameCode),
        payload: signalData,
      });
    },
    [socketRef, gameCode]
  );

  const ensurePeerConnection = useCallback(() => {
    if (peerRef.current) {
      return peerRef.current;
    }

    const pc = new RTCPeerConnection(WEBRTC_STUN_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitWebRTCSignal({
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        setHasRemoteStream(true);
      }
    };

    peerRef.current = pc;
    return pc;
  }, [emitWebRTCSignal]);

  const attachLocalTracksToPeer = useCallback(() => {
    const pc = ensurePeerConnection();
    const stream = localStreamRef.current;

    if (!pc || !stream) return;

    const existingTrackIds = new Set(
      pc.getSenders().map((sender) => sender.track?.id).filter(Boolean)
    );

    stream.getTracks().forEach((track) => {
      if (!existingTrackIds.has(track.id)) {
        pc.addTrack(track, stream);
      }
    });
  }, [ensurePeerConnection]);

  const createAndSendOffer = useCallback(async () => {
    try {
      if (!isCaller) return;
      if (hasSentOfferRef.current) return;
      if (!localStreamRef.current) return;

      const pc = ensurePeerConnection();
      attachLocalTracksToPeer();

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      emitWebRTCSignal({
        type: "offer",
        sdp: offer,
      });

      hasSentOfferRef.current = true;
    } catch (error) {
      console.error("Error creando offer WebRTC:", error);
    }
  }, [isCaller, ensurePeerConnection, attachLocalTracksToPeer, emitWebRTCSignal]);

  useEffect(() => {
    let cancelled = false;

    const setupMedia = async () => {
      const shouldHaveMedia = isCameraEnabled || isMicrophoneEnabled;

      if (!shouldHaveMedia) {
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach((track) => {
            track.enabled = false;
          });
          localStreamRef.current.getAudioTracks().forEach((track) => {
            track.enabled = false;
          });
        }
        return;
      }

      try {
        if (!localStreamRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          localStreamRef.current = stream;

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }

        localStreamRef.current.getVideoTracks().forEach((track) => {
          track.enabled = isCameraEnabled;
        });

        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = isMicrophoneEnabled;
        });

        attachLocalTracksToPeer();

        if (isCaller) {
          await createAndSendOffer();
        }
      } catch (error) {
        console.error("Error accediendo a cámara/micrófono:", error);
      }
    };

    setupMedia();

    return () => {
      cancelled = true;
    };
  }, [
    isCameraEnabled,
    isMicrophoneEnabled,
    isCaller,
    attachLocalTracksToPeer,
    createAndSendOffer,
  ]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !gameCode) return;

    const handleWebRTCSignal = async (incoming) => {
      try {
        const signal = incoming?.payload ?? incoming?.data ?? incoming;
        if (!signal?.type) return;

        if (signal.type === "offer") {
          const pc = ensurePeerConnection();
          attachLocalTracksToPeer();

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          emitWebRTCSignal({
            type: "answer",
            sdp: answer,
          });
        }

        if (signal.type === "answer") {
          const pc = ensurePeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }

        if (signal.type === "candidate") {
          const pc = ensurePeerConnection();
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (error) {
        console.error("Error procesando señal WebRTC:", error);
      }
    };

    const handlePlayerConnected = async () => {
      if (isCaller && (isCameraEnabled || isMicrophoneEnabled)) {
        await createAndSendOffer();
      }
    };

    socket.on("WEBRTC_SIGNAL", handleWebRTCSignal);
    socket.on("PLAYER_CONNECTED", handlePlayerConnected);

    return () => {
      socket.off("WEBRTC_SIGNAL", handleWebRTCSignal);
      socket.off("PLAYER_CONNECTED", handlePlayerConnected);
    };
  }, [
    socketRef,
    gameCode,
    isCaller,
    isCameraEnabled,
    isMicrophoneEnabled,
    ensurePeerConnection,
    attachLocalTracksToPeer,
    emitWebRTCSignal,
    createAndSendOffer,
  ]);

  useEffect(() => {
    return () => {
      closePeerConnection();
      stopLocalMedia();
    };
  }, [closePeerConnection, stopLocalMedia]);

  const handleKO = (player) => {
    originalHandleKO(player);
    const opponent = player === "local" ? "opponent" : "local";
    setPrizeReminderFor(opponent);

    setTimeout(() => {
      setPrizeReminderFor(null);
    }, 3000);
  };

  const handleToggleLanguage = () =>
    setLanguage((prev) => (prev === LANG_EN ? LANG_ES : LANG_EN));

  const handleToggleCamera = () => {
    setIsCameraEnabled((prev) => !prev);
  };

  const handleToggleMicrophone = () => {
    setIsMicrophoneEnabled((prev) => !prev);
  };

  const handleScanCard = async () => {
    if (!localVideoRef.current || !isCameraEnabled) return;

    setIsScanning(true);

    try {
      const video = localVideoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;

      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg")
      );

      const formData = new FormData();
      formData.append("file", blob, "captura.jpg");

      const response = await fetch("https://app-tcg-web.onrender.com/escanear-carta", {
        method: "POST",
        body: formData,
      });

      const cardData = await response.json();

      if (!cardData.error) {
        console.log("Card processed successfully by AI!", cardData);
        alert(`You have registered ${cardData.name} with ${cardData.hp} HP.`);
        setActivePokemon("local", {
          name: cardData.name,
          hp: cardData.hp,
          ...cardData,
        });
      } else {
        alert(cardData.error);
      }
    } catch (error) {
      console.error("Error en el escaneo:", error);
      alert("Hubo un error al conectar con la IA.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {gameCode && (
        <div className="absolute top-16 left-4 z-10 bg-card/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-mono">
            Room Code: <span className="font-bold text-foreground">{gameCode}</span>
          </p>
        </div>
      )}

      <TopNavigation
        language={language}
        isCameraEnabled={isCameraEnabled}
        isMicrophoneEnabled={isMicrophoneEnabled}
        turn={gameState.turn}
        onToggleLanguage={handleToggleLanguage}
        onToggleCamera={handleToggleCamera}
        onToggleMicrophone={handleToggleMicrophone}
        onCoinFlip={sendCoinFlipResult}
        onEndTurn={endTurn}
      />

      <main className="flex-1 p-4 overflow-hidden">
        <div className="flex flex-row w-full h-full gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
            <div className="h-1/2 min-h-0">
              <LocalVideoFeed
                language={language}
                isCameraEnabled={isCameraEnabled}
                isMicrophoneEnabled={isMicrophoneEnabled}
                isMyTurn={gameState.turn === "local"}
                playerName={localPlayerName}
                localVideoRef={localVideoRef}
                isScanning={isScanning}
                onScanCard={handleScanCard}
              />
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
                showPrizeReminder={prizeReminderFor === "local"}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4 min-w-0 h-full overflow-hidden">
            <div className="h-1/2 min-h-0">
              <OpponentVideoFeed
                language={language}
                connectionStatus={connectionStatus}
                isMyTurn={gameState.turn === "opponent"}
                playerName={opponentPlayerName}
                remoteVideoRef={remoteVideoRef}
                hasRemoteStream={hasRemoteStream}
              />
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
                showPrizeReminder={prizeReminderFor === "opponent"}
              />
            </div>
          </div>

          <div className="hidden xl:flex flex-col gap-4 w-[360px] flex-shrink-0 h-full overflow-hidden">
            <div className="h-1/2 min-h-0">
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