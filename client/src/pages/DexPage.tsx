import { useState, type FC, type MouseEvent } from 'react';
import { Camera, Leaf, Search, Trash2, Bot, Sparkles, UserPlus, Cloud, CheckCircle2, HelpCircle } from 'lucide-react';
import { Discovery, UserProfile } from '../types';
import { TaxonomyBar } from '../components/TaxonomyBar';
import { soundEngine } from '../services/sound';

interface DexPageProps {
  cards: Discovery[];
  sampleCards: Discovery[];
  user: UserProfile | null;
  onSelectCard: (card: Discovery) => void;
  onDeleteCard: (id: string, e: MouseEvent) => void;
  onGoToScanner: () => void;
  onOpenAuth: () => void;
}

export const DexPage: FC<DexPageProps> = ({
  cards,
  sampleCards,
  user,
  onSelectCard,
  onDeleteCard,
  onGoToScanner,
  onOpenAuth,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredCards = cards.filter((card) => {
    const matchesQuery = `${card.name} ${card.category} ${card.scientificName || ''} ${card.description}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      card.category.toLowerCase().includes(selectedCategory.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  const holoCount = cards.filter(
    (c) => c.rarity.toLowerCase() === 'legendary' || c.rarity.toLowerCase() === 'epic'
  ).length;

  return (
    <div className="collection-page-view">
      {/* Dex Header */}
      <div className="dex-page-header">
        <div className="dex-title-block">
          <div className="eyebrow">
            <span className="pulse" /> ARCHIVED SPECIMENS
          </div>
          <h1>My Field Dex</h1>
          <p className="dex-subtitle">Your personal catalog of the living world.</p>
        </div>

        <div className="dex-header-actions">
          <div className="dex-stats-pill">
            <span className="stat-num">{cards.length}</span>
            <span className="stat-label">Collected</span>
            {holoCount > 0 && (
              <span className="holo-pill">
                <Sparkles size={11} /> {holoCount} Holo
              </span>
            )}
          </div>

          <button
            className="button primary compact-action-btn"
            onClick={() => {
              soundEngine.playBeep(1100, 0.04);
              onGoToScanner();
            }}
          >
            <Camera size={15} /> + Add Find
          </button>
        </div>
      </div>

      {/* Cloud Sync Status Banner / Soft Gate */}
      <div className="dex-sync-banner">
        {user ? (
          <div className="sync-status active">
            <CheckCircle2 size={15} />
            <span>Cloud Sync Active for <b>{user.displayName || user.email || 'Explorer'}</b></span>
          </div>
        ) : (
          <div className="sync-status guest" onClick={onOpenAuth}>
            <Cloud size={15} />
            <span>
              <b>Saved to local device.</b> Sign in to backup your {cards.length} cards to cloud & level up →
            </span>
            <button className="button secondary micro-btn">
              <UserPlus size={12} /> Sign In
            </button>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="dex-filter-row">
        <label className="search-box dex-search">
          <Search size={14} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search specimen by common or Latin name…"
            aria-label="Search collection"
          />
        </label>
      </div>

      {/* Taxonomy Category Filter Bar */}
      <TaxonomyBar
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        cards={cards}
      />

      {/* Cards Grid */}
      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-symbol">
            <Leaf size={32} />
          </div>
          <h3>Field Dex is Ready</h3>
          <p>
            You haven't recorded any flora, fauna, or landscape discoveries yet. Launch the field scanner to register your first specimen!
          </p>
          <button
            className="button primary"
            onClick={() => {
              soundEngine.playBeep(1100, 0.05);
              onGoToScanner();
            }}
          >
            <Camera size={18} /> Launch Field Scanner
          </button>

          {/* Sample preview cards so the screen looks vibrant */}
          <div className="sample-label">OR TAP A SAMPLE SPECIMEN TO PREVIEW 3D CARD:</div>
          <div className="sample-grid">
            {sampleCards.map((card) => (
              <button
                className="sample-card"
                key={card.id}
                onClick={() => {
                  soundEngine.playFanfare();
                  onSelectCard(card);
                }}
              >
                <img src={card.image} alt={card.name} />
                <span>{card.category}</span>
                <b>{card.name}</b>
                <small>
                  <Sparkles size={9} style={{ display: 'inline', marginRight: '4px' }} />
                  {card.rarity} · Preview in 3D →
                </small>
              </button>
            ))}
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="empty-state compact">
          <p>No discoveries found matching “{query}” in category “{selectedCategory}”.</p>
          <button
            className="text-button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('All');
            }}
          >
            Clear search filters
          </button>
        </div>
      ) : (
        <div className="mobile-dex-grid">
          {filteredCards.map((card, idx) => (
            <div
              className={`dex-card-item rarity-${card.rarity.toLowerCase()}`}
              key={card.id}
              onClick={() => {
                soundEngine.playBeep(850, 0.05);
                onSelectCard(card);
              }}
              title="Tap to inspect full 3D card"
            >
              <div className="dex-card-inner">
                <div className="dex-thumb-container">
                  <img src={card.image} alt={card.name} loading="lazy" />
                  <span className="dex-card-idx">#{String(idx + 1).padStart(3, '0')}</span>
                  {card.isAiGenerated && (
                    <span className="card-ai-badge" title="AI-Generated">
                      <Bot size={10} /> AI
                    </span>
                  )}
                  <span className="dex-rarity-chip">
                    <Sparkles size={9} /> {card.rarity}
                  </span>
                </div>

                <div className="dex-card-body">
                  <span className="dex-cat-label">{card.category}</span>
                  <h3 className="dex-specimen-name">{card.name}</h3>
                  <p className="dex-sci-name">{card.scientificName || 'Unconfirmed'}</p>

                  <div className="dex-card-footer">
                    <small>{card.date}</small>
                    <button
                      className="card-delete-btn"
                      title="Remove card"
                      onClick={(e) => onDeleteCard(card.id, e)}
                      aria-label={`Delete ${card.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Locked Mystery Specimen Card Slot (Reference Screen 5) */}
          <div
            className="dex-card-item mystery-slot-card"
            onClick={() => {
              soundEngine.playBeep(900, 0.04);
              onGoToScanner();
            }}
            title="Launch scanner to discover new species"
          >
            <div className="dex-card-inner mystery-card-inner">
              <div className="mystery-badge-ring">
                <HelpCircle size={28} />
              </div>
              <b className="mystery-card-title">Undiscovered Specimen</b>
              <small className="mystery-card-action">+ Tap to scan in nature</small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Aliased export for compatibility
export { DexPage as CollectionDexView };
