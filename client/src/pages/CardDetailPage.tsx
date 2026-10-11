import { useRef, useState, useEffect, type FC, type MouseEvent } from 'react';
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
  Send,
  Leaf,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { Discovery, UserProfile } from '../types';
import { DiscoveryCard } from '../components/DiscoveryCard';
import { soundEngine } from '../services/sound';
import { shareCardToApi, askNaturalistChat, type ChatMessage } from '../services/api';
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

  // Field Naturalist Companion State (Option 1)
  const [naturalistOpen, setNaturalistOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      text: `Greetings explorer! 🌿 I am your JungleDex Field Naturalist Guide powered by Google Gemma. What would you like to discover about ${card.name}? Ask me for seasonal spotting windows, identification cues, or dangerous lookalikes!`,
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [chatModel, setChatModel] = useState<'gemma-4-26b-a4b-it' | 'gemini-3.5-flash'>('gemma-4-26b-a4b-it');
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (naturalistOpen && chatMessages.length > 1) {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, naturalistOpen]);

  // Reset conversation on card switch
  useEffect(() => {
    setChatMessages([
      {
        role: 'model',
        text: `Greetings explorer! 🌿 I am your JungleDex Field Naturalist Guide powered by Google Gemma. What would you like to discover about ${card.name}? Ask me for seasonal spotting windows, identification cues, or dangerous lookalikes!`,
      },
    ]);
    setInputQuery('');
  }, [card.id]);

  const handleSendNaturalistMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || chatBusy) return;

    setInputQuery('');
    soundEngine.playBeep(980, 0.03);

    const updatedHistory: ChatMessage[] = [...chatMessages, { role: 'user', text: query }];
    setChatMessages(updatedHistory);
    setChatBusy(true);

    try {
      const res = await askNaturalistChat({
        specimenName: card.name,
        category: card.category,
        scientificName: card.scientificName,
        description: card.description,
        message: query,
        history: updatedHistory,
        model: chatModel,
      });

      if (res.ok && res.reply) {
        soundEngine.playBeep(1150, 0.04);
        setChatMessages((prev) => [...prev, { role: 'model', text: res.reply }]);
      }
    } catch (err) {
      const errorMsg = (err as Error)?.message || 'Naturalist temporarily unavailable.';
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: `⚠️ Field network notice: ${errorMsg}. Please try asking again in a moment!`,
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

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
                <ShieldCheck size={11} /> Validated via {card.modelUsed.includes('gemma') ? 'Google Gemma 4' : 'Google Gemini 3.5 Flash'}
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

          {/* Interactive Field Naturalist Companion (Option 1) */}
          <div className="naturalist-drawer">
            <div className="naturalist-drawer-header">
              <div className="naturalist-header-main">
                <div className="naturalist-header-left">
                  <div className="naturalist-avatar" aria-hidden="true">
                    <Leaf size={16} />
                  </div>
                  <div className="naturalist-title-wrap">
                    <div className="naturalist-title-row">
                      <span className="naturalist-title">Field Naturalist Guide</span>
                      <span className="naturalist-model-pill">
                        <span className="model-pulse-dot" /> {chatModel.includes('gemma') ? 'Gemma 4' : 'Gemini'}
                      </span>
                    </div>
                    <small className="naturalist-subtitle">Interactive species consultation & observation advice</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="naturalist-collapse-btn"
                  onClick={() => {
                    soundEngine.playBeep(850, 0.02);
                    setNaturalistOpen(!naturalistOpen);
                  }}
                  aria-label={naturalistOpen ? 'Collapse Naturalist drawer' : 'Expand Naturalist drawer'}
                >
                  {naturalistOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Model Engine Selector Tabs */}
              <div className="naturalist-model-selector-bar">
                <span className="model-bar-label">AI Engine:</span>
                <div className="naturalist-model-toggle" role="radiogroup" aria-label="Select Naturalist Engine">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={chatModel.includes('gemma')}
                    className={`model-toggle-btn ${chatModel.includes('gemma') ? 'active' : ''}`}
                    onClick={() => {
                      soundEngine.playBeep(900, 0.02);
                      setChatModel('gemma-4-26b-a4b-it');
                    }}
                    title="Powered by Google Gemma 4 open architecture (26B)"
                  >
                    <span className="engine-micro-tag gemma">Gemma</span> Gemma 4 (26B)
                  </button>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={chatModel.includes('gemini')}
                    className={`model-toggle-btn ${chatModel.includes('gemini') ? 'active' : ''}`}
                    onClick={() => {
                      soundEngine.playBeep(900, 0.02);
                      setChatModel('gemini-3.5-flash');
                    }}
                    title="Powered by Google Gemini 3.5 Flash"
                  >
                    <span className="engine-micro-tag gemini">Gemini</span> 3.5 Flash
                  </button>
                </div>
              </div>
            </div>

            {naturalistOpen && (
              <div className="naturalist-drawer-body">
                {/* Suggestion Prompts */}
                <div className="naturalist-quick-chips">
                  <span className="quick-chips-label">
                    <HelpCircle size={11} /> Suggested Inquiries:
                  </span>
                  <div className="chips-scroller">
                    <button
                      type="button"
                      className="naturalist-chip"
                      onClick={() => handleSendNaturalistMessage('When is the best season and time of day to spot this in the wild?')}
                      disabled={chatBusy}
                    >
                      🕒 Best season to spot?
                    </button>
                    <button
                      type="button"
                      className="naturalist-chip"
                      onClick={() => handleSendNaturalistMessage('Are there any common dangerous or poisonous lookalike species?')}
                      disabled={chatBusy}
                    >
                      ⚠️ Dangerous lookalikes?
                    </button>
                    <button
                      type="button"
                      className="naturalist-chip"
                      onClick={() => handleSendNaturalistMessage('What is its ecological role and habitat preservation advice?')}
                      disabled={chatBusy}
                    >
                      🌲 Ecological role?
                    </button>
                    <button
                      type="button"
                      className="naturalist-chip"
                      onClick={() => handleSendNaturalistMessage('What are Leave No Trace ethics and safety rules for observing this?')}
                      disabled={chatBusy}
                    >
                      🛡️ Safety & ethics?
                    </button>
                  </div>
                </div>

                {/* Conversation Thread */}
                <div className="naturalist-messages-box">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`naturalist-msg-row ${msg.role === 'user' ? 'user' : 'model'}`}
                    >
                      {msg.role === 'model' && (
                        <div className="msg-avatar-badge" title="JungleDex Naturalist">🌿</div>
                      )}
                      <div className={`naturalist-bubble ${msg.role === 'user' ? 'user' : 'model'}`}>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}

                  {chatBusy && (
                    <div className="naturalist-msg-row model">
                      <div className="msg-avatar-badge">🌿</div>
                      <div className="naturalist-bubble model thinking">
                        <Loader2 size={13} className="spin-icon" />
                        <span>Consulting field records with {chatModel.includes('gemma') ? 'Gemma 4' : 'Gemini'}…</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* Input Form */}
                <form
                  className="naturalist-input-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendNaturalistMessage();
                  }}
                >
                  <input
                    type="text"
                    className="naturalist-text-input"
                    placeholder={`Ask the Naturalist about ${card.name}…`}
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    disabled={chatBusy}
                    maxLength={400}
                  />
                  <button
                    type="submit"
                    className="naturalist-send-btn"
                    disabled={!inputQuery.trim() || chatBusy}
                    aria-label="Send inquiry"
                  >
                    {chatBusy ? <Loader2 size={15} className="spin-icon" /> : <Send size={15} />}
                  </button>
                </form>
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
