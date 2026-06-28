import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
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
import Onboarding from './pages/Onboarding'; 
import { Music, List, Menu, Zap } from 'lucide-react';

// Importação dos Modais e Componentes Visuais
import PaywallModal from './components/PaywallModal';
import SettingsModal from './components/SettingsModal';
import Logo from './components/Logo';
import Success from './pages/Success';
import ForceTerms, { CURRENT_TERMS_VERSION } from './components/ForceTerms'; // <--- IMPORT NOVO

// TELA DE CARREGAMENTO IMPONENTE (SPLASH SCREEN)
const SplashScreen = () => (
  <div className="fixed inset-0 min-h-screen bg-black flex flex-col items-center justify-center z-[100] select-none">
    <style>
      {`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-loading-bar {
          animation: loadingBar 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}
    </style>
    <div className="flex flex-col items-center">
      <div className="mb-8 opacity-90 animate-pulse">
        <Logo className="h-8 text-white filter invert brightness-0 saturate-100" />
      </div>
      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden relative">
        <div className="absolute top-0 left-0 h-full w-1/2 bg-yellow-400 rounded-full animate-loading-bar shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// GUARDA-COSTAS PARA ROTAS EXCLUSIVAS PRO
const ProRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth, plan } = useAuth();
  if (isLoadingAuth) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (plan !== 'pro') return <Navigate to="/" replace />; 
  return children;
};

// Menu de Navegação Global
const Navigation = ({ onOpenSettings, onOpenPaywall }) => {
  const { plan } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="bg-white border-b-4 border-black px-4 py-3 flex items-center justify-between sticky top-0 z-50 select-none grid grid-cols-3">
        <div className="flex items-center justify-start">
          {plan !== 'pro' && (
            <button 
              onClick={onOpenPaywall}
              className="bg-yellow-400 border-2 border-black text-black font-black text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1 hover:bg-yellow-300 transition-colors active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <Zap size={10} fill="black" /> <span className="hidden xs:inline">Assine</span> Pro
            </button>
          )}
        </div>
        <div className="flex items-center justify-center">
          <Link to="/" className="flex items-center hover:opacity-70 transition-opacity">
             <Logo className="h-5 text-black" />
          </Link>
        </div>
        <div className="flex items-center justify-end">
          <button 
            onClick={onOpenSettings} 
            className="w-9 h-9 border-2 border-black rounded-lg flex items-center justify-center text-black hover:bg-gray-50 active:scale-95 transition-transform"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black p-3 flex gap-3 z-40 select-none max-w-xl mx-auto sm:rounded-t-2xl sm:border-x-4">
        <Link 
          to="/" 
          className={`flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest border-2 border-black transition-all active:scale-95 ${
            isActive('/') ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
          }`}
        >
          <List size={16} /> Setlists
        </Link>
        <Link 
          to="/songs" 
          className={`flex-1 min-h-[48px] rounded-xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest border-2 border-black transition-all active:scale-95 ${
            isActive('/songs') ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
          }`}
        >
          <Music size={16} /> Letras
        </Link>
      </div>
    </>
  );
};

const AuthenticatedApp = () => {
  const { isAuthenticated, plan, profile, user } = useAuth(); // <--- PROFILE E USER ADICIONADOS
  const location = useLocation();
  const navigate = useNavigate();

  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(true); // <--- ESTADO NOVO
  
  // VERIFICA SE É A PRIMEIRA VEZ E CHAMA O TUTORIAL
  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenTutorial');
    if (isAuthenticated && !hasSeen && location.pathname !== '/tutorial') {
      navigate('/tutorial');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  // VERIFICA SE O USUÁRIO ACEITOU A VERSÃO MAIS RECENTE DOS TERMOS
  useEffect(() => {
    if (isAuthenticated && profile && profile.accepted_terms_version !== CURRENT_TERMS_VERSION) {
      setHasAcceptedTerms(false);
    } else {
      setHasAcceptedTerms(true);
    }
  }, [isAuthenticated, profile]);
  
  const hideNavigation = 
    location.pathname === '/login' ||
    location.pathname === '/sucesso' ||
    location.pathname === '/tutorial' || 
    location.pathname.includes('/play/') || 
    location.pathname.includes('/timecode') ||
    location.pathname.includes('/join-setlist');

  // TRAVA A TELA SE OS TERMOS NÃO FORAM ACEITOS AINDA
  if (!hasAcceptedTerms) {
    return <ForceTerms user={user} onAccepted={() => setHasAcceptedTerms(true)} />;
  }

  return (
    <>
      {isAuthenticated && !hideNavigation && (
        <Navigation 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onOpenPaywall={() => setIsPaywallOpen(true)} 
        />
      )}
      
      <div className={`w-full ${isAuthenticated && !hideNavigation ? 'pb-24' : ''}`}>
        <Routes>
          <Route path="/tutorial" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/sucesso" element={<Success />} />
          
          <Route path="/" element={<ProtectedRoute><Setlists /></ProtectedRoute>} />
          <Route path="/setlists/:id/edit" element={<ProtectedRoute><SetlistEdit /></ProtectedRoute>} />
          <Route path="/setlists/:id/play/:songIndex" element={<ProtectedRoute><PlaySong /></ProtectedRoute>} />
          <Route path="/join-setlist/:id" element={<ProtectedRoute><JoinSetlist /></ProtectedRoute>} />
          
          <Route path="/songs" element={<ProtectedRoute><Songs /></ProtectedRoute>} />
          <Route path="/songs/:id" element={<ProtectedRoute><SongEdit /></ProtectedRoute>} />
          <Route path="/songs/:id/timecode" element={<ProRoute><TimecodeEditor /></ProRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <PaywallModal isOpen={isPaywallOpen} onClose={() => setIsPaywallOpen(false)} currentPlan={plan} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onOpenPaywall={() => setIsPaywallOpen(true)} />
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