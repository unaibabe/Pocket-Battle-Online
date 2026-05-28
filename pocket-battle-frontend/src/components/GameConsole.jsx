import { useState, useRef, useEffect } from "react";
import { GameCard } from "./GameCard";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { translate } from "../lib/i18n";
import { cn } from "../lib/utils";

export function GameConsole({ log, onSendMessage, language, playerType }) {
  const [message, setMessage] = useState("");
  const scrollAreaRef = useRef(null);

  // Scroll to bottom on new log entries
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [log]);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(playerType, message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <GameCard
      title={translate("gameConsole", language)}
      className="flex flex-col"
      contentClassName="flex-1 flex flex-col gap-4" // Ensures content fills available space
    >
      <div ref={scrollAreaRef} className="flex-1 min-h-0 p-2 bg-gray-900 rounded-md text-white font-mono text-sm overflow-y-auto">
        {log.length === 0 ? (
          <p className="text-gray-500 italic">{translate("noEventsYet", language)}</p>
        ) : (
          log.map((entry, index) => (
            <div key={index} className="mb-1">
              {entry.type === "system" ? (
                <span className="!text-yellow-400">{entry.message}</span>
              ) : (
                <span className={cn(
                  entry.player === 'local' ? "text-primary" : "text-secondary",
                  "font-bold"
                )}>
                  {entry.player === 'local' ? translate("you", language) : translate("opponent", language)}:{" "}
                  <span className="text-white font-normal">{entry.message}</span>
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder={translate("typeMessage", language)}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleSendMessage} disabled={!message.trim()}>
          <Send className="h-4 w-4" />
          <span className="sr-only">{translate("sendMessage", language)}</span>
        </Button>
      </div>
    </GameCard>
  );
}
