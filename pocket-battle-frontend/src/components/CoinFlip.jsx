import { useState } from "react";
import { Button } from "./ui/button";
import { GameCard } from "./GameCard";
import { translate } from "../lib/i18n";
import imgHeads from "../img/moneda-cara.png";
import imgTails from "../img/moneda-cruz.png";
import "../Moneda.css"; 

const VARIANT_DEFAULT = "default";

export function CoinFlip({ language }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResult, setFlipResult] = useState(null); // 'heads' or 'tails'

  const flipCoin = () => {
    setIsFlipping(true);
    setFlipResult(null);


    const newResult = Math.random() < 0.5 ? "heads" : "tails";

    setTimeout(() => {
      setFlipResult(newResult);
      setIsFlipping(false);
    }, 1000);
  };

  return (
    <GameCard
      title={translate("coinFlip", language)}
      className="flex flex-col items-center justify-center"
    >
      <div className="contenedor-moneda mb-4">
        <div className={`moneda ${isFlipping ? 'girando' : ''} ${flipResult}`}>
          {/* Heads */}
          <div className="lado cara">
            <img src={imgHeads} alt={translate("heads", language)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Tails */}
          <div className="lado cruz">
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
    </GameCard>
  );
}
