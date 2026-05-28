import { useRef, useEffect } from "react";
import { Video, VideoOff, User } from "lucide-react";
import { Badge } from "./ui/badge";
import { translate } from "../lib/i18n";
import { Card, CardHeader, CardTitle, CardContent } from "./GameCard";

const CAMERA_ERROR_MESSAGE = "Could not access camera";
const CAMERA_DISABLED_MESSAGE = "Camera disabled";
const OPPONENT_FEED_MESSAGE = "Opponent video feed";

const STATUS_CONNECTED = "connected";
const STATUS_CONNECTING = "connecting";
const STATUS_DISCONNECTED = "disconnected";

const VARIANT_DEFAULT = "default";
const VARIANT_SECONDARY = "secondary";
const VARIANT_DESTRUCTIVE = "destructive";

export function VideoArena({ language, isCameraEnabled, connectionStatus }) {
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const cameraErrorRef = useRef(null);

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
            video: true, 
            audio: false 
          });
          
          if (!isMounted) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          streamRef.current = stream;
          cameraErrorRef.current = null;
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          cameraErrorRef.current = CAMERA_ERROR_MESSAGE;
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

  const getStatusBadgeVariant = () => {
    switch (connectionStatus) {
      case STATUS_CONNECTED:
        return VARIANT_DEFAULT;
      case STATUS_CONNECTING:
        return VARIANT_SECONDARY;
      default:
        return VARIANT_DESTRUCTIVE;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case STATUS_CONNECTED:
        return translate(STATUS_CONNECTED, language);
      case STATUS_CONNECTING:
        return translate(STATUS_CONNECTING, language);
      default:
        return translate(STATUS_DISCONNECTED, language);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Local Player Video */}
      <Card className="bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{translate("localPlayer", language)}</CardTitle>
            <Badge variant={isCameraEnabled ? VARIANT_DEFAULT : VARIANT_SECONDARY}>
              {isCameraEnabled ? <Video className="h-3 w-3 mr-1" /> : <VideoOff className="h-3 w-3 mr-1" />}
              {isCameraEnabled ? translate("on", language) : translate("off", language)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {isCameraEnabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <User className="h-16 w-16 mb-2 opacity-50" />
                <span className="text-sm">{CAMERA_DISABLED_MESSAGE}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Opponent Video */}
      <Card className="bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{translate("opponent", language)}</CardTitle>
            <Badge variant={getStatusBadgeVariant()}>
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
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
    </div>
  );
}