import { useState, type FC, type MouseEvent } from 'react';
import { Camera, Leaf, Search, Trash2, Bot, Sparkles } from 'lucide-react';
import { Discovery } from '../types';
import { TaxonomyBar } from './TaxonomyBar';
import { soundEngine } from '../services/sound';

interface CollectionGridProps {
  cards: Discovery[];
  onSelectCard: (card: Discovery) => void;
  onDeleteCard: (id: string, e: MouseEvent) => void;
  onTriggerIdentify: () => void;
}

const sampleCards: Discovery[] = [
  {
    id: 'sample-sunset',
    name: 'Sunset over Coastal Ridge',
    scientificName: 'Rayleigh Atmospheric Scattering',
    category: 'Landscape/Vista',
    rarity: 'Epic',
    confidence: 'High',
    description: 'A breathtaking golden sunset illuminating the horizon with vivid amber and crimson hues.',
    facts: [
      'Atmospheric Rayleigh scattering scatters short blue wavelengths, letting deep oranges and reds reach the eye.',
      'Sunsets often indicate high pressure systems and clearer weather.',
      'Observing natural horizons reduces eye strain and calms the nervous system.',
    ],
    image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1000&q=85',
    date: 'Sample Field Note',
    location: 'Coastal Ridge Lookout',
    theme: 'nature',
  },
  {
    id: 'sample-waterfall',
    name: 'Mossy Cascades Waterfall',
    scientificName: 'Hydrological Chute Cascade',
    category: 'Waterscape',
    rarity: 'Rare',
    confidence: 'High',
    description: 'A pure mountain stream plunging over volcanic basalt rocks lined with ancient ferns and mosses.',
    facts: [
      'Waterfalls generate high concentrations of negative air ions, which invigorate surrounding vegetation.',
      'Lush microclimates near waterfalls support rare bryophytes and salamanders.',
      'Observe mist spray patterns to gauge stream velocity and volume.',
    ],
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1000&q=85',
    date: 'Sample Field Note',
    location: 'Mountain Gorge Trail',
    theme: 'nature',
  },
  {
    id: 'sample-pansy',
    name: 'Peacock Pansy',
    scientificName: 'Junonia almana',
    category: 'Insect',
    rarity: 'Uncommon',
    confidence: 'High',
    description: 'A striking butterfly known for its bold eye-like wing markings. Look closely, observe gently, and let it continue on its way.',
    facts: [
      'Often seen in sunny, open grasslands.',
      'Its eye patterns help deter potential predators.',
      'Observe from a distance; never handle wildlife.',
    ],
    image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&q=85',
    date: 'Sample Field Note',
    location: 'Open Meadows',
    theme: 'nature',
  },
];

export const CollectionGrid: FC<CollectionGridProps> = ({
  cards,
  onSelectCard,
  onDeleteCard,
  onTriggerIdentify,
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

  return (
    <section className="section collection-section" id="collection">
      <div className="section-heading">
        <div>
          <div className="eyebrow">FIELD KIT / 03</div>
          <h2>
            Your field collection <span className="heading-count">{cards.length}</span>
          </h2>
          <p>Every card is a permanent, collectible reminder of the living world.</p>
        </div>

        <label className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search discoveries…"
            aria-label="Search discoveries"
          />
        </label>
      </div>

      {/* Category Deep-Dive Taxonomy Bar */}
      <TaxonomyBar
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          soundEngine.playBeep(920, 0.04);
          setSelectedCategory(cat);
        }}
        cards={cards}
      />

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-symbol">
            <Leaf size={34} />
          </div>
          <h3>Your field journal is waiting.</h3>
          <p>
            Your discoveries will appear here. Start by snapping a photo of any sunset, waterfall, flower, or creature outside!
          </p>
          <button
            className="button secondary"
            onClick={() => {
              soundEngine.playBeep();
              onTriggerIdentify();
            }}
          >
            <Camera size={17} /> Make your first discovery
          </button>

          <div className="sample-label">EXAMPLE DISCOVERY CARDS (CLICK TO PREVIEW)</div>
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
                  {card.rarity} · Preview style →
                </small>
              </button>
            ))}
          </div>
        </div>
      ) : filteredCards.length === 0 ? (
        <div className="empty-state compact">
          <p>No discoveries match “{query}” in category “{selectedCategory}”.</p>
          <button
            className="text-button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('All');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="collection-grid">
          {filteredCards.map((card) => (
            <div
              className={`collection-card-wrapper rarity-${card.rarity.toLowerCase()}`}
              key={card.id}
              onClick={() => {
                soundEngine.playBeep(850, 0.05);
                onSelectCard(card);
              }}
            >
              <div className="collection-card">
                <div className="card-thumb-wrap">
                  <img src={card.image} alt={card.name} />
                  {card.isAiGenerated && (
                    <span className="card-ai-badge" title="AI Generated">
                      <Bot size={11} /> AI
                    </span>
                  )}
                </div>
                <span className="collection-category">
                  {card.category} <i>· {card.rarity}</i>
                </span>
                <b>{card.name}</b>
                <small>
                  {card.location || 'Location private'} · {card.date}
                </small>
                <button
                  className="card-delete-btn"
                  title="Remove card"
                  onClick={(e) => onDeleteCard(card.id, e)}
                  aria-label={`Delete ${card.name}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
