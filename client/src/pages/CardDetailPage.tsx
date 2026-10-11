import { useRef, useState, type FC, type MouseEvent } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Check,
  Sparkles,
  MapPin,
  CloudSun,
  Calendar,
  Bot,
  Trash2,
  UserPlus,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Discovery, UserProfile } from '../types';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { soundEngine } from '../services/sound';
import { shareCardToApi } from '../services/api';
import { shareCardToFirestore } from '../services/firebase';

interface CardDetailPageProps {
  card: Discovery;
  cardIndex: number;
  totalCards: number;
  user: UserProfile | null;
  onBack: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  onDeleteCard?: (id: string, e: MouseEvent) => void;
  onToast: (msg: string) => void;
  onOpenAuth: () => void;
}

export const CardDetailPage: FC<CardDetailPageProps> = ({
  card,
  cardIndex,
  totalCards,
  user,
  onBack,
  onNavigatePrev,
  onNavigateNext,
  onDeleteCard,
  onToast,
  onOpenAuth,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportCard = async () => {
    if (!cardRef.current) return;
    soundEngine.playBeep(1200, 0.05);
    setExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2.5,
        skipFonts: false,
      });
      const a = document.createElement('a');
      a.download = `jungledex-${card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      a.href = dataUrl;
      a.click();
      onToast('Specimen card exported as high-res PNG image!');
    } catch (err) {
      console.error('[Export Error]:', err);
      onToast('Could not generate export. You can take a screenshot of your card.');
    } finally {
      setExporting(false);
    }
  };

  const publishCardForSharing = async (cardToShare: Discovery) => {
    await Promise.allSettled([
      shareCardToApi(cardToShare),
      shareCardToFirestore(cardToShare),
    ]);
  };

  const getCardShareImage = async (): Promise<{ file: File; blob: Blob } | null> => {
    // 1. Try high-res rendered holographic specimen card PNG
    if (cardRef.current) {
      try {
        const dataUrl = await toPng(cardRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          skipFonts: false,
        });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const cleanName = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return { file: new File([blob], `jungledex-${cleanName}.png`, { type: 'image/png' }), blob };
      } catch (e) {
        console.warn('[Card Render Share Fallback]:', e);
      }
    }

    // 2. Fallback to raw card.image photo
    try {
      const res = await fetch(card.image);
      const blob = await res.blob();
      const cleanName = card.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const type = blob.type || 'image/jpeg';
      const ext = type.includes('png') ? 'png' : 'jpg';
      return { file: new File([blob], `jungledex-${cleanName}.${ext}`, { type }), blob };
    } catch (e) {
      console.warn('[Card Image Fallback Error]:', e);
    }
    return null;
  };

  const shareToWhatsApp = async () => {
    soundEngine.playBeep(950, 0.04);
    setSharing(true);
    onToast('Preparing card image and WhatsApp link…');
    try {
      // Ensure card is accessible to recipient via cloud/server
      await publishCardForSharing(card);

      const cardUrl = `${window.location.origin}${window.location.pathname}#/card/${card.id}`;
      const message = `🌿 *${card.name}* (${card.category}) — JungleDex Field Discovery\n\n"${card.description}"\n\n🔍 *View full specimen card & interactive 3D hologram:*\n${cardUrl}`;

      const imageResult = await getCardShareImage();

      // Mobile share sheet with file attached:
      if (imageResult && navigator.canShare && navigator.canShare({ files: [imageResult.file] })) {
        await navigator.share({
          title: `JungleDex: ${card.name}`,
          text: message,
          url: cardUrl,
          files: [imageResult.file],
        });
        onToast('Shared to WhatsApp with card image and link!');
        return;
      }

      // Desktop fallback: copy image to clipboard so user can paste it right into WhatsApp
      if (imageResult && navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [imageResult.blob.type]: imageResult.blob }),
          ]);
        } catch {
          // Ignore clipboard permission issue
        }
      }

      // Open WhatsApp click-to-chat
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      onToast('Opening WhatsApp! Card image copied to clipboard — press Ctrl+V to attach it!');
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('[WhatsApp Share Error]:', err);
        onToast('Could not share to WhatsApp.');
      }
    } finally {
      setSharing(false);
    }
  };

  const shareCard = async () => {
    soundEngine.playBeep(950, 0.04);
    setSharing(true);
    onToast('Preparing card image and shareable link…');
    try {
      await publishCardForSharing(card);

      const cardUrl = `${window.location.origin}${window.location.pathname}#/card/${card.id}`;
      const text = `🌿 Discovered "${card.name}" (${card.category}) on JungleDex!\n\n${card.description}\n\n🔍 View Specimen Card:\n${cardUrl}`;

      const imageResult = await getCardShareImage();

      if (imageResult && navigator.canShare && navigator.canShare({ files: [imageResult.file] })) {
        await navigator.share({
          title: `My JungleDex Discovery: ${card.name}`,
          text,
          url: cardUrl,
          files: [imageResult.file],
        });
        onToast('Card image, description, and link shared!');
        return;
      }

      if (navigator.share) {
        await navigator.share({
          title: `My JungleDex Discovery: ${card.name}`,
          text,
          url: cardUrl,
        });
        onToast('Observation caption and link shared!');
        return;
      }

      // Desktop / unsupported: copy caption and link
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onToast('Observation link and caption copied to clipboard!');
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        console.warn('[Share Error]:', err);
        const cardUrl = `${window.location.origin}${window.location.pathname}#/card/${card.id}`;
        navigator.clipboard.writeText(`${card.name} — ${cardUrl}`);
        onToast('Card link copied to clipboard!');
      }
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = (e: MouseEvent) => {
    if (onDeleteCard) {
      onDeleteCard(card.id, e);
    }
  };

  return (
    <div className="card-detail-page">
      {/* Top Navigation Bar */}
      <div className="card-detail-nav">
        <button
          className="detail-back-btn"
          onClick={() => {
            soundEngine.playBeep(850, 0.04);
            onBack();
          }}
          aria-label="Back to Dex"
        >
          <ArrowLeft size={18} />
          <span>Back to Dex</span>
        </button>

        <div className="detail-pager">
          <span className="pager-indicator">
            #{String(cardIndex).padStart(4, '0')} {totalCards > 1 && `(${cardIndex}/${totalCards})`}
          </span>

          <div className="pager-arrows">
            <button
              className="pager-arrow-btn"
              onClick={() => {
                soundEngine.playBeep(880, 0.03);
                onNavigatePrev?.();
              }}
              disabled={!onNavigatePrev}
              aria-label="Previous card"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="pager-arrow-btn"
              onClick={() => {
                soundEngine.playBeep(980, 0.03);
                onNavigateNext?.();
              }}
              disabled={!onNavigateNext}
              aria-label="Next card"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="card-detail-layout">
        {/* Holographic Card Stage */}
        <div className="card-stage-container">
          <div className="card-stage-wrapper">
            <DiscoveryCard ref={cardRef} card={card} cardIndex={cardIndex} />
          </div>
          <span className="stage-holo-hint">
            <Sparkles size={12} /> Tilt device or cursor to illuminate holographic foil
          </span>
        </div>

        {/* Specimen Dossier & Actions */}
        <div className="specimen-dossier-panel">
          <div className="dossier-header">
            <div className="dossier-badges">
              <span className={`dossier-rarity-chip rarity-${card.rarity.toLowerCase()}`}>
                <Sparkles size={11} /> {card.rarity}
              </span>
              <span className="dossier-category-chip">{card.category}</span>
              {card.isAiGenerated && (
                <span className="dossier-ai-chip">
                  <Bot size={11} /> AI Visual
                </span>
              )}
            </div>

            <h1 className="dossier-title">{card.name}</h1>
            {card.scientificName && (
              <span className="dossier-scientific-name">{card.scientificName}</span>
            )}
          </div>

          <div className="dossier-description-card">
            <p>{card.description}</p>
            {card.modelUsed && (
              <small className="dossier-model-tag">
                <ShieldCheck size={11} /> Multimodal validation via {card.modelUsed}
              </small>
            )}
          </div>

          {/* Quick Facts Pod */}
          {card.facts && card.facts.length > 0 && (
            <div className="dossier-facts-section">
              <h3 className="facts-heading">Field Notes & Facts</h3>
              <ul className="dossier-facts-list">
                {card.facts.map((fact, i) => (
                  <li key={i}>{fact}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Environmental Telemetry */}
          <div className="dossier-telemetry-grid">
            {card.location && (
              <div className="telemetry-item">
                <MapPin size={14} />
                <div>
                  <small>OBSERVATION LOCATION</small>
                  <b>{card.location}</b>
                </div>
              </div>
            )}

            {card.weather && (
              <div className="telemetry-item">
                <CloudSun size={14} />
                <div>
                  <small>WEATHER & AMBIENT</small>
                  <b>{card.weather}</b>
                </div>
              </div>
            )}

            {card.date && (
              <div className="telemetry-item">
                <Calendar size={14} />
                <div>
                  <small>RECORDED TIMESTAMP</small>
                  <b>{card.date}</b>
                </div>
              </div>
            )}
          </div>

          {/* Action Button Deck */}
          <div className="dossier-actions-deck">
            {/* Direct WhatsApp Share: attaches card image + description + link */}
            <button
              className="button whatsapp-share-btn full"
              onClick={shareToWhatsApp}
              disabled={sharing}
            >
              <MessageCircle size={16} /> {sharing ? 'Preparing Share…' : 'Share to WhatsApp (Card & Link)'}
            </button>

            {/* General Share: uses native share sheet with file on mobile or clipboard */}
            <button
              className="button secondary full"
              onClick={shareCard}
              disabled={sharing}
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              {copied ? 'Link & Caption Copied!' : 'Share Discovery (Other Apps)'}
            </button>

            <button
              className="button ghost full"
              onClick={exportCard}
              disabled={exporting}
            >
              <Download size={16} />
              {exporting ? 'Generating PNG…' : 'Download High-Res PNG Card'}
            </button>

            {onDeleteCard && !card.id.startsWith('sample-') && (
              <button
                className="button ghost full delete-specimen-btn"
                onClick={handleDelete}
              >
                <Trash2 size={15} /> Remove from Collection
              </button>
            )}
          </div>

          {/* Cloud Sync Soft-Gate Banner if guest */}
          {!user && (
            <div className="guest-card-sync-banner" onClick={onOpenAuth}>
              <div>
                <b>Backup this specimen to cloud</b>
                <small>Create your free Explorer ID to sync across devices & level up.</small>
              </div>
              <button className="button light micro-btn">
                <UserPlus size={12} /> Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Aliased export for compatibility
export { CardDetailPage as CardDetailView };
