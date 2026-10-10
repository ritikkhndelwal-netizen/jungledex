import { useRef, useState, type FC } from 'react';
import { Download, Share2, Sparkles, X, Check, UserPlus } from 'lucide-react';
import { toPng } from 'html-to-image';
import { Discovery, UserProfile } from '../types';
import { DiscoveryCard } from './DiscoveryCard';

interface ResultModalProps {
  selectedCard: Discovery;
  cardIndex: number;
  user?: UserProfile | null;
  onClose: () => void;
  onViewCollection: () => void;
  onToast: (msg: string) => void;
  onOpenAuth?: () => void;
}

export const ResultModal: FC<ResultModalProps> = ({
  selectedCard,
  cardIndex,
  user,
  onClose,
  onViewCollection,
  onToast,
  onOpenAuth,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportCard = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        skipFonts: false,
      });
      const a = document.createElement('a');
      a.download = `jungledex-${selectedCard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      a.href = dataUrl;
      a.click();
      onToast('Card exported as high-res PNG image!');
    } catch (err) {
      console.error('[Export Error]:', err);
      onToast('Could not export image. You can take a screenshot of your card.');
    } finally {
      setExporting(false);
    }
  };

  const shareCard = async () => {
    const text = `🌿 Discovered "${selectedCard.name}" (${selectedCard.category}) with JungleDex!\n${selectedCard.description}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `My JungleDex Discovery: ${selectedCard.name}`,
          text,
        });
      } catch {
        // user dismissed share sheet
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        onToast('Observation caption copied to clipboard!');
      } catch {
        onToast('Share not supported on this browser.');
      }
    }
  };

  return (
    <section className="section result-section">
      <div className="section-heading">
        <div>
          <div className="eyebrow">FIELD SPECIMEN INSPECTOR</div>
          <h2>Collectible Discovery Card</h2>
          <p>Tilt your cursor or device to inspect holographic foil and taxonomic notes.</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close card">
          <X size={18} />
        </button>
      </div>

      <div className="result-layout">
        <DiscoveryCard ref={cardRef} card={selectedCard} cardIndex={cardIndex} />

        <div className="result-actions">
          <span className="success-kicker">
            <Sparkles size={17} /> SPECIMEN IDENTIFIED
          </span>
          <h3>{selectedCard.name}</h3>
          <p>
            {selectedCard.description}
            {selectedCard.modelUsed && (
              <small style={{ display: 'block', marginTop: '8px', opacity: 0.8 }}>
                Identified via {selectedCard.modelUsed}
              </small>
            )}
          </p>

          <button
            className="button primary full"
            onClick={exportCard}
            disabled={exporting}
          >
            <Download size={17} />
            {exporting ? 'Generating PNG…' : 'Export card as PNG'}
          </button>

          <button className="button secondary full" onClick={shareCard}>
            {copied ? <Check size={17} /> : <Share2 size={17} />}
            {copied ? 'Caption Copied!' : 'Share discovery'}
          </button>

          {/* Soft-Gate Freemium Hook for Guest Explorers */}
          {!user && onOpenAuth && (
            <div className="card-softgate-box" onClick={onOpenAuth}>
              <div className="softgate-icon">
                <Sparkles size={16} />
              </div>
              <div className="softgate-text">
                <b>Save to Cloud Dex & Earn +150 XP</b>
                <small>Create your free Explorer ID to sync across devices.</small>
              </div>
              <button className="button secondary micro-btn">
                <UserPlus size={12} /> Sign In
              </button>
            </div>
          )}

          <button className="text-button" onClick={onViewCollection}>
            View full field collection →
          </button>
        </div>
      </div>
    </section>
  );
};
