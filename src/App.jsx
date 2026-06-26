import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Setlists from './pages/Setlists';
import SetlistEdit from './pages/SetlistEdit';
import Songs from './pages/Songs';
import SongEdit from './pages/SongEdit';
import PlaySong from './pages/PlaySong';
import TimecodeEditor from './pages/TimecodeEditor';
import JoinSetlist from './pages/JoinSetlist';
import UpdatePassword from './pages/UpdatePassword'; // IMPORTAMOS A TELA DE NOVA SENHA
import { LogOut, Music, List, Menu, Zap } from 'lucide-react';

import PaywallModal from './components/PaywallModal';
import SettingsModal from './components/SettingsModal';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <div className="min-h-screen flex items-center justify-center font-bold uppercase tracking-widest">Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const Navigation = ({ onOpenSettings, onOpenPaywall }) => {
  const { plan } = useAuth();
  return (
    <div className="bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between sticky top-0 z-50 select-none">
      <div className="flex gap-4">
        <Link to="/" className="flex items-center gap-2 font-black uppercase tracking-widest text-xs hover:text-black/60 transition-colors">
          <List size={16} /> Setlists
        </Link>
        <Link to="/songs" className="flex items-center gap-2 font-black uppercase tracking-widest text-xs hover:text-black/60 transition-colors">
          <Music size={16} /> Letras
        </Link>
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
  );
};

const AuthenticatedApp = () => {
  const { isAuthenticated, plan } = useAuth();
  const location = useLocation();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const hideNavigation = 
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
      </Routes>

      <PaywallModal 
        isOpen={isPaywallOpen} 
        onClose={() => setIsPaywallOpen(false)} 
        currentPlan={plan}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onOpenPaywall={() => setIsPaywallOpen(true)}
      />
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