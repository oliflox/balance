import { useEffect, useRef, useState } from 'react';
import { useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { useRoute } from './lib/route';
import { INK } from './theme';
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MonSuivi from './components/MonSuivi';
import WeighInModal from './components/WeighInModal';
import Settings from './components/Settings';
import Toast from './components/Toast';
import NotFound from './components/NotFound';
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
  const { passwordRecovery } = useAuth();
  const { loading, error, me } = useData();
  const [route, go] = useRoute();
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Already in a room: an invite link has nothing left to offer, show the league.
    // Only once `me` exists — otherwise this would wipe the code out of the URL
    // before onboarding gets to read it.
    if (me && route.name === 'join') go({ name: 'dash' });
    if (passwordRecovery) go({ name: 'settings' });
    // go() only ever writes location.hash; re-running on its identity would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passwordRecovery, route.name, me]);

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

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 3400);
  };

  return (
    <div>
      <Header me={me} route={route} onNewWeighIn={() => setModalOpen(true)} />

      {route.name === 'dash' && (
        <Dashboard onOpenPerson={(id) => go({ name: 'me', id })} onNewWeighIn={() => setModalOpen(true)} />
      )}
      {route.name === 'me' && <MonSuivi focusId={route.id ?? me.id} onNewWeighIn={() => setModalOpen(true)} />}
      {route.name === 'settings' && <Settings onToast={showToast} />}
      {route.name === '404' && <NotFound />}

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
