import { useState, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { GameCard } from "./GameCard";
import { Badge } from "./ui/badge";     
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"; 
import { translate } from "../lib/i18n";

const POKEMON_API_URL = "https://api.pokemontcg.io/v2/cards";
const KEY_ENTER = "Enter";
const VARIANT_SECONDARY = "secondary";
const VARIANT_OUTLINE = "outline";
const VARIANT_DESTRUCTIVE = "destructive";
const VARIANT_GHOST = "ghost";
const SIZE_ICON = "icon";
const SIZE_SM = "sm";

export function CardSearch({ language, playerType, onSetActivePokemon, onAddToBench, bench }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [modalCard, setModalCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSelectingSlot, setIsSelectingSlot] = useState(null); // Holds card data for bench placement

  const handleAddToBenchClick = (card) => {
    const benchPokemonData = { 
      id: card.id, 
      name: card.name, 
      hp: card.hp,
    };
    setIsSelectingSlot(benchPokemonData);
  };

  const handleSlotSelection = (benchIndex) => {
    if (!isSelectingSlot || !onAddToBench) return;
    onAddToBench(playerType, benchIndex, isSelectingSlot);
    setIsSelectingSlot(null); // Close the dialog
  };

  const searchCards = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `${POKEMON_API_URL}?q=name:${encodeURIComponent(searchQuery)}*&pageSize=250`
      );
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error("Error searching cards:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleKeyPress = (e) => {
    if (e.key === KEY_ENTER) {
      searchCards();
    }
  };

  return (
    <>
      <GameCard
        title={translate("cardSearch", language)}
        className="flex flex-col h-full"
        contentClassName="flex-1 flex flex-col gap-4 overflow-hidden"
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={translate("searchPlaceholder", language)}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pl-10"
            />
          </div>
          <Button onClick={searchCards} disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              translate("searchButton", language)
            )}
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedCard ? (
            <CardDetails 
              card={selectedCard} 
              language={language} 
              onClose={() => setSelectedCard(null)} 
              onViewLarge={() => setModalCard(selectedCard)}
              playerType={playerType}
              onSetActivePokemon={onSetActivePokemon}
              onAddToBench={() => handleAddToBenchClick(selectedCard)}
            />
          ) : searchResults.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {searchResults.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="group relative overflow-hidden rounded-lg border border-border hover:border-primary transition-colors aspect-[2.5/3.5] bg-muted"
                >
                  <img
                    src={card.images.small}
                    alt={card.name}
                    className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-8 text-muted-foreground">
              {translate("noResults", language)}
            </div>
          ) : null}
        </div>
      </GameCard>

      <Dialog open={modalCard !== null} onOpenChange={(open) => !open && setModalCard(null)}>
        <DialogContent className="sm:max-w-md p-0 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">
            {modalCard?.name || "Card"}
          </DialogTitle>
          <div className="relative">
            <button
              onClick={() => setModalCard(null)}
              className="absolute -top-3 -right-3 z-10 bg-background rounded-full p-1.5 shadow-lg border border-border hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {modalCard && (
              <img
                src={modalCard.images.large}
                alt={modalCard.name}
                className="w-full h-auto rounded-lg shadow-2xl"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSelectingSlot !== null} onOpenChange={(open) => !open && setIsSelectingSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{translate("selectBenchSlot", language)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {[...Array(5)].map((_, index) => {
              const slot = bench?.[index];
              const isEmpty = !slot || !slot.name;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-12 text-left"
                  onClick={() => handleSlotSelection(index)}
                >
                  <span className="font-bold mr-2">Slot {index + 1}:</span>
                  <span className="text-muted-foreground">{isEmpty ? translate("empty", language) : `${slot.name} (HP: ${slot.hp})`}</span>
                </Button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function CardDetails({ card, language, onClose, onViewLarge, playerType, onSetActivePokemon, onAddToBench }) {
  const handleSetAsActive = () => {
    if (!onSetActivePokemon) return;
    const pokemonData = { name: card.name, hp: card.hp, id: card.id };
    onSetActivePokemon(playerType, pokemonData);
    onClose(); // Close details after setting
  };

  // This now just triggers the parent component to open the slot selection dialog
  const handleAddToBench = () => {
    if (!onAddToBench) return;
    onAddToBench();
    onClose(); // Close details after setting
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold">{card.name}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant={VARIANT_SECONDARY}>{card.supertype}</Badge>
            {card.hp && <Badge variant={VARIANT_OUTLINE}>HP {card.hp}</Badge>}
            {card.types?.map((type) => (
              <Badge key={type} variant={VARIANT_OUTLINE}>
                {type}
              </Badge>
            ))}
          </div>
        </div>
        <Button variant={VARIANT_GHOST} size={SIZE_ICON} onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onViewLarge}
          className="shrink-0 w-28 aspect-[2.5/3.5] rounded-lg border border-border overflow-hidden hover:border-primary transition-colors cursor-zoom-in"
        >
          <img
            src={card.images.small}
            alt={card.name}
            className="w-full h-full object-contain"
          />
        </button>
        <div className="flex-1 space-y-3 overflow-hidden">
          {card.abilities?.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1">{translate("abilities", language)}</h4>
              {card.abilities.map((ability, index) => (
                <div key={index} className="text-sm mb-2">
                  <span className="font-medium text-primary">{ability.name}</span>
                  <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{ability.text}</p>
                </div>
              ))}
            </div>
          )}

          {card.attacks?.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1">{translate("attacks", language)}</h4>
              {card.attacks.map((attack, index) => (
                <div key={index} className="text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{attack.name}</span>
                    {attack.damage && (
                      <Badge variant={VARIANT_DESTRUCTIVE} className="text-xs px-1.5 py-0">
                        {attack.damage}
                      </Badge>
                    )}
                  </div>
                  {attack.text && (
                    <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{attack.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {card.rules?.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-1">{translate("rules", language)}</h4>
              {card.rules.map((rule, index) => (
                <p key={index} className="text-xs text-muted-foreground mb-0.5 line-clamp-2">
                  {rule}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={handleSetAsActive} size={SIZE_SM} className="w-full">
          {translate("setAsActive", language)}
        </Button>
        <Button onClick={handleAddToBench} variant={VARIANT_SECONDARY} size={SIZE_SM} className="w-full">
          {translate("addToBench", language)}
        </Button>
        <Button variant={VARIANT_OUTLINE} size={SIZE_SM} onClick={onViewLarge} className="w-full">
          {translate("viewFullCard", language)}
        </Button>
      </div>
    </div>
  );
}