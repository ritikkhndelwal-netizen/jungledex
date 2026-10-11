import type { FC } from 'react';
import { Camera, Leaf, Radar, Trophy, Sparkles, MapPin, ShieldCheck, ArrowRight, UserPlus, LogIn, CloudSun, Compass, HelpCircle } from 'lucide-react';
import { Discovery, UserProfile, ThemeType } from '../types';
import { soundEngine } from '../services/sound';

interface LandingViewProps {
  user: UserProfile | null;
  theme?: ThemeType;
  cardsCount: number;
  sampleCards: Discovery[];
  onOpenCard: (card: Discovery) => void;
  onGoToCollection: () => void;
  onGoToScanner: () => void;
  onGoToRadar: () => void;
  onGoToExpeditions: () => void;
  onOpenAuth: () => void;
}

export const LandingView: FC<LandingViewProps> = ({
  user,
  theme = 'nature',
  cardsCount,
  sampleCards,
  onOpenCard,
  onGoToCollection,
  onGoToScanner,
  onGoToRadar,
  onGoToExpeditions,
  onOpenAuth,
}) => {
  const handleProtectedAction = (action: () => void) => {
    if (!user) {
      soundEngine.playBeep(880, 0.05);
      onOpenAuth();
    } else {
      action();
    }
  };

  return (
    <div className={`landing-view theme-${theme}`}>
      {/* If theme is pokedex, render the Handheld Console Shell directly from reference board Screen 1 */}
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

          {/* Anime Explorer Artwork Banner */}
          <div className="chassis-hero-banner">
            <img
              src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80"
              alt="JungleDex Explorer overlooking nature valley"
            />
            <div className="chassis-brand-badge">
              <b>JungleDex</b>
              <small>DISCOVER · EXPLORE · COLLECT</small>
            </div>
          </div>

          {/* Today's Discovery Ambient Card */}
          <div className="chassis-ambient-card">
            <div className="ambient-header-row">
              <span className="ambient-loc-pill">
                <MapPin size={12} /> Kharghar, Navi Mumbai
              </span>
              <span className="ambient-temp-badge">
                <CloudSun size={12} /> 28°C
              </span>
            </div>
            <div className="ambient-quest-hint">
              <div className="hint-icon">
                <Leaf size={16} />
              </div>
              <div className="hint-copy">
                <b>Look for Butterflies</b>
                <small>Common near flowering plants today.</small>
              </div>
            </div>
          </div>

          {/* Dual Action Buttons: Scan & Explore */}
          <div className="chassis-dual-actions">
            <button
              className="chassis-action-btn btn-scan-chassis"
              onClick={() => handleProtectedAction(onGoToScanner)}
            >
              <Camera size={26} />
              <span className="action-title">SCAN</span>
              <span className="action-desc">Identify plant, animal or insect</span>
            </button>

            <button
              className="chassis-action-btn btn-explore-chassis"
              onClick={() => handleProtectedAction(onGoToRadar)}
            >
              <Radar size={26} />
              <span className="action-title">EXPLORE</span>
              <span className="action-desc">Find nearby discoveries</span>
            </button>
          </div>

          {/* Bottom Switchgear */}
          <div className="chassis-switchgear-row">
            <button className="switchgear-btn" onClick={() => handleProtectedAction(onGoToCollection)}>
              <Leaf size={13} /> MY DEX
            </button>
            <button className="switchgear-btn" onClick={() => handleProtectedAction(onGoToRadar)}>
              <Compass size={13} /> MAP
            </button>
            <button className="switchgear-btn" onClick={() => handleProtectedAction(onGoToExpeditions)}>
              <Trophy size={13} /> ACHIEVEMENTS
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
        /* Regular Editorial Nature / Cosmic Hero */
        <section className="hero landing-hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="pulse" /> OUTDOOR ADVENTURE MEETS COLLECTIBLE CARDS
            </div>
            <h1>
              The living world is your <em>Pokédex.</em>
            </h1>
            <p>
              Spot an unfamiliar flower, a golden sunset, or a rare butterfly.
              Snap a photo and let multimodal AI identify the species, gauge authenticity, and mint a stunning 3D collectible card.
            </p>

            <div className="landing-cta-row">
              {user ? (
                <>
                  <button
                    className="button primary hero-main-cta"
                    onClick={() => {
                      soundEngine.playBeep(1100, 0.05);
                      onGoToScanner();
                    }}
                  >
                    <Camera size={18} /> Launch Field Scanner
                  </button>

                  <button
                    className="button secondary"
                    onClick={() => {
                      soundEngine.playBeep(900, 0.05);
                      onGoToCollection();
                    }}
                  >
                    <Leaf size={18} /> Open My Dex ({cardsCount})
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="button primary hero-main-cta"
                    onClick={() => {
                      soundEngine.playBeep(1100, 0.05);
                      onOpenAuth();
                    }}
                  >
                    <UserPlus size={18} /> Start Exploring (Sign In / Join)
                  </button>

                  <a
                    className="button secondary"
                    href="#glimpse"
                    onClick={(e) => {
                      e.preventDefault();
                      soundEngine.playBeep(800, 0.04);
                      document.getElementById('glimpse')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Sparkles size={18} /> Preview Sample Cards ↓
                  </a>
                </>
              )}
            </div>

            {!user && (
              <div className="guest-pill-banner" onClick={onOpenAuth}>
                <LogIn size={14} />
                <span>
                  Already have an account? <b>Sign In to unlock your Dex & Radar →</b>
                </span>
              </div>
            )}

            <div className="hero-foot">
              <span>
                <MapPin size={14} /> GPS & Weather aware
              </span>
              <span>
                <ShieldCheck size={14} /> AI image authenticity check
              </span>
            </div>
          </div>

          {/* Hero Visual Cards Teaser */}
          <div className="landing-hero-art">
            <div className="sun-orb" />
            <div className="featured-card-stack">
              {sampleCards.slice(0, 2).map((card, idx) => (
                <div
                  key={card.id}
                  className={`teaser-card teaser-card-${idx}`}
                  onClick={() => {
                    soundEngine.playFanfare();
                    onOpenCard(card);
                  }}
                  title="Tap to preview 3D card"
                >
                  <img src={card.image} alt={card.name} />
                  <div className="teaser-card-info">
                    <span className="teaser-tag">{card.category} · {card.rarity}</span>
                    <b>{card.name}</b>
                    <small>Tap to inspect in 3D →</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Numbered Collection Shelf (Reference Screen 5) */}
      <div className="pokedex-numbered-shelf">
        <div className="shelf-header">
          <h4>My Collection Shelf</h4>
          <span className="shelf-counter">12/50 discovered</span>
        </div>
        <div className="shelf-cards-row">
          <div className="shelf-tile" onClick={() => onOpenCard(sampleCards[2])}>
            <img className="shelf-tile-thumb" src="https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=400&q=80" alt="Plain Tiger" />
            <small>#0042</small>
            <b>Plain Tiger</b>
            <span className="shelf-rarity-tag rare">Rare</span>
          </div>
          <div className="shelf-tile" onClick={() => onOpenCard(sampleCards[0])}>
            <img className="shelf-tile-thumb" src="https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=400&q=80" alt="Hibiscus" />
            <small>#0105</small>
            <b>Hibiscus</b>
            <span className="shelf-rarity-tag common">Common</span>
          </div>
          <div className="shelf-tile" onClick={() => onOpenCard(sampleCards[1])}>
            <img className="shelf-tile-thumb" src="https://images.unsplash.com/photo-1507666405895-422eee7d517f?auto=format&fit=crop&w=400&q=80" alt="Indian Palm Squirrel" />
            <small>#0031</small>
            <b>Palm Squirrel</b>
            <span className="shelf-rarity-tag common">Common</span>
          </div>
          <div className="shelf-tile" onClick={() => onOpenCard(sampleCards[2])}>
            <img className="shelf-tile-thumb" src="https://images.unsplash.com/photo-1549608276-5786777e6587?auto=format&fit=crop&w=400&q=80" alt="Red-whiskered Bulbul" />
            <small>#0068</small>
            <b>Bulbul</b>
            <span className="shelf-rarity-tag uncommon">Uncommon</span>
          </div>
          <div className="shelf-tile mystery-slot" onClick={() => handleProtectedAction(onGoToScanner)}>
            <div className="mystery-icon-wrap">
              <HelpCircle size={24} />
            </div>
            <span className="mystery-hint">Discover in Wild</span>
          </div>
        </div>
      </div>

      {/* Interactive Glimpse / Sample Card Inspection */}
      <section className="section glimpse-section" id="glimpse">
        <div className="section-heading">
          <div>
            <div className="eyebrow">TASTE THE MAGIC</div>
            <h2>Interactive Specimen Showcase</h2>
            <p>Tap any card below to experience the 3D holographic tilt, audio cues, and taxonomic notes.</p>
          </div>
        </div>

        <div className="glimpse-cards-grid">
          {sampleCards.map((card) => (
            <button
              key={card.id}
              className="glimpse-card-btn"
              onClick={() => {
                soundEngine.playFanfare();
                onOpenCard(card);
              }}
            >
              <div className="glimpse-thumb-wrap">
                <img src={card.image} alt={card.name} />
                <span className="glimpse-rarity-pill">
                  <Sparkles size={10} /> {card.rarity}
                </span>
              </div>
              <div className="glimpse-card-meta">
                <span className="glimpse-cat">{card.category}</span>
                <b>{card.name}</b>
                <small>{card.scientificName}</small>
                <div className="glimpse-action">
                  <span>Inspect Card</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* How JungleDex Works */}
      <section className="section how-it-works-section">
        <div className="section-heading centered">
          <div className="eyebrow">THE FIELD LOOP</div>
          <h2>How JungleDex Works</h2>
          <p>Designed for smartphones. Built for real-world exploration.</p>
        </div>

        <div className="steps-bento">
          <div className="step-card" onClick={() => handleProtectedAction(onGoToScanner)}>
            <div className="step-number">01</div>
            <div className="step-icon">
              <Camera size={26} />
            </div>
            <h3>1. Spot & Snap</h3>
            <p>Point your phone camera at trees, mushrooms, scenic sunsets, waterfalls, or garden insects while walking outside.</p>
          </div>

          <div className="step-card" onClick={() => handleProtectedAction(onGoToCollection)}>
            <div className="step-number">02</div>
            <div className="step-icon">
              <Sparkles size={26} />
            </div>
            <h3>2. AI Identification & Mint</h3>
            <p>Multimodal vision confirms the specimen, generates ecological facts, checks AI authenticity, and mints your holographic card.</p>
          </div>

          <div className="step-card" onClick={() => handleProtectedAction(onGoToExpeditions)}>
            <div className="step-number">03</div>
            <div className="step-icon">
              <Trophy size={26} />
            </div>
            <h3>3. Track Steps & Level Up</h3>
            <p>Accumulate walking distance, complete daily field expeditions, unlock collector badges, and grow your nature Dex.</p>
          </div>
        </div>
      </section>

      {/* App Features Quick Launch Bar */}
      <section className="section features-preview-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">DEDICATED APP HUBS</div>
            <h2>Explore Dedicated Systems</h2>
            <p>Create an account to unlock all handheld field systems.</p>
          </div>
        </div>

        <div className="feature-hubs-grid">
          <div className="hub-card" onClick={() => handleProtectedAction(onGoToCollection)}>
            <div className="hub-header">
              <div className="hub-icon green">
                <Leaf size={22} />
              </div>
              <span className="hub-badge">{user ? `${cardsCount} Cards` : 'Members Only'}</span>
            </div>
            <h3>Card Collection Dex</h3>
            <p>Your tactile mobile gallery. Browse cards in high-density grids, filter by taxonomy, and inspect 3D cards anytime.</p>
            <span className="hub-link">{user ? 'Open Collection →' : 'Sign in to unlock →'}</span>
          </div>

          <div className="hub-card" onClick={() => handleProtectedAction(onGoToRadar)}>
            <div className="hub-header">
              <div className="hub-icon teal">
                <Radar size={22} />
              </div>
              <span className="hub-badge">5km Radius</span>
            </div>
            <h3>Nearby Nature Radar</h3>
            <p>Scan real-time biodiversity sightings around you powered by the iNaturalist open network. Pick targets and track distance.</p>
            <span className="hub-link">{user ? 'Launch Radar →' : 'Sign in to unlock →'}</span>
          </div>

          <div className="hub-card" onClick={() => handleProtectedAction(onGoToExpeditions)}>
            <div className="hub-header">
              <div className="hub-icon amber">
                <Trophy size={22} />
              </div>
              <span className="hub-badge">XP & Quests</span>
            </div>
            <h3>Expeditions & Step Tracker</h3>
            <p>Track your real-world walking strides and distance via GPS. Complete daily missions to unlock Scout badges and rank up.</p>
            <span className="hub-link">{user ? 'View Expeditions →' : 'Sign in to unlock →'}</span>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="closing-cta">
        <div className="closing-icon">
          <Leaf size={25} />
        </div>
        <div>
          <div className="eyebrow">THE LIVING WORLD IS WAITING</div>
          <h2>Less scrolling. More wondering.</h2>
          <p>Step outside today. Turn your local trail or garden into your personal natural history collection.</p>
        </div>
        <div className="closing-actions">
          {user ? (
            <button className="button light" onClick={onGoToScanner}>
              <Camera size={17} /> Start Exploring Now
            </button>
          ) : (
            <button className="button light" onClick={onOpenAuth}>
              <UserPlus size={17} /> Join as Explorer (Free)
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
