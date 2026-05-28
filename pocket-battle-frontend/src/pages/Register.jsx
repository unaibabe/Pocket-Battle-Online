import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import '../styles/Home.css';

const Register = () => {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('https://app-tcg-web.onrender.com/usuarios/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          email: email || 'test@test.com',
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Usuario creado correctamente. Redirigiendo al login...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(data.detail || 'No se pudo crear el usuario');
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
            REGISTRO <span className="highlight">USUARIO</span>
          </h1>
          <p className="login-subtitle">Crea tu cuenta para entrar al lobby</p>
        </header>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">
              <User size={16} /> Usuario
            </label>
            <input
              type="text"
              required
              placeholder="Tu nombre de usuario"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
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

          <div className="input-group">
            <label className="input-label">
              <Lock size={16} /> Repetir contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}

          <button type="submit" disabled={isLoading} className="btn-login">
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'CREAR CUENTA'
            )}
          </button>
        </form>

        <footer className="login-footer">
          <p className="login-subtitle">
            ¿Ya tienes cuenta?{' '}
            <span
              className="highlight"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Inicia sesión
            </span>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Register;