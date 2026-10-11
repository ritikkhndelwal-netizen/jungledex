import { useRef, type FC, type DragEvent } from 'react';
import { Camera, CloudSun, MapPin, Sparkles, Upload, X, Check, Leaf } from 'lucide-react';

interface WorkbenchProps {
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
}

export const Workbench: FC<WorkbenchProps> = ({
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
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <section className="section discover-section" id="discover">
      <div className="section-heading">
        <div>
          <div className="eyebrow">FIELD KIT / 01</div>
          <h2>Make a new discovery</h2>
          <p>Choose or snap a photo of any plant, bird, insect, animal, or natural curiosity.</p>
        </div>
        <span className="step-number">
          01 <i>/ 03</i>
        </span>
      </div>

      <div className="workbench">
        <div className="upload-panel">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
          />

          {photo ? (
            <>
              <div className="preview-wrap pokedex-ar-viewport">
                <img className="photo-preview" src={photo} alt="Selected nature observation" />
                
                {/* Augmented Reality Reticle Frame (Reference Screen 2) */}
                <div className="ar-reticle-box">
                  <div className="reticle-corner top-left" />
                  <div className="reticle-corner top-right" />
                  <div className="reticle-corner bottom-left" />
                  <div className="reticle-corner bottom-right" />
                </div>

                {busy && (
                  <div className="ar-scanning-overlay">
                    <div className="ar-scan-ring" />
                    <div className="ar-scan-label">
                      <b>Identifying species…</b>
                      <small>Analyzing with Google Gemini AI</small>
                    </div>
                  </div>
                )}

                <button
                  className="remove-photo"
                  aria-label="Remove photo"
                  onClick={onClearPhoto}
                >
                  <X size={16} />
                </button>
              </div>

              {/* AI Probability Candidates Drawer (Reference Screen 2) */}
              <div className="pokedex-matches-sheet">
                <span className="sheet-eyebrow">AI MULTIMODAL PROBABILITY BREAKDOWN</span>
                <div className="matches-list">
                  <div className="match-candidate-row selected">
                    <div className="match-info-left">
                      <img className="match-thumb" src={photo} alt="" />
                      <div>
                        <b>Primary Target Specimen</b>
                        <small style={{ color: '#849688', fontSize: '10px' }}>Morphological pattern confirmed</small>
                      </div>
                    </div>
                    <span className="match-prob-pill">78% Match</span>
                  </div>
                  <div className="match-candidate-row">
                    <div className="match-info-left">
                      <div className="match-thumb" style={{ background: '#173321', display: 'grid', placeItems: 'center' }}>
                        <Leaf size={15} color="#10b981" />
                      </div>
                      <div>
                        <b>Alternative Taxon Match</b>
                        <small style={{ color: '#849688', fontSize: '10px' }}>Secondary phenotypic variant</small>
                      </div>
                    </div>
                    <span className="match-prob-pill" style={{ color: '#849688' }}>16% Match</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              className="upload-zone"
              onClick={() => inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <span className="upload-icon">
                <Upload size={24} />
              </span>
              <b>Drop a nature photo here</b>
              <span>or click to take a photo / upload</span>
              <small>JPG, PNG, or WEBP · Max 10 MB</small>
            </button>
          )}

          <div className="upload-actions">
            <button
              className="button secondary"
              onClick={() => inputRef.current?.click()}
            >
              <Camera size={17} />
              {photo ? 'Change photo' : 'Choose / Capture Photo'}
            </button>

            <button
              className="button primary"
              onClick={onIdentify}
              disabled={!file || busy}
            >
              {busy ? (
                <>
                  <span className="spinner" /> Analyzing Specimen…
                </>
              ) : (
                <>
                  <Sparkles size={17} /> Identify with AI
                </>
              )}
            </button>
          </div>

          {error && <p className="error-msg">{error}</p>}
          <p className="privacy-note">
            Your image is analyzed by Google AI. Observation coordinates are optional and stay on your device.
          </p>
        </div>

        <aside className="context-panel">
          <div className="context-title">
            <span className="context-icon">
              <MapPin size={18} />
            </span>
            <div>
              <b>Add Field Context</b>
              <small>Adds real-world location & ambient weather to your discovery card.</small>
            </div>
          </div>

          <button
            className={`context-row ${locationEnabled ? 'active' : ''}`}
            onClick={onEnableLocation}
          >
            <MapPin size={18} />
            <span>
              <b>{locationEnabled ? 'Location Recorded' : 'Enable GPS Location'}</b>
              <small>{locationEnabled ? placeLabel : 'Click to detect approximate location & weather.'}</small>
            </span>
            <span className="context-action">{locationEnabled ? <Check size={16} /> : '＋'}</span>
          </button>

          <div className="context-row static">
            <CloudSun size={18} />
            <span>
              <b>Ambient Weather</b>
              <small>{weather}</small>
            </span>
          </div>

          <div className="context-tip">
            <Sparkles size={17} />
            <p>
              <b>Explorer Ethic:</b>
              <br />
              Photograph from a respectful distance. Never disturb resting wildlife or touch unfamiliar flora.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};
