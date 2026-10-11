import { useState, type FC } from 'react';
import { Leaf, Sparkles, User, Radar, Volume2, VolumeX, Camera, Trophy, Home } from 'lucide-react';
import { ThemeType, HealthStatus, UserProfile } from '../types';
import { ActiveView } from './BottomNav';
import { soundEngine } from '../services/sound';

interface TopBarProps {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  cardsCount: number;
  health: HealthStatus | null;
  user: UserProfile | null;
  activeView: ActiveView;
  onSelectView: (v: ActiveView) => void;
  onOpenAuth: () => void;
}

export const TopBar: FC<TopBarProps> = ({
  theme,
  setTheme,
  cardsCount,
  health,
  user,
  activeView,
  onSelectView,
  onOpenAuth,
}) => {
  const [soundOn, setSoundOn] = useState(soundEngine.isSoundEnabled());

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundEngine.setSoundEnabled(next);
    if (next) soundEngine.playBeep(980, 0.08);
  };

  const handleThemeChange = (newTheme: ThemeType) => {
    soundEngine.playBeep(1200, 0.05);
    setTheme(newTheme);
  };

  const handleNav = (v: ActiveView) => {
    soundEngine.playBeep(880, 0.04);
    onSelectView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="topbar">
      <div className="brand-group">
        {/* Pokédex Hardware Bezel indicators */}
        {theme === 'pokedex' && (
          <div className="pokedex-top-bezel">
            <div className="pokedex-big-blue-jewel" />
            <div className="pokedex-led-cluster">
              <div className="pokedex-led led-red" />
              <div className="pokedex-led led-yellow" />
              <div className="pokedex-led led-green" />
            </div>
          </div>
        )}

        <button
          className="brand brand-btn"
          onClick={() => handleNav('landing')}
          aria-label="JungleDex home"
        >
          <span className="brand-mark">
            <Leaf size={22} />
          </span>
          <span>
            Jungle<span className="brand-light">Dex</span>
            <small>{theme === 'pokedex' ? 'KANTO REGIONAL DEX' : 'THE LIVING WORLD DEX'}</small>
          </span>
        </button>
      </div>

      {/* Desktop Navigation Links — always available on widescreen desktop */}
      <nav className="desktop-nav" aria-label="Desktop Navigation">
        <button
          className={`nav-link-btn ${activeView === 'landing' ? 'active' : ''}`}
          onClick={() => handleNav('landing')}
        >
          <Home size={15} />
          <span>Home</span>
        </button>

        <button
          className={`nav-link-btn ${activeView === 'collection' || activeView === 'card-detail' ? 'active' : ''}`}
          onClick={() => handleNav('collection')}
        >
          <Leaf size={15} />
          <span>Collection</span>
          {cardsCount > 0 && <span className="count">{cardsCount}</span>}
        </button>

        <button
          className={`nav-link-btn ${activeView === 'scanner' ? 'active' : ''}`}
          onClick={() => handleNav('scanner')}
        >
          <Camera size={15} />
          <span>Scanner</span>
        </button>

        <button
          className={`nav-link-btn ${activeView === 'radar' ? 'active' : ''}`}
          onClick={() => handleNav('radar')}
        >
          <Radar size={15} />
          <span>Radar</span>
        </button>

        <button
          className={`nav-link-btn ${activeView === 'expeditions' ? 'active' : ''}`}
          onClick={() => handleNav('expeditions')}
        >
          <Trophy size={15} />
          <span>Expeditions</span>
        </button>
      </nav>

      <div className="topbar-controls">
        <button
          className="icon-button sound-btn"
          onClick={toggleSound}
          title={soundOn ? 'Mute 8-bit sounds' : 'Enable 8-bit sounds'}
          aria-label="Toggle Sound"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <label className="theme-select">
          <Sparkles size={16} />
          <select
            value={theme}
            onChange={(e) => handleThemeChange(e.target.value as ThemeType)}
            aria-label="Choose theme"
          >
            <option value="pokedex">Classic Pokédex</option>
            <option value="nature">Verdant Forest</option>
            <option value="enchanted">Enchanted Obsidian</option>
            <option value="cosmic">Cosmic Void</option>
          </select>
        </label>

        <button
          className="auth-profile-btn"
          onClick={() => {
            soundEngine.playBeep(880, 0.05);
            onOpenAuth();
          }}
          title={user ? `Signed in as ${user.displayName}` : 'Sign in / Cloud Sync'}
          aria-label={user ? `Signed in as ${user.displayName}` : 'Sign in'}
        >
          {user?.photoURL ? (
            <img className="user-nav-avatar" src={user.photoURL} alt="" />
          ) : (
            <User size={16} />
          )}
          <span className="profile-btn-label">{user ? (user.displayName?.split(' ')[0] || 'Profile') : 'Sign In'}</span>
        </button>

        {health && (
          <span
            className="api-status-badge"
            title={
              health.ok
                ? `AI Ready (${health.model || 'gemini'})`
                : 'API Offline — Run npm run dev'
            }
          >
            <span
              className={`status-dot ${health.ok ? (health.aiConfigured ? 'green' : 'amber') : 'red'}`}
            />
            <span className="api-status-text">
              {health.ok ? (health.aiConfigured ? 'AI' : 'Key') : 'Offline'}
            </span>
          </span>
        )}
      </div>
    </header>
  );
};
