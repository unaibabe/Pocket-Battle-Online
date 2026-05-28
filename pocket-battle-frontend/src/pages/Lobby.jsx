import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { GameCard } from '../components/GameCard';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Copy, Check, Loader2 } from 'lucide-react';

function Lobby() {
  const navigate = useNavigate();
  const [createdCode, setCreatedCode] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const getCurrentUserId = () => {
    try {
      const raw = sessionStorage.getItem('poke_user');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Number(parsed?.id ?? parsed?.usuario?.id ?? null);
    } catch {
      return null;
    }
  };

  const handleCreateMatch = async () => {
    const userId = getCurrentUserId();

    if (!userId) {
      alert('No se ha detectado el usuario logueado.');
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('https://app-tcg-web.onrender.com/lobby/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jugador_1_id: userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.detail || 'No se pudo crear la sala.');
        return;
      }

      setCreatedCode(data.code);
      setCreatedRoomId(data.partida_id);
    } catch (error) {
      console.error('Error creando sala:', error);
      alert('Error al crear la sala.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdCode) return;

    try {
      await navigator.clipboard.writeText(createdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copiando código:', error);
      alert('No se pudo copiar el código.');
    }
  };

  const handleStartGame = () => {
    if (createdRoomId) {
      navigate(`/game/${createdRoomId}`);
    }
  };

  const handleJoinGame = async (e) => {
    e.preventDefault();

    const userId = getCurrentUserId();

    if (!userId) {
      alert('No se ha detectado el usuario logueado.');
      return;
    }

    if (!joinCode.trim()) {
      alert('Introduce un código de sala.');
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch('https://app-tcg-web.onrender.com/lobby/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jugador_2_id: userId,
          code: joinCode.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.detail || 'No se pudo unir a la sala.');
        return;
      }

      navigate(`/game/${data.partida_id}`);
    } catch (error) {
      console.error('Error uniéndose a sala:', error);
      alert('Error al unirse a la sala.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-foreground p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold">Game Lobby</h1>
        <p className="text-muted-foreground mt-2">
          Create or join a match to start playing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <GameCard
          title="Create Match"
          className="bg-zinc-900 border-zinc-800 rounded-2xl p-6 flex flex-col space-y-4"
        >
          <p className="text-muted-foreground flex-grow">
            Generate a unique code to share with your friend.
          </p>

          <Button
            onClick={handleCreateMatch}
            disabled={isCreating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Generate Code'
            )}
          </Button>

          {createdCode && (
            <div className="p-4 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-2xl font-mono font-bold text-orange-500">
                {createdCode}
              </span>
              <Button variant="ghost" size="icon" onClick={handleCopyCode}>
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}

          <Button
            onClick={handleStartGame}
            disabled={!createdRoomId}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            Start Battle
          </Button>
        </GameCard>

        <GameCard
          title="Join Match"
          className="bg-zinc-900 border-zinc-800 rounded-2xl p-6 flex flex-col space-y-4"
        >
          <p className="text-muted-foreground flex-grow">
            Enter a code to join an existing match.
          </p>

          <form onSubmit={handleJoinGame} className="flex flex-col space-y-4">
            <Input
              placeholder="Enter game code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="text-center font-mono text-lg"
            />
            <Button
              type="submit"
              disabled={!joinCode || isJoining}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join'
              )}
            </Button>
          </form>
        </GameCard>
      </div>
    </div>
  );
}

export default Lobby;