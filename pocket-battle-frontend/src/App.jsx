import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Home from './pages/Home';
import Register from './pages/Register';
import GamePage from './pages/GamePage';
import Dashboard from './pages/Dashboard';
import Lobby from './pages/Lobby';
import Rules from './pages/Rules';
import Profile from './pages/Profile';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("poke_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem("poke_user", JSON.stringify(userData));
  };

  return (
    <BrowserRouter>
      <div className="antialiased">
        <Routes>
          <Route
            path="/"
            element={<Home onLogin={handleLogin} />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard user={user} />}
          />

          <Route path="/lobby" element={<Lobby />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/game" element={<GamePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;