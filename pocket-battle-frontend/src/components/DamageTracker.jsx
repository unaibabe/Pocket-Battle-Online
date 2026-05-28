import { Plus, Minus, Moon, Flame, HelpCircle, Zap, Skull, ArrowRightLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { translate } from "../lib/i18n";
import { cn } from "../lib/utils";
import { useState } from "react";
import pokeBall from "../img/poke-ball.png";

const CONDITION_CONFIG = {
  asleep: { icon: Moon, style: { backgroundColor: 'hsl(var(--status-asleep))', color: 'hsl(var(--status-asleep-foreground))' }, activeClass: "border-transparent scale-110 shadow-lg shadow-status-asleep/50" },
  burned: { icon: Flame, style: { backgroundColor: 'hsl(var(--status-burned))', color: 'hsl(var(--status-burned-foreground))' }, activeClass: "border-transparent scale-110 shadow-lg shadow-status-burned/50" },
  confused: { icon: HelpCircle, style: { backgroundColor: 'hsl(var(--status-confused))', color: 'hsl(var(--status-confused-foreground))' }, activeClass: "border-transparent scale-110 shadow-lg shadow-status-confused/50" },
  paralyzed: { icon: Zap, style: { backgroundColor: 'hsl(var(--status-paralyzed))', color: 'hsl(var(--status-paralyzed-foreground))' }, activeClass: "border-transparent scale-110 shadow-lg shadow-status-paralyzed/50" },
  poisoned: { icon: Skull, style: { backgroundColor: 'hsl(var(--status-poisoned))', color: 'hsl(var(--status-poisoned-foreground))' }, activeClass: "border-transparent scale-110 shadow-lg shadow-status-poisoned/50" },
};

export function PlayerField({
  playerType,
  data, // { active: { damage, conditions }, bench, prizes }
  onUpdateDamage,
  onToggleCondition,
  onUpdatePrizes,
  onHandleKO,
  onHandleSwap,
  onUpdateBenchDamage,
  isEditable,
  language,
  showPrizeReminder,
}) {
  const [isSwapMode, setIsSwapMode] = useState(false);

  const isLocal = playerType === "local";

  // Defensively access data to prevent crashes if the prop is not ready.
  const active = data?.active || { damage: 0, conditions: {} };
  const bench = data?.bench || [];
  const prizes = data?.prizes ?? 6;
  const damage = active.damage;
  const conditions = active.conditions;

  const handleKOClick = () => {
    if (!isEditable) return;
    onHandleKO(playerType);
  };

  const handleSwapClick = (benchIndex) => {
    if (!isEditable || !isSwapMode) return;
    // The parent controller is responsible for resetting conditions during the swap.
    onHandleSwap(playerType, benchIndex);
    setIsSwapMode(false);
  };

  const handleToggleCondition = (toggledKey) => {
    if (!isEditable) return;
    onToggleCondition(playerType, toggledKey);
  };

  const containerClasses = cn("bg-card border-2 border-border rounded-[2.5rem] overflow-hidden", isLocal ? "dark:border-primary/30" : "dark:border-secondary/30");
  const bannerClasses = cn("px-6 py-2 border-b-2", isLocal ? "bg-primary/20 border-primary" : "bg-secondary/20 border-secondary");
  const bannerTextClasses = cn("font-bold uppercase tracking-widest text-sm text-center", isLocal ? "text-primary" : "text-secondary");

  return (
    <div className="space-y-4">
      {/* Active Pokemon */}
      <div className={containerClasses}>
        <div className={bannerClasses}>
          <h2 className={bannerTextClasses}>
            {translate(isLocal ? "active_pokemon" : "opponent_active", language)}
          </h2>
        </div>
        <div className="p-6 relative">
          <div className="absolute top-4 right-4 flex gap-2">
            {isEditable && (
              <>
                <Button
                  variant={isSwapMode ? "default" : "ghost"}
                  size="icon"
                  className="size-9 rounded-full"
                  onClick={() => setIsSwapMode(prev => !prev)}
                  data-active={isSwapMode}
                >
                  <ArrowRightLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" className="size-9 rounded-full" onClick={handleKOClick}>
                  <span className="font-extrabold uppercase tracking-widest text-xs text-primary dark:drop-shadow-[0_0_4px_hsl(var(--primary))]">KO</span>
                </Button>
              </>
            )}
          </div>

          {/* Scanned Pokemon Data Display */}
          {active.pokemonData?.name ? (
            <div className="text-center mb-4 h-12 flex flex-col items-center justify-center">
              <h3 className="text-xl font-bold uppercase tracking-wider">
                {active.pokemonData.name}
              </h3>
              {active.pokemonData.hp && (
                <Badge variant="outline" className="mt-1 font-semibold text-xs">
                  HP {active.pokemonData.hp}
                </Badge>
              )}
            </div>
          ) : (
            <div className="text-center mb-4 h-12 flex items-center justify-center">
              <p className="text-sm font-semibold text-muted-foreground/50 italic">Waiting for card...</p>
            </div>
          )}

          <div className="flex items-center justify-around gap-4">
            {isEditable && (
              <Button
                variant="outline"
                className="size-14 rounded-full border-2 border-border hover:scale-110 transition-transform"
                onClick={() => onUpdateDamage(playerType, -10)}
                disabled={damage <= 0}
              >
                <Minus className="size-6" />
              </Button>
            )}
            <div className="relative flex flex-col items-center">
              <span className="text-8xl font-black text-primary tracking-tighter tabular-nums leading-none">
                 {damage}
              </span>
              <span className="text-slate-400 font-bold text-xs uppercase mt-1">
                DAMAGE
              </span>
            </div>
            {isEditable && (
              <Button
                variant="outline"
                className="size-14 rounded-full border-2 border-border hover:scale-110 transition-transform"
                onClick={() => onUpdateDamage(playerType, 10)}
              >
                <Plus className="size-6" />
              </Button>
            )}
          </div>

          {showPrizeReminder && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
              <Badge variant="destructive" className="text-lg animate-in fade-in-0 zoom-in-95">Opponent: Take a Prize!</Badge>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {Object.entries(CONDITION_CONFIG).map(([key, config]) => {
              const isActive = conditions[key] ?? false;
              const Icon = config.icon;
              return (
                <Badge
                  key={key}
                  style={isActive ? config.style : {}}
                  onClick={() => handleToggleCondition(key)}
                  className={cn(
                    "rounded-full px-3 py-1.5 gap-2 transition-all select-none font-bold flex items-center border-2",
                    isEditable ? "cursor-pointer" : "cursor-default pointer-events-none",
                    isActive
                      ? config.activeClass : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-500 dark:bg-white/10 dark:border-transparent dark:text-slate-400 dark:hover:bg-white/20"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-xs uppercase">{translate(key, language)}</span>
                </Badge>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bench & Prizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={containerClasses}>
          <div className={bannerClasses}>
            <h2 className={bannerTextClasses}>Bench</h2>
          </div>
          <div className="p-4 grid grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => {
              const slot = bench[i];
              return (
                <div
                  key={i}
                  onClick={() => handleSwapClick(i)}
                  className={cn(
                    "relative aspect-[2.5/3.5] bg-muted/30 rounded-xl border-2 flex flex-col items-center justify-center group p-1 text-center",
                    isSwapMode && isEditable && "cursor-pointer border-primary/50 hover:border-primary hover:bg-primary/10 transition-all"
                  )}
                >
                  {slot?.name ? (
                    <>
                      {/* Pokemon Info */}
                      <div className="flex-1 flex flex-col justify-center items-center">
                        <p className="text-xs font-bold leading-tight line-clamp-2">{slot.name}</p>
                        {slot.hp && <Badge variant="outline" className="mt-1 text-[10px] px-1 h-auto">HP {slot.hp}</Badge>}
                      </div>

                      {/* Damage Overlay */}
                      {(slot.damage ?? 0) > 0 && (
                        <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center pointer-events-none">
                          <span className="text-3xl font-black text-primary drop-shadow-sm">{slot.damage}</span>
                        </div>
                      )}

                      {/* Damage Controls */}
                      {isEditable && !isSwapMode && (
                        <div className="absolute bottom-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button size="icon" variant="ghost" className="size-6 rounded-md" onClick={(e) => { e.stopPropagation(); onUpdateBenchDamage(playerType, i, -10); }} disabled={(slot.damage ?? 0) <= 0}>
                            <Minus className="size-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="size-6 rounded-md" onClick={(e) => { e.stopPropagation(); onUpdateBenchDamage(playerType, i, 10); }}>
                            <Plus className="size-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Empty Slot
                    <div className="size-4 rounded-full bg-border/20 group-hover:bg-primary/40 transition-colors" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className={containerClasses}>
          <div className={bannerClasses}>
            <h2 className={bannerTextClasses}>Prizes</h2>
          </div>
          <div className="p-4 grid grid-cols-3 gap-4 justify-items-center">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                onClick={() => isEditable && i < prizes && onUpdatePrizes(playerType, -1)}
                className={cn(
                  "size-16 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  isEditable && i < prizes && "cursor-pointer hover:scale-110",
                  i < prizes ? "bg-card" : "bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                )}
              >
                {i < prizes && (
                  <img src={pokeBall} alt="Prize card" className="w-10 h-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}