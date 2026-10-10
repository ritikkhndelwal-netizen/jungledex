import { type FC } from 'react';
import { Compass, Footprints, Award, Radar, CheckCircle2 } from 'lucide-react';
import { Quest } from '../types';
import { ExpeditionStats, calculateLevel } from '../services/expeditions';
import { soundEngine } from '../services/sound';

interface ExpeditionsPanelProps {
  stats: ExpeditionStats;
  quests: Quest[];
  onOpenRadar: () => void;
  onClaimQuest: (questId: string) => void;
  activeTargetName?: string;
  onClearTarget?: () => void;
}

export const ExpeditionsPanel: FC<ExpeditionsPanelProps> = ({
  stats,
  quests,
  onOpenRadar,
  onClaimQuest,
  activeTargetName,
  onClearTarget,
}) => {
  const levelInfo = calculateLevel(stats.totalXp);
  const currentLevelBaseXp = levelInfo.level === 1 ? 0 : 200;
  const xpNeeded = levelInfo.nextLevelXp - currentLevelBaseXp;
  const xpProgress = Math.min(Math.max((stats.totalXp - currentLevelBaseXp) / xpNeeded, 0), 1) * 100;

  return (
    <section className="section expedition-section" id="expeditions">
      <div className="section-heading">
        <div>
          <div className="eyebrow">
            <span className="pulse green" /> FIELD EXPEDITIONS & STEP TRACKER
          </div>
          <h2>Step Outside. Build Your Journal.</h2>
          <p>Real-world movement rewards: walk, explore habitats, and complete daily outdoor quests.</p>
        </div>

        <button className="button secondary radar-trigger-btn" onClick={onOpenRadar}>
          <Radar size={17} /> Open Nature Radar
        </button>
      </div>

      {activeTargetName && (
        <div className="active-target-banner">
          <div>
            <span className="target-label">🎯 ACTIVE EXPEDITION TARGET</span>
            <b>Tracking: {activeTargetName}</b>
          </div>
          {onClearTarget && (
            <button className="text-button" onClick={onClearTarget}>
              Cancel Target
            </button>
          )}
        </div>
      )}

      <div className="expedition-grid">
        {/* Telemetry Card */}
        <div className="expedition-card telemetry-card">
          <div className="card-topline">
            <span>LIVE STRIDE TELEMETRY</span>
            <Compass size={14} />
          </div>

          <div className="telemetry-stats">
            <div className="tele-item">
              <span className="tele-icon">
                <Footprints size={22} />
              </span>
              <div>
                <b>{stats.estimatedSteps.toLocaleString()}</b>
                <small>Estimated Steps</small>
              </div>
            </div>

            <div className="tele-item">
              <span className="tele-icon">
                <Compass size={22} />
              </span>
              <div>
                <b>
                  {stats.distanceMeters >= 1000
                    ? `${(stats.distanceMeters / 1000).toFixed(2)} km`
                    : `${Math.round(stats.distanceMeters)} m`}
                </b>
                <small>Distance Traveled</small>
              </div>
            </div>
          </div>

          <div className="level-progression">
            <div className="level-header">
              <span>
                <Award size={15} /> Level {levelInfo.level} · <b>{levelInfo.title}</b>
              </span>
              <small>
                {stats.totalXp} / {levelInfo.nextLevelXp} XP
              </small>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>

          {stats.unlockedBadges.length > 0 && (
            <div className="badges-row">
              <small>FIELD BADGES UNLOCKED:</small>
              <div className="badge-chips">
                {stats.unlockedBadges.map((badge, i) => (
                  <span className="badge-chip" key={i}>
                    🏅 {badge}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quests List */}
        <div className="expedition-card quests-card">
          <div className="card-topline">
            <span>DAILY FIELD QUESTS</span>
            <small>{quests.filter((q) => q.completed).length} / {quests.length} Completed</small>
          </div>

          <div className="quests-list">
            {quests.map((quest) => (
              <div
                className={`quest-item ${quest.completed ? 'completed' : ''}`}
                key={quest.id}
              >
                <span className="quest-icon">{quest.icon}</span>
                <div className="quest-info">
                  <b>{quest.title}</b>
                  <p>{quest.description}</p>
                </div>
                <div className="quest-action">
                  {quest.completed ? (
                    <span className="claimed-badge">
                      <CheckCircle2 size={16} /> Completed
                    </span>
                  ) : (
                    <button
                      className="button ghost small"
                      onClick={() => {
                        soundEngine.playFanfare();
                        onClaimQuest(quest.id);
                      }}
                    >
                      +{quest.rewardXp} XP
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
