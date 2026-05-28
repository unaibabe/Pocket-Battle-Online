import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { Swords, BookOpen, UserCircle, History, PlayCircle, Loader2 } from 'lucide-react';

function Dashboard({ user }) {
  const [partidas, setPartidas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarPartidas = async () => {
      const userId = user?.id || user?.usuario?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://app-tcg-web.onrender.com/usuarios/${userId}/partidas`);
        const data = await response.json();
        setPartidas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando historial:", error);
      } finally {
        setIsLoading(false);
      }
    };
    cargarPartidas();
  }, [user]);

  const irAlLobby = () => {
    navigate('/lobby');
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-zinc-950 text-foreground p-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Pocket Battle <span className="text-primary">Online</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          ¡Bienvenido, <span className="text-orange-500 font-bold">
            {user?.usuario || user?.nombre || 'Entrenador'}
          </span>!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mb-12">
        <DashboardCard
          onClick={irAlLobby}
          icon={<Swords className="h-12 w-12 mb-4 text-orange-500" />}
          title="Play"
          description="Crea o únete a una sala."
          isButton
        />
        <DashboardCard
          to="/rules"
          icon={<BookOpen className="h-12 w-12 mb-4 text-blue-500" />}
          title="Reglas"
          description="Aprende a jugar al TCG."
        />
        <DashboardCard
          to="/profile"
          icon={<UserCircle className="h-12 w-12 mb-4 text-muted-foreground" />}
          title="Perfil"
          description="Mira tus estadísticas."
          disabled
        />
      </div>

      <div className="w-full max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <History className="text-orange-500" />
          <h2 className="text-2xl font-bold">Continuar Combates</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
          </div>
        ) : partidas.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {partidas.map((partida) => (
              <div key={partida.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between hover:border-orange-500/30 transition-colors">
                <div className="flex flex-col">
                  <span className="text-sm text-zinc-500">
                    Sala: {partida.codigo_sala || `Partida ${partida.id}`}
                  </span>
                  <span className="font-bold uppercase tracking-tight">
                    Estado: <span className="text-green-500">{partida.estado || "EN_CURSO"}</span>
                  </span>
                </div>
                <Link to={`/game/${partida.id}`}>
                  <button className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95">
                    <PlayCircle size={18} /> JUGAR
                  </button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed border-zinc-800 rounded-2xl text-zinc-500 italic">
            No tienes partidas en curso actualmente.
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardCard({ to, icon, title, description, disabled = false, isButton = false, onClick }) {
  const content = (
    <div
      onClick={!disabled ? onClick : undefined}
      className={`h-full text-center bg-zinc-900 border border-zinc-800 p-6 rounded-2xl transition-all duration-300 ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:border-orange-500 transform hover:-translate-y-1 group cursor-pointer active:scale-95'
      }`}
    >
      <div className="flex flex-col items-center justify-center">
        {icon}
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );

  if (disabled || isButton) return content;
  return <Link to={to} className="block h-full">{content}</Link>;
}

export default Dashboard;