import { useState, type FC, type FormEvent } from 'react';
import { X, LogIn, UserPlus, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  isFirebaseConfigured,
} from '../services/firebase';

interface AuthModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  onSetUser?: (user: UserProfile) => void;
}

export const AuthModal: FC<AuthModalProps> = ({ user, isOpen, onClose, onToast, onSetUser }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setBusy(true);
    setError('');
    try {
      if (!isFirebaseConfigured()) {
        const guestUser: UserProfile = {
          uid: 'guest-' + Date.now(),
          displayName: 'Field Explorer',
          email: 'explorer@jungledex.app',
          photoURL: null,
          isAnonymous: false,
          explorerLevel: 1,
          explorerXp: 50,
          stepsWalked: 0,
          distanceMeters: 0,
        };
        onSetUser?.(guestUser);
        onToast('Signed in as Explorer!');
        onClose();
        return;
      }
      await loginWithGoogle();
      onToast('Signed in successfully with Google!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!isFirebaseConfigured()) {
        onToast(`Signed in as ${displayName || email.split('@')[0]}!`);
        onClose();
        return;
      }

      if (tab === 'login') {
        await loginWithEmail(email, password);
        onToast('Welcome back, Explorer!');
      } else {
        await registerWithEmail(email, password, displayName);
        onToast('Explorer account created!');
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog auth-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">EXPLORER IDENTITY</div>
            <h3>{user ? 'Explorer Profile' : 'Sign in to JungleDex'}</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {user ? (
          <div className="auth-profile-box">
            <div className="profile-badge-row">
              <div className="avatar-circle">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} />
                ) : (
                  <span>{(user.displayName || 'E')[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <b>{user.displayName || 'Field Explorer'}</b>
                <small>{user.email || 'Explorer Account'}</small>
                <span className="cloud-status-pill">
                  <CheckCircle2 size={12} /> Cloud Backup Active
                </span>
              </div>
            </div>

            <div className="auth-stats-grid">
              <div className="stat-card">
                <small>Rank Level</small>
                <b>Level {user.explorerLevel || 1}</b>
              </div>
              <div className="stat-card">
                <small>Total XP</small>
                <b>{user.explorerXp || 0} XP</b>
              </div>
            </div>

            <button
              className="button secondary full"
              onClick={async () => {
                await logoutUser();
                onToast('Signed out of JungleDex.');
                onClose();
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </div>
        ) : (
          <div className="auth-form-container">
            <div className="auth-tabs">
              <button
                className={`tab-btn ${tab === 'login' ? 'active' : ''}`}
                onClick={() => { setTab('login'); setError(''); }}
              >
                Sign In
              </button>
              <button
                className={`tab-btn ${tab === 'register' ? 'active' : ''}`}
                onClick={() => { setTab('register'); setError(''); }}
              >
                Create Account
              </button>
            </div>

            {error && <p className="error-msg">{error}</p>}

            <form onSubmit={handleEmailAuth} className="auth-form">
              <button
                type="button"
                className="button secondary full google-btn"
                onClick={handleGoogleLogin}
                disabled={busy}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                Continue with Google
              </button>

              <div className="auth-divider">
                <span>or with email</span>
              </div>

              {tab === 'register' && (
                <label className="form-label">
                  <span>Explorer Name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Jane Goodall"
                    required
                  />
                </label>
              )}

              <label className="form-label">
                <span>Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="explorer@nature.org"
                  required
                />
              </label>

              <label className="form-label">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </label>

              <button type="submit" className="button primary full" disabled={busy}>
                {busy ? (
                  <span className="spinner" />
                ) : tab === 'login' ? (
                  <>
                    <LogIn size={16} /> Sign In
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Create Account
                  </>
                )}
              </button>

              <button
                type="button"
                className="text-button"
                onClick={onClose}
                style={{ textAlign: 'center', width: '100%', marginTop: '12px' }}
              >
                Continue as Guest Explorer →
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
