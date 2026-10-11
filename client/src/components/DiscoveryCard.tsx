import { forwardRef, useState, type MouseEvent } from 'react';
import { MapPin, Sparkles, Bot, AlertTriangle, Compass, Ruler, Calendar } from 'lucide-react';
import { Discovery } from '../types';

interface DiscoveryCardProps {
  card: Discovery;
  cardIndex?: number;
  interactiveHolo?: boolean;
}

export const DiscoveryCard = forwardRef<HTMLDivElement, DiscoveryCardProps>(
  ({ card, cardIndex = 1, interactiveHolo = true }, ref) => {
    const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50 });
    const isRare = ['Rare', 'Epic', 'Legendary'].includes(card.rarity);
    const isScenic = ['Landscape/Vista', 'Waterscape', 'Garden/Sanctuary'].some((c) =>
      card.category.includes(c)
    );

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
      if (!interactiveHolo) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      const rx = ((y - rect.height / 2) / (rect.height / 2)) * -10;
      const ry = ((x - rect.width / 2) / (rect.width / 2)) * 10;
      setTilt({ rx, ry, px, py });
    };

    const handleMouseLeave = () => {
      setTilt({ rx: 0, ry: 0, px: 50, py: 50 });
    };

    return (
      <div
        className={`collectible-card-container ${isRare || isScenic ? 'holo-card' : ''} rarity-${card.rarity.toLowerCase()}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        }}
      >
        <div className="collectible-card" ref={ref}>
          {/* Holographic Iridescent Sheen Layer */}
          {(isRare || isScenic) && (
            <div
              className="holo-sheen"
              style={{
                background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.45) 0%, rgba(255,0,128,0.18) 25%, rgba(0,255,255,0.18) 50%, rgba(255,255,0,0.18) 75%, transparent 100%)`,
              }}
            />
          )}

          <div className="card-topline">
            <span>JUNGLEDEX / FIELD RECORD</span>
            <span>#{String(cardIndex).padStart(4, '0')}</span>
          </div>

          <div className="card-image-wrap">
            <img
              className="card-image"
              src={card.image}
              alt={card.name}
              crossOrigin="anonymous"
            />
            {card.isAiGenerated && (
              <div className="ai-warning-banner" title={card.aiGenerationReason || 'AI generated'}>
                <Bot size={13} />
                <span>AI-GENERATED VISUAL</span>
              </div>
            )}
          </div>

          <div className="card-content">
            <div className="card-meta">
              <span className="card-category-badge">{card.category}</span>
              <span className={`rarity rarity-${card.rarity.toLowerCase()}`}>
                <Sparkles size={11} /> {card.rarity}
              </span>
            </div>

            <h3>{card.name}</h3>
            {card.scientificName && (
              <i className="scientific">{card.scientificName}</i>
            )}

            {/* 2x2 Key Attributes Bento Grid (Reference Screen 3) */}
            <div className="pokedex-attributes-bento">
              <div className="attribute-cell">
                <small className="attr-label">
                  <Ruler size={10} /> Length / Scale
                </small>
                <b>
                  {card.category.includes('Insect')
                    ? '70–80 mm'
                    : card.category.includes('Bird')
                    ? '35–45 cm'
                    : card.category.includes('Flora')
                    ? '15–30 cm'
                    : 'Panoramic Vista'}
                </b>
              </div>
              <div className="attribute-cell">
                <small className="attr-label">
                  <Sparkles size={10} /> Rarity Class
                </small>
                <b>{card.rarity}</b>
              </div>
              <div className="attribute-cell">
                <small className="attr-label">
                  <Compass size={10} /> Habitat
                </small>
                <b>{card.location ? card.location.split(',')[0] : 'Gardens & Wilds'}</b>
              </div>
              <div className="attribute-cell">
                <small className="attr-label">
                  <Calendar size={10} /> Peak Season
                </small>
                <b>Mar – Nov</b>
              </div>
            </div>

            <p>{card.description}</p>

            {card.facts && card.facts.length > 0 && (
              <div className="specimen-fun-facts">
                <h5>
                  <Sparkles size={12} /> Specimen Field Notes
                </h5>
                <ul>
                  {card.facts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {card.isAiGenerated && card.aiGenerationReason && (
              <div className="ai-notice-box">
                <AlertTriangle size={13} />
                <small><b>Authenticity Note:</b> {card.aiGenerationReason}</small>
              </div>
            )}

            <div className="card-location">
              <MapPin size={14} />
              <span>
                {card.location || 'Location kept private'}
                {card.weather ? ` · ${card.weather}` : ''}
              </span>
            </div>

            <div className="card-bottom">
              <span>{card.date}</span>
              <span className="card-status-archive">ARCHIVE SPECIMEN</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DiscoveryCard.displayName = 'DiscoveryCard';
