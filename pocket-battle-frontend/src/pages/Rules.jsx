import { GameCard } from '../components/GameCard';
import { ThemeToggle } from '../components/ui/ThemeToggle';

const rulesContent = `
1. **Objective**: The main goal is to take all six of your Prize cards. You take a Prize card each time you Knock Out one of your opponent's Pokémon.

2. **Setup**:
   - Both players shuffle their 60-card decks.
   - Draw the top 7 cards. This is your starting hand.
   - Check for a Basic Pokémon in your hand. If you have one, place it face down as your Active Pokémon. If not, show your hand, shuffle, and draw 7 new cards. Your opponent may draw an extra card.
   - Place up to 5 more Basic Pokémon on your Bench, face down.
   - Place the top 6 cards of your deck to the side, face down. These are your Prize cards.
   - Flip a coin. The winner decides who goes first.
   - Flip all your Pokémon face up. The game begins!

3. **Turn Structure**: Each turn consists of three main parts:
   - **Draw a card**: Start your turn by drawing a card from the top of your deck.
   - **Take actions**: You can do any of the following in any order:
     - Play any number of Basic Pokémon to your Bench.
     - Evolve your Pokémon (one evolution per Pokémon per turn).
     - Attach one Energy card from your hand to one of your Pokémon.
     - Play any number of Item cards.
     - Play one Supporter card.
     - Play one Stadium card.
     - Use any number of Abilities.
     - Retreat your Active Pokémon once per turn by paying its Retreat Cost.
   - **Attack**: This ends your turn. Announce your attack and check if you have the required Energy. Apply damage and any effects.

4. **Winning the Game**: You win if any of these conditions are met:
   - You take your last Prize card.
   - Your opponent has no Pokémon left in play.
   - Your opponent cannot draw a card at the beginning of their turn.
`;

function Rules() {
    return (
        <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-4xl">
                <GameCard title="Official Rules" className="flex flex-col" contentClassName="flex-1 flex flex-col">
                    <div className="flex-1 min-h-0 p-4 bg-zinc-900/80 rounded-md text-foreground font-mono text-sm overflow-y-auto max-h-[75vh]">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed">{rulesContent.trim()}</pre>
                    </div>
                </GameCard>
            </div>
        </div>
    );
}

export default Rules;
