import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import UpdatePassword from './pages/UpdatePassword';
import Setlists from './pages/Setlists';
import SetlistEdit from './pages/SetlistEdit';
import Songs from './pages/Songs';
import SongEdit from './pages/SongEdit';
import PlaySong from './pages/PlaySong';
import TimecodeEditor from './pages/TimecodeEditor';
import JoinSetlist from './pages/JoinSetlist';
import { Music, List, Menu, Zap } from 'lucide-react';

// Importação dos Modais do SaaS e Componentes Visuais
import PaywallModal from './components/PaywallModal';
import SettingsModal from './components/SettingsModal';
import Logo from './components/Logo';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Menu de Navegação Global
const Navigation = ({ onOpenSettings, onOpenPaywall }) => {
  const { plan } = useAuth();
  const location = useLocation();

  // Função utilitária para checar se a aba está ativa e pintar o botão
  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* BARRA SUPERIOR CONSTANTE */}
      <div className="bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between sticky top-0 z-50 select-none">
        <div className="flex items-center gap-6">
          {/* Logo Oficial Reduzida para 2/3 */}
          <Link to="/" className="flex items-center hover:opacity-70 transition-opacity">
             <Logo className="h-5 text-black" />
          </Link>

          {/* Abas invisíveis no Mobile, visíveis no Desktop */}
          <div className="hidden sm:flex gap-4 border-l-2 border-black/10 pl-6">
            <Link to="/" className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-colors ${isActive('/') ? 'text-black' : 'text-black/40 hover:text-black'}`}>
              <List size={16} /> Setlists
            </Link>
            <Link to="/songs" className={`flex items-center gap-2 font-black uppercase tracking-widest text-xs transition-colors ${isActive('/songs') ? 'text-black' : 'text-black/40 hover:text-black'}`}>
              <Music size={16} /> Letras
            </Link>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {plan !== 'pro' && (
            <button 
              onClick={onOpenPaywall}
              className="bg-yellow-400 border-2 border-black text-black font-black text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 hover:bg-yellow-300 transition-colors active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Zap size={10} fill="black" /> Assine Pro
            </button>
          )}
          
          <button 
            onClick={onOpenSettings} 
            className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center text-black hover:bg-gray-50 active:scale-95 transition-transform"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* BARRA DE RODAPÉ FIXA (BOTTOM NAV) - Apenas Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-2 flex gap-2 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] select-none">
        <Link 
          to="/" 
          className={`flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest border-2 border-black transition-all active:scale-95 ${
            isActive('/') 
              ? 'bg-black text-white shadow-none' 
              : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          }`}
        >
          <List size={16} /> Setlists
        </Link>
        <Link 
          to="/songs" 
          className={`flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest border-2 border-black transition-all active:scale-95 ${
            isActive('/songs') 
              ? 'bg-black text-white shadow-none' 
              : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
          }`}
        >
          <Music size={16} /> Letras
        </Link>
      </div>
    </>
  );
};

const AuthenticatedApp = () => {
  const { isAuthenticated, plan } = useAuth();
  const location = useLocation();

  // Estados dos Modais
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Condicional estrita para ocultar menus no login e no modo de palco full screen
  const hideNavigation = 
    location.pathname === '/login' ||
    location.pathname.includes('/play/') || 
    location.pathname.includes('/timecode') ||
    location.pathname.includes('/join-setlist');

  return (
    <>
      {isAuthenticated && !hideNavigation && (
        <Navigation 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenPaywall={() => setIsPaywallOpen(true)} 
        />
      )}
      
      {/* Margem inferior adaptável no mobile para o conteúdo não ficar escondido atrás do rodapé fixo */}
      <div className={`w-full ${isAuthenticated && !hideNavigation ? 'pb-20 sm:pb-0' : ''}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          
          <Route path="/" element={<ProtectedRoute><Setlists /></ProtectedRoute>} />
          <Route path="/setlists/:id/edit" element={<ProtectedRoute><SetlistEdit /></ProtectedRoute>} />
          <Route path="/setlists/:id/play/:songIndex" element={<ProtectedRoute><PlaySong /></ProtectedRoute>} />
          <Route path="/join-setlist/:id" element={<ProtectedRoute><JoinSetlist /></ProtectedRoute>} />
          
          <Route path="/songs" element={<ProtectedRoute><Songs /></ProtectedRoute>} />
          <Route path="/songs/:id" element={<ProtectedRoute><SongEdit /></ProtectedRoute>} />
          <Route path="/songs/:id/timecode" element={<ProtectedRoute><TimecodeEditor /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Modais Globais */}
      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        currentPlan={plan}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onOpenPaywall={() => setIs