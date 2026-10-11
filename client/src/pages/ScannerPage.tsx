import type { FC } from 'react';
import { Sparkles, Eye, ArrowLeft, Leaf, Bug, Sun } from 'lucide-react';
import { Workbench } from '../components/Workbench';
import { soundEngine } from '../services/sound';

interface ScannerPageProps {
  photo: string | null;
  file: File | null;
  busy: boolean;
  error: string;
  locationEnabled: boolean;
  placeLabel: string;
  weather: string;
  onFileSelect: (file: File | null) => void;
  onClearPhoto: () => void;
  onEnableLocation: () => void;
  onIdentify: () => void;
  onBackToDex: () => void;
}

export const ScannerPage: FC<ScannerPageProps> = ({
  photo,
  file,
  busy,
  error,
  locationEnabled,
  placeLabel,
  weather,
  onFileSelect,
  onClearPhoto,
  onEnableLocation,
  onIdentify,
  onBackToDex,
}) => {
  return (
    <div className="scanner-page-view">
      <div className="scanner-header-bar">
        <button
          className="back-dex-btn"
          onClick={() => {
            soundEngine.playBeep(850, 0.04);
            onBackToDex();
          }}
        >
          <ArrowLeft size={16} /> Back to Dex
        </button>

        <div className="scanner-badge">
          <Sparkles size={13} />
          <span>Multimodal Vision AI</span>
        </div>
      </div>

      <div className="scanner-title-block">
        <div className="eyebrow">
          <span className="pulse" /> OPTICAL SENSOR READY
        </div>
        <h1>Field Scanner</h1>
        <p>Take or upload a photo of any plant, animal, sunset, or rock formation.</p>
      </div>

      <Workbench
        photo={photo}
        file={file}
        busy={busy}
        error={error}
        locationEnabled={locationEnabled}
        placeLabel={placeLabel}
        weather={weather}
        onFileSelect={onFileSelect}
        onClearPhoto={onClearPhoto}
        onEnableLocation={onEnableLocation}
        onIdentify={onIdentify}
      />

      <div className="scanner-field-tips">
        <h4>
          <Eye size={15} /> Pro Explorer Field Tips
        </h4>
        <div className="tips-grid">
          <div className="tip-card">
            <b>
              <Leaf size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Flora & Leaves
            </b>
            <p>Capture the leaf venation and flower center clearly in natural daylight.</p>
          </div>
          <div className="tip-card">
            <b>
              <Bug size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Insects & Wildlife
            </b>
            <p>Keep a gentle distance; zoom in without disturbing the creature's habitat.</p>
          </div>
          <div className="tip-card">
            <b>
              <Sun size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Sunsets & Landscapes
            </b>
            <p>Frame the horizon with distinctive terrain (mountains, trees, water reflections).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Aliased export for compatibility
export { ScannerPage as ScannerView };
