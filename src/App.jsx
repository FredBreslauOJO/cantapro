import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Setlists from './pages/Setlists';
import SetlistEdit from './pages/SetlistEdit';
import Songs from './pages/Songs';
import SongEdit from './pages/SongEdit';
import PlaySong from './pages/PlaySong';
import TimecodeEditor from './pages/TimecodeEditor';
import JoinSetlist from './pages/JoinSetlist'; // IMPORTAMOS O CONVITE AQUI
import { LogOut, Music, List } from 'lucide-react';

// Componente para proteger telas privadas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  
  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return children;
};

// Menu de Navegação Global
const Navigation = () => {
  const { logout, user } = useAuth();
  return (
    <div className="bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex gap-4">
        <Link to="/" className="flex items-center gap-2 font-black uppercase tracking-widest text-xs hover:text-black/60 transition-colors">
          <List size={16} /> Setlists
        </Link>
        <Link to="/songs" className="flex items-center gap-2 font-black uppercase tracking-widest text-xs hover:text-black/60 transition-colors">
          <Music size={16} /> Letras
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold text-black/40 truncate max-w-[100px] hidden md:block">{user?.email}</span>
        <button onClick={logout} className="flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest">
          <LogOut size={14} /> Sair
        </button>
      </div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Esconde o menu se estivermos na tela de apresentação, timecode ou aceitando convite
  const hideNavigation = 
    location.pathname.includes('/play/') || 
    location.pathname.includes('/timecode') ||
    location.pathname.includes('/join-setlist');

  return (
    <>
      {isAuthenticated && !hideNavigation && <Navigation />}
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<ProtectedRoute><Setlists /></ProtectedRoute>} />
        <Route path="/setlists/:id/edit" element={<ProtectedRoute><SetlistEdit /></ProtectedRoute>} />
        <Route path="/setlists/:id/play/:songIndex" element={<ProtectedRoute><PlaySong /></ProtectedRoute>} />
        
        {/* ROTA DE CONVITE */}
        <Route path="/join-setlist/:id" element={<ProtectedRoute><JoinSetlist /></ProtectedRoute>} />
        
        <Route path="/songs" element={<ProtectedRoute><Songs /></ProtectedRoute>} />
        <Route path="/songs/:id" element={<ProtectedRoute><SongEdit /></ProtectedRoute>} />
        <Route path="/songs/:id/timecode" element={<ProtectedRoute><TimecodeEditor /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  );
}

export default App;