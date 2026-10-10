import type { FC } from 'react';
import { Leaf, Camera, Radar, Trophy, Home } from 'lucide-react';
import { soundEngine } from '../services/sound';

export type ActiveView = 'landing' | 'collection' | 'scanner' | 'radar' | 'expeditions';

interface BottomNavProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  cardsCount: number;
}

export const BottomNav: FC<BottomNavProps> = ({
  activeView,
  onSelectView,
  cardsCount,
}) => {
  const handleNav = (view: ActiveView) => {
    soundEngine.playBeep(view === 'scanner' ? 1100 : 900, 0.04);
    onSelectView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="bottom-nav" aria-label="Mobile Bottom Navigation">
      <button
        className={`bottom-nav-item ${activeView === 'landing' ? 'active' : ''}`}
        onClick={() => handleNav('landing')}
        aria-label="Home Landing"
      >
        <Home size={19} />
        <span>Home</span>
      </button>

      <button
        className={`bottom-nav-item ${activeView === 'collection' ? 'active' : ''}`}
        onClick={() => handleNav('collection')}
        aria-label="Card Collection Dex"
      >
        <div className="nav-icon-wrap">
          <Leaf size={19} />
          {cardsCount > 0 && <span className="nav-badge">{cardsCount}</span>}
        </div>
        <span>Dex</span>
      </button>

      {/* Floating elevated action button for Scanner */}
      <button
        className={`bottom-nav-item scanner-action-btn ${activeView === 'scanner' ? 'active' : ''}`}
        onClick={() => handleNav('scanner')}
        aria-label="Open Field Scanner"
      >
        <div className="scanner-fab-circle">
          <Camera size={22} />
        </div>
        <span>Scan</span>
      </button>

      <button
        className={`bottom-nav-item ${activeView === 'radar' ? 'active' : ''}`}
        onClick={() => handleNav('radar')}
        aria-label="Nature Radar"
      >
        <Radar size={19} />
        <span>Radar</span>
      </button>

      <button
        className={`bottom-nav-item ${activeView === 'expeditions' ? 'active' : ''}`}
        onClick={() => handleNav('expeditions')}
        aria-label="Expeditions & Quests"
      >
        <Trophy size={19} />
        <span>Quests</span>
      </button>
    </nav>
  );
};
