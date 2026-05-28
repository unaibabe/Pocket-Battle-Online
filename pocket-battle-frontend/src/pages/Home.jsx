import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import '../styles/Home.css';

const Home = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('https://app-tcg-web.onrender.com/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: email,
          password: password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onLogin(data);
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión: ¿Está el servidor FastAPI encendido?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <header>
          <h1 className="login-title">
            POCKET <span className="highlight">BATTLE</span>
          </h1>
          <p className="login-subtitle">Inicia sesión para combatir</p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">
              <Mail size={16} /> Usuario
            </label>
            <input
              type="text"
              required
              placeholder="Tu nombre de usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <Lock size={16} /> Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" disabled={isLoading} className="btn-login">
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'ENTRAR AL LOBBY'
            )}
          </button>
        </form>

        <footer className="login-footer">
          <p className="login-subtitle">
            ¿No tienes cuenta?{' '}
            <span
              className="highlight"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/register')}
            >
              Regístrate aquí
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;