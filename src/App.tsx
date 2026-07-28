import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { INK } from './theme';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MonSuivi from './components/MonSuivi';
import WeighInModal from './components/WeighInModal';
import Settings from './components/Settings';
import Toast from './components/Toast';
import Spinner from './components/Spinner';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(1200px 600px at 80% -10%, rgba(200,255,61,.10), transparent 60%), #0E100C',
  color: INK,
  fontFamily: "'Space Grotesk', system-ui, sans-serif",
  WebkitFontSmoothing: 'antialiased',
};

export default function App() {
  const { loading, session } = useAuth();

  if (loading) {
    return (
      <div style={{ ...pageStyle, display: 'grid', placeItems: 'center' }}>
        <Spinner label="On monte sur la balance…" />
      </div>
    );
  }

  if (!session) {
    return (
      <div style={pageStyle}>
        <Login />
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <DataProvider>
        <AuthedApp />
      </DataProvider>
    </div>
  );
}

function AuthedApp() {
  const { loading, error, me } = useData();
  const [screen, setScreen] = useState<'dash' | 'me' | 'settings'>('dash');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner label="Chargement de la ligue…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ maxWidth: 420, textAlign: 'center', color: '#FF8080' }}>
          <div style={{ fontSize: 15 }}>Impossible de charger les données.</div>
          <div style={{ fontSize: 13, color: 'rgba(242,240,230,.55)', marginTop: 8 }}>{error}</div>
        </div>
      </div>
    );
  }

  // Signed in but no competitor profile yet → onboarding.
  if (!me) return <Onboarding />;

  const openPerson = (id: string) => {
    setFocusId(id);
    setScreen('me');
  };
  const goMe = () => {
    setFocusId(me.id);
    setScreen('me');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as unknown as { _t?: number })._t);
    (showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(''), 3400);
  };

  return (
    <div>
      <Header
        me={me}
        screen={screen}
        onDash={() => setScreen('dash')}
        onMe={goMe}
        onNewWeighIn={() => setModalOpen(true)}
        onSettings={() => setScreen('settings')}
      />

      {screen === 'dash' && <Dashboard onOpenPerson={openPerson} onNewWeighIn={() => setModalOpen(true)} />}
      {screen === 'me' && <MonSuivi focusId={focusId ?? me.id} onNewWeighIn={() => setModalOpen(true)} />}
      {screen === 'settings' && <Settings onToast={showToast} />}

      {modalOpen && (
        <WeighInModal
          onClose={() => setModalOpen(false)}
          onSaved={(msg) => {
            setModalOpen(false);
            showToast(msg);
          }}
        />
      )}

      <Toast message={toast} />
    </div>
  );
}
