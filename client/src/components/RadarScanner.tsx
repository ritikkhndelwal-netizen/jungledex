import { useState, type FC } from 'react';
import { X, Compass, MapPin, Target, Eye } from 'lucide-react';
import { RadarSpecimen } from '../types';
import { soundEngine } from '../services/sound';

interface RadarScannerProps {
  isOpen: boolean;
  onClose: () => void;
  specimens: RadarSpecimen[];
  loading: boolean;
  userCoords: { latitude: number; longitude: number } | null;
  onSelectTarget: (specimen: RadarSpecimen) => void;
}

export const RadarScanner: FC<RadarScannerProps> = ({
  isOpen,
  onClose,
  specimens,
  loading,
  userCoords,
  onSelectTarget,
}) => {
  const [selectedBlip, setSelectedBlip] = useState<RadarSpecimen | null>(null);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog radar-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="eyebrow">
              <span className="pulse red" /> BIODIVERSITY RADAR
            </div>
            <h3>Nearby Nature Sightings (5km Radius)</h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close radar">
            <X size={18} />
          </button>
        </div>

        <div className="radar-body">
          <div className="radar-display">
            <div className="radar-circle circle-5km" />
            <div className="radar-circle circle-3km" />
            <div className="radar-circle circle-1km" />
            <div className="radar-crosshair-h" />
            <div className="radar-crosshair-v" />
            <div className="radar-sweep-beam" />

            {/* User Center Point */}
            <div className="radar-center-blip" title="Your Location">
              <div className="center-pulse" />
            </div>

            {/* Plotted Specimen Blips */}
            {specimens.map((item, idx) => {
              // Convert lat/lon relative offset to polar position
              let angle = (idx * 52) % 360;
              let distRatio = Math.min(item.distanceMeters / 5000, 0.9);
              if (userCoords) {
                const dy = item.latitude - userCoords.latitude;
                const dx = item.longitude - userCoords.longitude;
                angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              }

              const rad = (angle * Math.PI) / 180;
              const xPercent = 50 + distRatio * 44 * Math.cos(rad);
              const yPercent = 50 - distRatio * 44 * Math.sin(rad);

              const isSelected = selectedBlip?.id === item.id;

              return (
                <button
                  key={item.id}
                  className={`radar-blip ${isSelected ? 'active' : ''}`}
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  title={`${item.commonName} (${item.distanceMeters}m)`}
                  onClick={() => {
                    soundEngine.playBeep(1100, 0.05);
                    setSelectedBlip(item);
                  }}
                >
                  <span className="blip-ring" />
                  <span className="blip-dot" />
                </button>
              );
            })}
          </div>

          <div className="radar-sidebar">
            <div className="radar-stats-header">
              <Compass size={16} />
              <span>
                {loading
                  ? 'Scanning frequencies…'
                  : `${specimens.length} Wild Discoveries Detected`}
              </span>
            </div>

            {selectedBlip ? (
              <div className="blip-detail-card">
                {selectedBlip.photoUrl && (
                  <img
                    className="blip-thumbnail"
                    src={selectedBlip.photoUrl}
                    alt={selectedBlip.commonName}
                  />
                )}
                <div className="blip-meta">
                  <span className="category-tag">{selectedBlip.category}</span>
                  <h4>{selectedBlip.commonName}</h4>
                  <i className="scientific">{selectedBlip.scientificName}</i>
                  <p className="blip-distance">
                    <MapPin size={13} /> Approx. {selectedBlip.distanceMeters} meters away
                  </p>
                  <small className="blip-date">Recorded: {selectedBlip.observedOn}</small>
                </div>

                <div className="blip-actions">
                  <button
                    className="button primary full"
                    onClick={() => {
                      soundEngine.playScan();
                      onSelectTarget(selectedBlip);
                      onClose();
                    }}
                  >
                    <Target size={15} /> Set as Expedition Target
                  </button>
                </div>
              </div>
            ) : (
              <div className="radar-empty-hint">
                <Eye size={28} />
                <b>Click any radar blip</b>
                <p>
                  Each signal represents a real observation recorded in your local area by scientists and explorers.
                </p>
              </div>
            )}

            <div className="radar-legend">
              <small>Data powered by the global iNaturalist biodiversity network.</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
