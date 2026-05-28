import { Camera, CameraOff, Mic, MicOff, Globe, Coins, Play } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button"; 
import { Badge } from "./ui/badge";   
import { translate } from "../lib/i18n";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"; 
import { useState } from 'react';
import { cn } from "../lib/utils";
import imgHeads from "../img/moneda-cara.png";
import imgTails from "../img/moneda-cruz.png";
import "../styles/coin.css";
import { ThemeToggle } from "./ui/ThemeToggle";


const VARIANT_DEFAULT = "default";
const VARIANT_OUTLINE = "outline";
const VARIANT_GHOST = "ghost";
const VARIANT_SECONDARY = "secondary";
const SIZE_SM = "sm";

export function TopNavigation({
  language,
  isCameraEnabled,
  isMicrophoneEnabled,
  turn,
  onToggleLanguage,
  onToggleCamera,
  onToggleMicrophone,
  onCoinFlip,
  onEndTurn,
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState(null); // 'heads' or 'tails'
  const location = useLocation();
  const navigate = useNavigate();

  const flipCoin = () => {
    setIsFlipping(true);
    setFlipResult(null);

    const newResult = Math.random() < 0.5 ? "heads" : "tails";

    setTimeout(() => {
      setFlipResult(newResult);
      onCoinFlip(newResult); // Emit coin flip result
      setIsFlipping(false);
    }, 1000); // Animation duration
  };

  const handleLogoClick = (e) => {
    if (location.pathname.startsWith('/game')) {
      e.preventDefault();
      if (window.confirm('Do you want to leave the current match? Progress will be lost.')) {
        navigate('/dashboard');
      }
    }
  };

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/dashboard" onClick={handleLogoClick} className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">PB</span>
          </div>
          <h1 className="text-lg font-bold">
            {translate("appTitle", language)}
          </h1>
        </Link>

        
        <div className="flex items-center gap-2">

          {/* Coin Flip Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant={VARIANT_GHOST} size={SIZE_SM} className="gap-2">
                <Coins className="h-4 w-4" />
                <span className="hidden sm:inline">{translate("coinFlip", language)}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{translate("coinFlip", language)}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="coin-container mb-4">
                  <div className={`coin ${isFlipping ? 'flipping' : ''} ${flipResult}`}>
                    {/* Heads */}
                    <div className="side heads">
                      <img src={imgHeads} alt={translate("heads", language)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    {/* Tails */}
                    <div className="side tails">
                      <img src={imgTails} alt={translate("tails", language)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={flipCoin}
                  disabled={isFlipping}
                  variant={VARIANT_DEFAULT}
                  className="w-full max-w-[200px]"
                >
                  {isFlipping ? translate("flipping", language) : translate("flipCoin", language)}
                </Button>

                {flipResult && (
                  <div className="mt-4 text-lg font-bold">
                    {translate("result", language)}: {translate(flipResult, language)}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          {/* End Turn Button */}
          <Button
            variant={VARIANT_DEFAULT}
            size={SIZE_SM}
            onClick={onEndTurn}
            className={cn(
              "gap-2 text-white",
              turn === 'local' ? "bg-primary hover:bg-primary/90" : "bg-secondary hover:bg-secondary/90"
            )}
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">{translate("endTurn", language)}</span>
          </Button>

          {/* Media Toggles (Camera & Mic) */}
          <Button
            variant={isCameraEnabled ? VARIANT_DEFAULT : VARIANT_OUTLINE}
            size={SIZE_SM}
            onClick={onToggleCamera}
            className="gap-2"
          >
            {isCameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            <span className="hidden sm:inline">{translate("camera", language)}</span>
          </Button>

          <Button
            variant={isMicrophoneEnabled ? VARIANT_DEFAULT : VARIANT_OUTLINE}
            size={SIZE_SM}
            onClick={onToggleMicrophone}
            className="gap-2"
          >
            {isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            <span className="hidden sm:inline">{translate("microphone", language)}</span>
          </Button>

          
          <div className="h-6 w-px bg-border mx-1" />

          <ThemeToggle />

          <Button 
            variant={VARIANT_GHOST} 
            size={SIZE_SM} 
            onClick={onToggleLanguage} 
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            <Badge variant={VARIANT_SECONDARY} className="text-xs">
              {language.toUpperCase()}
            </Badge>
          </Button>
          
        </div>
      </div>
    </header>
  );
}