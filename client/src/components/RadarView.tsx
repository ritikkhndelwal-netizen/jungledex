import { useState, type FC } from 'react';
import { RefreshCw, Compass, Target, Sparkles, Filter } from 'lucide-react';
import { RadarSpecimen } from '../types';
import { soundEngine } from '../services/sound';

interface RadarViewProps {
  specimens: RadarSpecimen[];
  loading: boolean;
  userCoords?: { latitude: number; longitude: number } | null;
  activeTargetName?: string;
  onRefreshRadar: () => void;
  onSelectTarget: (specimen: RadarSpecimen) => void;
  onClearTarget: () => void;
}

export const RadarView: FC<RadarViewProps> = ({
  specimens,
  loading,
  activeTargetName,
  onRefreshRadar,
  onSelectTarget,
  onClearTarget,
}) => {
  const [selectedSpecimen, setSelectedSpecimen] = useState<RadarSpecimen | null>(null);
  const [filterTaxon, setFilterTaxon] = useState<string>('all');

  const filteredSpecimens = specimens.filter((s) => {
    if (filterTaxon === 'all') return true;
    return s.category.toLowerCase().includes(filterTaxon.toLowerCase());
  });

  return (
    <div className="radar-page-view">
      <div className="radar-page-header">
        <div className="radar-title-block">
          <div className="eyebrow">
            <span className="pulse" /> 5KM BIODIVERSITY TELEMETRY
          </div>
          <h1>Nearby Nature Radar</h1>
          <p>Scan real-time wildlife and flora sightings near your coordinates.</p>
        </div>

        <button
          className="button secondary refresh-radar-btn"
          onClick={() => {
            soundEngine.playScan();
            onRefreshRadar();
          }}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Sweeping…' : 'Scan Area'}
        </button>
      </div>

      {activeTargetName && (
        <div className="radar-active-target-bar">
          <div>
            <span className="target-eyebrow">ACTIVE EXPEDITION GOAL</span>
            <b>🎯 Seeking: {activeTargetName}</b>
          </div>
          <button className="text-button" onClick={onClearTarget}>
            Clear Target
          </button>
        </div>
      )}

      {/* Filter Chips */}
      <div className="radar-filters-bar">
        <Filter size={14} className="filter-icon" />
        {['all', 'plants', 'birds', 'insects', 'fungi'].map((cat) => (
          <button
            key={cat}
            className={`radar-chip ${filterTaxon === cat ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playBeep(900, 0.04);
              setFilterTaxon(cat);
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Handheld Radar Screen */}
      <div className="radar-handheld-chassis">
        <div className="radar-screen-viewport">
          {/* Radar Circles */}
          <div className="radar-circle circle-5km" />
          <div className="radar-circle circle-3km" />
          <div className="radar-circle circle-1km" />
          <div className="radar-crosshair-h" />
          <div className="radar-crosshair-v" />

          {/* Sweeping Beam */}
          <div className="radar-sweep-beam" />

          {/* User Center Blip */}
          <div className="radar-center-blip">
            <div className="center-pulse" />
          </div>

          {/* Radar Specimen Blips */}
          {filteredSpecimens.map((item) => {
            const maxMeters = 5000;
            const distRatio = Math.min(item.distanceMeters / maxMeters, 0.95);
            const hash = String(item.id).split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
            const angle = (hash % 360) * (Math.PI / 180);
            const radiusPercent = distRatio * 44;
            const leftPercent = 50 + radiusPercent * Math.cos(angle);
            const topPercent = 50 + radiusPercent * Math.sin(angle);

            const isSelected = selectedSpecimen?.id === item.id;

            return (
              <button
                key={item.id}
                className={`radar-blip ${isSelected ? 'active' : ''}`}
                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                onClick={() => {
                  soundEngine.playBeep(1200, 0.04);
                  setSelectedSpecimen(item);
                }}
                title={`${item.commonName} (${item.distanceMeters}m away)`}
              >
                <div className="blip-dot" />
                <div className="blip-ring" />
              </button>
            );
          })}
        </div>

        {/* Selected Specimen Card / Quick Target Action */}
        <div className="radar-inspector-drawer">
          {selectedSpecimen ? (
            <div className="radar-specimen-sheet">
              <div className="specimen-thumb-row">
                {selectedSpecimen.photoUrl ? (
                  <img src={selectedSpecimen.photoUrl} alt={selectedSpecimen.commonName} />
                ) : (
                  <div className="no-thumb-box">🌿</div>
                )}
                <div className="specimen-text">
                  <span className="specimen-taxon-tag">{selectedSpecimen.category}</span>
                  <h3>{selectedSpecimen.commonName}</h3>
                  <small>{selectedSpecimen.scientificName}</small>
                  <b className="distance-badge">
                    <Compass size={13} /> {selectedSpecimen.distanceMeters}m away
                  </b>
                </div>
              </div>

              <div className="specimen-sheet-actions">
                <button
                  className="button primary full"
                  onClick={() => {
                    soundEngine.playFanfare();
                    onSelectTarget(selectedSpecimen);
                  }}
                >
                  <Target size={15} /> Set as Expedition Target
                </button>
              </div>
            </div>
          ) : (
            <div className="radar-idle-hint">
              <Sparkles size={24} />
              <p>Tap any blinking yellow radar blip above to inspect specimen details and calculate distance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Sightings List */}
      <div className="radar-sightings-list">
        <h3>Nearby Sightings ({filteredSpecimens.length})</h3>
        <div className="sightings-grid">
          {filteredSpecimens.map((specimen) => (
            <div
              key={specimen.id}
              className={`sighting-card ${selectedSpecimen?.id === specimen.id ? 'active' : ''}`}
              onClick={() => {
                soundEngine.playBeep(950, 0.04);
                setSelectedSpecimen(specimen);
              }}
            >
              <div className="sighting-thumb">
                {specimen.photoUrl ? (
                  <img src={specimen.photoUrl} alt={specimen.commonName} />
                ) : (
                  <span>🌿</span>
                )}
              </div>
              <div className="sighting-details">
                <b>{specimen.commonName}</b>
                <small>{specimen.scientificName}</small>
                <span className="dist-chip">{specimen.distanceMeters}m away</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
