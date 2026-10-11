import type { FC } from 'react';
import {
  Camera,
  Leaf,
  Radar,
  Trophy,
  MapPin,
  CloudSun,
  Compass,
  Footprints,
  ArrowRight,
  UserPlus,
  HelpCircle,
} from 'lucide-react';
import { Discovery, UserProfile, ThemeType } from '../types';
import { soundEngine } from '../services/sound';

interface HomePageProps {
  user: UserProfile | null;
  theme?: ThemeType;
  cardsCount: number;
  cards?: Discovery[];
  sampleCards: Discovery[];
  placeLabel?: string;
  weather?: string;
  onOpenCard: (card: Discovery) => void;
  onGoToCollection: () => void;
  onGoToScanner: () => void;
  onGoToRadar: () => void;
  onGoToExpeditions: () => void;
  onOpenAuth: () => void;
}

export const HomePage: FC<HomePageProps> = ({
  user,
  theme = 'nature',
  cardsCount,
  cards = [],
  sampleCards,
  placeLabel = 'Kharghar, Navi Mumbai',
  weather = '28°C · Gentle Breeze',
  onOpenCard,
  onGoToCollection,
  onGoToScanner,
  onGoToRadar,
  onGoToExpeditions,
  onOpenAuth,
}) => {
  const handleProtectedAction = (action: () => void) => {
    soundEngine.playBeep(900, 0.04);
    action();
  };

  return (
    <div className={`home-view theme-${theme}`}>
      {/* Pokédex Hardware Console or Mobile Field Deck */}
      {theme === 'pokedex' ? (
        <div className="pokedex-handheld-chassis-shell">
          {/* Top Hardware Optic Lens */}
          <div className="chassis-hardware-top">
            <div className="hardware-optic-lens" />
            <div className="hardware-lens-status">
              <span className="status-pip pip-red" />
              <span className="status-pip pip-amber" />
            </div>
          </div>

          {/* Explorer Artwork Banner */}
          <div className="chassis-hero-banner">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
              alt="JungleDex Explorer overlooking nature valley"
            />
            <div className="chassis-brand-badge">
              <b>JungleDex</b>
              <small>FIELD TERMINAL · V2.4</small>
            </div>
          </div>

          {/* Today's Discovery Ambient Telemetry Card */}
          <div className="chassis-ambient-card">
            <div className="ambient-header-row">
              <span className="ambient-loc-pill">
                <MapPin size={12} /> {placeLabel}
              </span>
              <span className="ambient-temp-badge">
                <CloudSun size={12} /> {weather.split('·')[0].trim()}
              </span>
            </div>
            <div className="ambient-quest-hint">
              <div className="hint-icon">
                <Leaf size={16} />
              </div>
              <div className="hint-copy">
                <b>Look for Pollinators Today</b>
                <small>Common near flowering plants in sunny clearings.</small>
              </div>
            </div>
          </div>

          {/* Dual Action Buttons: Scan & Explore */}
          <div className="chassis-dual-actions">
            <button
              className="chassis-action-btn btn-scan-chassis"
              onClick={() => handleProtectedAction(onGoToScanner)}
              aria-label="Scan nature"
            >
              <Camera size={24} />
              <span className="action-title">SCAN</span>
              <span className="action-desc">Identify species</span>
            </button>

            <button
              className="chassis-action-btn btn-explore-chassis"
              onClick={() => handleProtectedAction(onGoToRadar)}
              aria-label="Explore radar"
            >
              <Radar size={24} />
              <span className="action-title">RADAR</span>
              <span className="action-desc">Nearby 5km map</span>
            </button>
          </div>

          {/* Bottom Switchgear Row */}
          <div className="chassis-switchgear-row">
            <button className="switchgear-btn" onClick={() => handleProtectedAction(onGoToCollection)}>
              <Leaf size={12} /> MY DEX
            </button>
            <button className="switchgear-btn" onClick={() => handleProtectedAction(onGoToRadar)}>
              <Compass size={12} /> RADAR
            </button>
            <button className="switchgear-btn" onClick={() => handleProtectedAction(onGoToExpeditions)}>
              <Trophy size={12} /> QUESTS
            </button>
          </div>

          {/* Bottom Bezel with Home Jewel & Speaker Slits */}
          <div className="chassis-hardware-bottom">
            <div className="bottom-speaker-slits">
              <span className="speaker-slit" />
              <span className="speaker-slit" />
              <span className="speaker-slit" />
            </div>
            <div className="chassis-home-jewel" />
            <div className="bottom-amber-lamps">
              <span className="lamp-amber" />
              <span className="lamp-amber" />
            </div>
          </div>
        </div>
      ) : (
        /* Editorial Bento Layout: Left Hero + Right Active Field Pods */
        <div className="home-editorial-bento">
          <div className="mobile-home-hero home-hero-main">
            <div className="mobile-hero-kicker">
              <span className="pulse" />
              <span>OUTDOOR EXPLORATION DECK</span>
              <span className="hero-kicker-sep">·</span>
              <span className="hero-telemetry-badge">
                <MapPin size={11} /> {placeLabel}
              </span>
              <span className="hero-telemetry-badge">
                <CloudSun size={11} /> {weather.split('·')[0].trim()}
              </span>
            </div>
            <h1 className="mobile-hero-title">
              The Living World is your <em>Pokédex.</em>
            </h1>
            <p className="mobile-hero-desc">
              Point your camera at flora, fauna, or landscape vistas. Multimodal AI identifies species, illuminates ecological taxonomy, and mints tactile holographic cards.
            </p>

            <div className="mobile-hero-actions">
              <button className="button primary" onClick={onGoToScanner}>
                <Camera size={16} /> Open Camera Scanner
              </button>
              <button className="button secondary" onClick={onGoToRadar}>
                <Radar size={16} /> Nearby Radar Map
              </button>
            </div>
          </div>

          {/* Right Column Side Hub on Desktop: Expedition + Radar Telemetry */}
          <div className="home-side-hub">
            {/* Daily Expedition Hub Card */}
            <div className="home-quest-pod" onClick={onGoToExpeditions} title="Click to view all active quests">
              <div className="quest-pod-header">
                <div className="quest-pod-badge">
                  <Footprints size={14} />
                  <span>DAILY EXPEDITION</span>
                </div>
                <span className="quest-pod-xp">+150 XP</span>
              </div>
              <div className="quest-pod-body">
                <b>Trail Scout & Wildlife Survey</b>
                <p>Walk outdoors, discover 1 new plant or insect, and level up your scout rank.</p>
              </div>
              <div className="quest-pod-footer">
                <span>View Active Quests</span>
                <ArrowRight size={13} />
              </div>
            </div>

            {/* Ambient Nature Radar Pod */}
            <div className="home-radar-hub-pod" onClick={onGoToRadar} title="Click to open 5km biodiversity radar">
              <div className="radar-hub-header">
                <div className="radar-hub-badge">
                  <Radar size={14} />
                  <span>LOCAL RADAR TELEMETRY</span>
                </div>
                <span className="radar-hub-live-dot" title="Live GPS Range" />
              </div>
              <div className="radar-hub-body">
                <b>Nearby Wildlife & Flora Hotspots</b>
                <p>Recent community observations within a 5 km walking radius.</p>
              </div>
              <div className="radar-hub-footer">
                <span>Explore Radar Map</span>
                <ArrowRight size={13} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Numbered Collection Vitrine Shelf */}
      <div className="pokedex-numbered-shelf">
        <div className="shelf-header">
          <div>
            <h4>{user ? 'My Living Dex' : 'Sample Discoveries Preview'}</h4>
            <span className="shelf-counter">
              {user
                ? (cardsCount > 0 ? `${cardsCount} specimens discovered` : '0 specimens discovered')
                : 'Guest Preview · 1 Free Scan Available'}
            </span>
          </div>
          <button className="text-button shelf-see-all" onClick={onGoToCollection}>
            Open Dex →
          </button>
        </div>

        <div className="shelf-cards-row">
          {user ? (
            cards.length > 0 ? (
              cards.slice(0, 4).map((card, i) => (
                <div
                  key={card.id}
                  className="shelf-tile"
                  onClick={() => {
                    soundEngine.playFanfare();
                    onOpenCard(card);
                  }}
                  title="Tap to inspect 3D card"
                >
                  <img className="shelf-tile-thumb" src={card.image} alt={card.name} />
                  <small>#{String(i + 1).padStart(4, '0')}</small>
                  <b>{card.name}</b>
                  <span className={`shelf-rarity-tag ${card.rarity.toLowerCase()}`}>
                    {card.rarity}
                  </span>
                </div>
              ))
            ) : (
              <div
                className="shelf-tile mystery-slot"
                onClick={onGoToScanner}
                style={{ minWidth: '220px', cursor: 'pointer' }}
                title="Launch scanner to record your first discovery"
              >
                <div className="mystery-icon-wrap">
                  <Leaf size={22} />
                </div>
                <b>No Discoveries Yet</b>
                <span className="mystery-hint">+ Launch Field Scanner</span>
              </div>
            )
          ) : (
            sampleCards.slice(0, 4).map((card, i) => (
              <div
                key={card.id}
                className="shelf-tile"
                onClick={() => {
                  soundEngine.playFanfare();
                  onOpenCard(card);
                }}
                title="Tap to preview 3D card"
              >
                <img className="shelf-tile-thumb" src={card.image} alt={card.name} />
                <small>#{String(i + 1).padStart(4, '0')}</small>
                <b>{card.name}</b>
                <span className={`shelf-rarity-tag ${card.rarity.toLowerCase()}`}>
                  {card.rarity}
                </span>
              </div>
            ))
          )}

          {/* Mystery locked slot */}
          <div
            className="shelf-tile mystery-slot"
            onClick={onGoToScanner}
            title="Scan outside to discover new species"
          >
            <div className="mystery-icon-wrap">
              <HelpCircle size={22} />
            </div>
            <span className="mystery-hint">{user ? 'Scan Wild' : 'Try Free Scan'}</span>
          </div>
        </div>
      </div>

      {/* Quick Sign-In Banner if Guest */}
      {!user && (
        <div className="guest-cloud-banner" onClick={onOpenAuth}>
          <div>
            <b>Save your collection to cloud</b>
            <small>Sign in to sync your cards across devices & track step XP.</small>
          </div>
          <button className="button light micro-btn">
            <UserPlus size={13} /> Sign In
          </button>
        </div>
      )}
    </div>
  );
};

// Aliased export for compatibility
export { HomePage as HomeView };
