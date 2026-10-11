import type { FC } from 'react';
import {
  Footprints,
  Navigation,
  Sparkles,
  Award,
  Camera,
  Crosshair,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Sun,
  Waves,
  Leaf,
  Bug,
  CheckCircle2,
} from 'lucide-react';
import { ExpeditionStats, calculateLevel } from '../services/expeditions';
import { Quest, UserProfile } from '../types';
import { soundEngine } from '../services/sound';
import { Cloud, UserPlus } from 'lucide-react';

interface ExpeditionsPageProps {
  stats: ExpeditionStats;
  quests: Quest[];
  user?: UserProfile | null;
  onOpenAuth?: () => void;
  activeTargetName?: string;
  isTrackingActive?: boolean;
  onToggleTracking?: () => void;
  onResetStats?: () => void;
  onClearTarget: () => void;
  onClaimQuest: (questId: string) => void;
  onGoToRadar: () => void;
  onGoToScanner: () => void;
}

export const ExpeditionsPage: FC<ExpeditionsPageProps> = ({
  stats,
  quests,
  user,
  onOpenAuth,
  activeTargetName,
  isTrackingActive = false,
  onToggleTracking,
  onResetStats,
  onClearTarget,
  onClaimQuest,
  onGoToRadar,
  onGoToScanner,
}) => {
  const levelInfo = calculateLevel(stats.totalXp);
  const xpProgress = Math.min((stats.totalXp / levelInfo.nextLevelXp) * 100, 100);

  return (
    <div className="expeditions-page-view">
      {/* Cloud Sync Status Banner if Guest */}
      {!user && onOpenAuth && (
        <div className="dex-sync-banner" style={{ marginTop: '0', marginBottom: '22px' }}>
          <div className="sync-status guest" onClick={onOpenAuth}>
            <Cloud size={15} />
            <span>
              <b>Guest Session.</b> Physical steps are recorded on this browser only. Sign in to save your streaks, level & quest badges permanently →
            </span>
            <button className="button secondary micro-btn">
              <UserPlus size={12} /> Sign In
            </button>
          </div>
        </div>
      )}

      <div className="expeditions-page-header">
        <div className="expeditions-title-block">
          <div className="eyebrow">
            <span className="pulse" /> FIELD EXPLORER TELEMETRY
          </div>
          <h1>Expeditions & Quests</h1>
          <p>Walk outside, track physical steps, and complete daily exploration missions.</p>
        </div>

        <div className="expeditions-header-actions">
          {onToggleTracking && (
            <button
              className={`button ${isTrackingActive ? 'light' : 'secondary'} compact-action-btn`}
              onClick={onToggleTracking}
              title={isTrackingActive ? 'Pause GPS stride tracking' : 'Start GPS stride tracking'}
            >
              {isTrackingActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{isTrackingActive ? 'Pause Walk' : 'Start Walk'}</span>
            </button>
          )}

          {onResetStats && (
            <button
              className="button ghost compact-action-btn"
              onClick={onResetStats}
              title="Reset ground distance and steps to 0"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}

          <button
            className="button primary compact-action-btn"
            onClick={() => {
              soundEngine.playBeep(1100, 0.04);
              onGoToScanner();
            }}
          >
            <Camera size={14} /> Field Scanner
          </button>
        </div>
      </div>

      {/* Live Session Status Banner */}
      <div className={`expedition-session-bar ${isTrackingActive ? 'active' : 'idle'}`}>
        <div className="session-status-info">
          <span className={`session-beacon-dot ${isTrackingActive ? 'active' : 'idle'}`} />
          <div>
            <b>{isTrackingActive ? 'Live GPS Stride Tracking Active' : 'Stride Tracking Paused (Laptop / Indoor Safe)'}</b>
            <small>
              {isTrackingActive
                ? 'High-accuracy tracking enabled. Steps increment as you walk outdoors.'
                : 'Stationary mode active. Start a walk session when you head outside to track strides.'}
            </small>
          </div>
        </div>

        {onToggleTracking && (
          <button
            className={`button micro-btn ${isTrackingActive ? 'ghost' : 'light'}`}
            onClick={onToggleTracking}
          >
            {isTrackingActive ? 'Pause' : 'Start Walk'}
          </button>
        )}
      </div>

      {activeTargetName && (
        <div className="active-target-banner">
          <div>
            <span className="target-label">ACTIVE EXPEDITION GOAL</span>
            <b>
              <Crosshair size={13} style={{ display: 'inline', marginRight: '5px' }} />
              Seeking: {activeTargetName}
            </b>
          </div>
          <button className="text-button" onClick={onClearTarget}>
            Dismiss
          </button>
        </div>
      )}

      {/* Main Telemetry Stats Cards */}
      <div className="telemetry-grid-large">
        <div className="telemetry-hero-card">
          <div className="tele-metric">
            <div className="tele-icon-circle green">
              <Footprints size={24} />
            </div>
            <div>
              <small>PHYSICAL STRIDES</small>
              <b className="metric-value">{stats.estimatedSteps.toLocaleString()}</b>
              <span>Steps Recorded</span>
            </div>
          </div>

          <div className="tele-metric">
            <div className="tele-icon-circle blue">
              <Navigation size={24} />
            </div>
            <div>
              <small>DISTANCE WALKED</small>
              <b className="metric-value">
                {stats.distanceMeters >= 1000
                  ? `${(stats.distanceMeters / 1000).toFixed(2)} km`
                  : `${Math.round(stats.distanceMeters)} m`}
              </b>
              <span>Ground Covered</span>
            </div>
          </div>

          <div className="tele-metric">
            <div className="tele-icon-circle amber">
              <Sparkles size={24} />
            </div>
            <div>
              <small>TOTAL EXPLORER XP</small>
              <b className="metric-value">{stats.totalXp.toLocaleString()} XP</b>
              <span>Rank Experience</span>
            </div>
          </div>
        </div>

        {/* Level Progression */}
        <div className="rank-progression-card">
          <div className="rank-header">
            <div>
              <span className="rank-eyebrow">CURRENT TITLE</span>
              <h2>Level {levelInfo.level} · {levelInfo.title}</h2>
            </div>
            <Award size={32} className="rank-medal-icon" />
          </div>

          <div className="rank-progress-container">
            <div className="rank-progress-labels">
              <span>Level Progress</span>
              <b>{stats.totalXp} / {levelInfo.nextLevelXp} XP</b>
            </div>
            <div className="xp-bar-track">
              <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>

          {/* Badges */}
          <div className="unlocked-badges-box">
            <small>EARNED FIELD BADGES ({stats.unlockedBadges.length})</small>
            <div className="badge-chips">
              {stats.unlockedBadges.map((badge) => (
                <span className="badge-chip" key={badge}>
                  <Trophy size={11} style={{ display: 'inline', marginRight: '4px' }} />
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Daily Quests Section */}
      <div className="daily-quests-container">
        <div className="quests-section-header">
          <div>
            <h3>Active Daily Quests</h3>
            <p>Complete challenges to earn XP and unlock collectible badges.</p>
          </div>
          <button
            className="button secondary"
            onClick={() => {
              soundEngine.playScan();
              onGoToRadar();
            }}
          >
            <Compass size={14} /> Open Radar to Find Targets
          </button>
        </div>

        <div className="quests-list-full">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`quest-card-item ${quest.completed ? 'completed' : ''}`}
            >
              <div className="quest-card-left">
                <span className="quest-emoji">
                  {quest.icon === 'sun' && <Sun size={20} />}
                  {quest.icon === 'waves' && <Waves size={20} />}
                  {quest.icon === 'leaf' && <Leaf size={20} />}
                  {quest.icon === 'bug' && <Bug size={20} />}
                  {quest.icon === 'compass' && <Compass size={20} />}
                </span>
                <div className="quest-details">
                  <b>{quest.title}</b>
                  <p>{quest.description}</p>
                  <div className="quest-progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.min(
                          (quest.currentValue / Number(quest.targetValue)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="progress-text">
                    {quest.currentValue} / {quest.targetValue}{' '}
                    {quest.targetType === 'distance' ? 'meters' : 'found'}
                  </span>
                </div>
              </div>

              <div className="quest-reward-column">
                <span className="reward-xp-pill">+{quest.rewardXp} XP</span>
                {quest.completed ? (
                  <span className="claimed-badge">
                    <CheckCircle2 size={15} /> Completed
                  </span>
                ) : quest.currentValue >= Number(quest.targetValue) ? (
                  <button
                    className="button primary micro-btn"
                    onClick={() => {
                      soundEngine.playFanfare();
                      onClaimQuest(quest.id);
                    }}
                  >
                    Claim XP!
                  </button>
                ) : (
                  <span className="in-progress-label">In Progress</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Aliased export for compatibility
export { ExpeditionsPage as ExpeditionsView };
