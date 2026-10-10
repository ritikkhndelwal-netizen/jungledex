import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Discovery, ThemeType, HealthStatus, UserProfile, Quest, RadarSpecimen } from './types';
import { getStoredCards, saveCardToDB, deleteCardFromDB, fileToDataUrl } from './services/db';
import { checkApiHealth, identifySpecimen } from './services/api';
import { reverseGeocodeLocation, fetchWeatherInfo } from './services/geo';
import {
  subscribeToAuth,
  syncCardToCloud,
  fetchCardsFromCloud,
} from './services/firebase';
import {
  getStoredExpeditionStats,
  saveExpeditionStats,
  getStoredQuests,
  saveQuests,
  haversineMeters,
  type ExpeditionStats,
} from './services/expeditions';
import { fetchNearbyBiodiversity } from './services/radar';
import { soundEngine } from './services/sound';

import { TopBar } from './components/TopBar';
import { BottomNav, type ActiveView } from './components/BottomNav';
import { LandingView } from './components/LandingView';
import { CollectionDexView } from './components/CollectionDexView';
import { ScannerView } from './components/ScannerView';
import { RadarView } from './components/RadarView';
import { ExpeditionsView } from './components/ExpeditionsView';
import { ResultModal } from './components/ResultModal';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

const SAMPLE_CARDS: Discovery[] = [
  {
    id: 'sample-sunset',
    name: 'Sunset over Coastal Ridge',
    scientificName: 'Rayleigh Atmospheric Scattering',
    category: 'Landscape/Vista',
    rarity: 'Epic',
    confidence: 'High',
    description: 'A breathtaking golden sunset illuminating the horizon with vivid amber and crimson hues.',
    facts: [
      'Atmospheric Rayleigh scattering scatters short blue wavelengths, letting deep oranges and reds reach the eye.',
      'Sunsets often indicate high pressure systems and clearer weather.',
      'Observing natural horizons reduces eye strain and calms the nervous system.',
    ],
    image: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1000&q=85',
    date: 'Sample Field Note',
    location: 'Coastal Ridge Lookout',
    theme: 'nature',
  },
  {
    id: 'sample-waterfall',
    name: 'Mossy Cascades Waterfall',
    scientificName: 'Hydrological Chute Cascade',
    category: 'Waterscape',
    rarity: 'Rare',
    confidence: 'High',
    description: 'A pure mountain stream plunging over volcanic basalt rocks lined with ancient ferns and mosses.',
    facts: [
      'Waterfalls generate high concentrations of negative air ions, which invigorate surrounding vegetation.',
      'Lush microclimates near waterfalls support rare bryophytes and salamanders.',
      'Observe mist spray patterns to gauge stream velocity and volume.',
    ],
    image: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=1000&q=85',
    date: 'Sample Field Note',
    location: 'Mountain Gorge Trail',
    theme: 'nature',
  },
  {
    id: 'sample-pansy',
    name: 'Peacock Pansy',
    scientificName: 'Junonia almana',
    category: 'Insect',
    rarity: 'Uncommon',
    confidence: 'High',
    description: 'A striking butterfly known for its bold eye-like wing markings. Look closely, observe gently, and let it continue on its way.',
    facts: [
      'Often seen in sunny, open grasslands.',
      'Its eye patterns help deter potential predators.',
      'Observe from a distance; never handle wildlife.',
    ],
    image: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1000&q=85',
    date: 'Sample Field Note',
    location: 'Open Meadows',
    theme: 'nature',
  },
];

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('landing');
  const [theme, setTheme] = useState<ThemeType>('nature');
  const [cards, setCards] = useState<Discovery[]>([]);
  const [selectedCard, setSelectedCard] = useState<Discovery | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // Expeditions & Quests State
  const [expeditionStats, setExpeditionStats] = useState<ExpeditionStats>(getStoredExpeditionStats());
  const [quests, setQuests] = useState<Quest[]>(getStoredQuests());
  const [activeTarget, setActiveTarget] = useState<string>('');

  // Radar State
  const [radarSpecimens, setRadarSpecimens] = useState<RadarSpecimen[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);

  // Environmental context
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeLabel, setPlaceLabel] = useState('Location not added');
  const [weather, setWeather] = useState('Weather not loaded');

  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Initialize theme, cards from IndexedDB, API health, and Firebase Auth
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('jungledex-theme') as ThemeType;
      if (savedTheme) setTheme(savedTheme);
    } catch {
      // ignore
    }

    // Load persisted cards from IndexedDB
    getStoredCards().then((stored) => {
      setCards(stored);
    });

    // Check backend API connectivity
    checkApiHealth().then((status) => {
      setHealth(status);
    });

    // Initial prefetch of nearby radar specimens
    fetchNearbyBiodiversity(37.7749, -122.4194, 5).then((items) => {
      setRadarSpecimens(items);
    });

    // Subscribe to Firebase Auth
    const unsubscribeAuth = subscribeToAuth((profile) => {
      setUser(profile);
      if (profile) {
        // Fetch cloud cards and merge
        fetchCardsFromCloud(profile.uid).then((cloudCards) => {
          if (cloudCards.length > 0) {
            setCards((prev) => {
              const existingIds = new Set(prev.map((c) => c.id));
              const fresh = cloudCards.filter((c) => !existingIds.has(c.id));
              fresh.forEach((c) => saveCardToDB(c));
              return [...fresh, ...prev];
            });
          }
        });
      } else {
        // Logged out: return to clean landing page
        setActiveView('landing');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // Sync theme changes
  useEffect(() => {
    try {
      localStorage.setItem('jungledex-theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Persist expedition stats and quests
  useEffect(() => {
    saveExpeditionStats(expeditionStats);
  }, [expeditionStats]);

  useEffect(() => {
    saveQuests(quests);
  }, [quests]);

  // Real-time GPS movement watcher (Stride / distance tracking)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        if (lastCoordsRef.current) {
          const delta = haversineMeters(
            lastCoordsRef.current.latitude,
            lastCoordsRef.current.longitude,
            current.latitude,
            current.longitude
          );

          // Filter out GPS jitter (< 3m) and impossible spikes (> 150m)
          if (delta >= 3 && delta < 150) {
            const addedSteps = Math.round(delta / 0.76);
            setExpeditionStats((prev) => {
              const newDist = prev.distanceMeters + delta;
              const newSteps = prev.estimatedSteps + addedSteps;
              const newXp = prev.totalXp + Math.round(delta / 5);

              // Check distance quest
              setQuests((qList) =>
                qList.map((q) => {
                  if (q.targetType === 'distance' && !q.completed) {
                    const currentVal = q.currentValue + delta;
                    if (currentVal >= Number(q.targetValue)) {
                      soundEngine.playFanfare();
                      setToast(`🏆 Quest Complete: ${q.title}! (+${q.rewardXp} XP)`);
                      return { ...q, currentValue: currentVal, completed: true };
                    }
                    return { ...q, currentValue: currentVal };
                  }
                  return q;
                })
              );

              return {
                ...prev,
                distanceMeters: newDist,
                estimatedSteps: newSteps,
                totalXp: newXp,
              };
            });
          }
        }
        lastCoordsRef.current = current;
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Handle file choice & camera capture
  const handleFileSelect = async (selected: File | null) => {
    setError('');
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, or WEBP).');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Please choose an image smaller than 10 MB.');
      return;
    }

    try {
      setFile(selected);
      soundEngine.playBeep(1050, 0.05);
      const dataUrl = await fileToDataUrl(selected);
      setPhoto(dataUrl);
    } catch {
      setError('Could not process this image.');
    }
  };

  const handleClearPhoto = () => {
    setPhoto(null);
    setFile(null);
    setError('');
  };

  // Geolocation & Ambient Weather Detection
  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setToast('Geolocation is not supported by your browser.');
      return;
    }

    soundEngine.playBeep(880, 0.05);
    setToast('Acquiring your location and ambient weather…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nextCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setCoords(nextCoords);
        setLocationEnabled(true);
        lastCoordsRef.current = nextCoords;

        const [friendlyPlace, weatherInfo] = await Promise.all([
          reverseGeocodeLocation(nextCoords.latitude, nextCoords.longitude),
          fetchWeatherInfo(nextCoords.latitude, nextCoords.longitude),
        ]);

        setPlaceLabel(friendlyPlace);
        setWeather(weatherInfo);
        setToast(`Location recorded: ${friendlyPlace}`);

        // Also refresh radar with real coordinates
        fetchNearbyBiodiversity(nextCoords.latitude, nextCoords.longitude, 5).then((items) => {
          setRadarSpecimens(items);
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setToast('Location permission denied. You can continue without GPS.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  // Refresh Radar Scan
  const handleRefreshRadar = async () => {
    setRadarLoading(true);
    const lat = coords?.latitude || 37.7749;
    const lon = coords?.longitude || -122.4194;
    try {
      const sightings = await fetchNearbyBiodiversity(lat, lon, 5);
      setRadarSpecimens(sightings);
      setToast(`Radar updated with ${sightings.length} local sightings.`);
    } catch {
      setToast('Could not refresh radar.');
    } finally {
      setRadarLoading(false);
    }
  };

  // Claim Quest Reward
  const handleClaimQuest = (questId: string) => {
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId && !q.completed) {
          setExpeditionStats((s) => ({
            ...s,
            totalXp: s.totalXp + q.rewardXp,
            unlockedBadges: q.badgeName && !s.unlockedBadges.includes(q.badgeName)
              ? [...s.unlockedBadges, q.badgeName]
              : s.unlockedBadges,
          }));
          setToast(`Claimed ${q.rewardXp} XP for "${q.title}"!`);
          return { ...q, completed: true };
        }
        return q;
      })
    );
  };

  // AI Identification trigger
  const handleIdentify = async () => {
    if (!file || !photo) {
      setError('Capture or choose a photo first.');
      return;
    }

    setBusy(true);
    setError('');
    soundEngine.playScan();

    try {
      const data = await identifySpecimen(file, coords || undefined, theme);

      const newCard: Discovery = {
        id: crypto.randomUUID(),
        name: data.name || 'Nature Discovery',
        scientificName: data.scientificName || 'Species / Phenomenon unconfirmed',
        category: data.category || 'Nature',
        rarity: data.rarity || 'Discovery',
        confidence: data.confidence || 'Verified AI Observation',
        description: data.description || 'A new observation from your outdoor adventure.',
        facts: Array.isArray(data.facts) ? data.facts.slice(0, 3) : [],
        image: photo,
        date: new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        location: locationEnabled ? placeLabel : undefined,
        coordinates: coords || undefined,
        weather: locationEnabled ? weather : undefined,
        theme,
        modelUsed: data.modelUsed,
        isAiGenerated: data.isAiGenerated,
        aiGenerationReason: data.aiGenerationReason,
        userId: user?.uid,
      };

      // Persist to IndexedDB
      await saveCardToDB(newCard);

      // Cloud Sync if authenticated
      if (user) {
        await syncCardToCloud(user.uid, newCard);
      }

      // Check category quests
      setQuests((qList) =>
        qList.map((q) => {
          if (q.targetType === 'category' && !q.completed) {
            const matchesCategory = newCard.category.toLowerCase().includes(String(q.targetValue).toLowerCase());
            if (matchesCategory) {
              setExpeditionStats((s) => ({
                ...s,
                totalXp: s.totalXp + q.rewardXp,
                unlockedBadges: q.badgeName && !s.unlockedBadges.includes(q.badgeName)
                  ? [...s.unlockedBadges, q.badgeName]
                  : s.unlockedBadges,
              }));
              setToast(`🏆 Quest Complete: ${q.title}! (+${q.rewardXp} XP)`);
              return { ...q, completed: true };
            }
          }
          return q;
        })
      );

      // Update state and open card
      setCards((prev) => [newCard, ...prev]);
      setSelectedCard(newCard);
      setPhoto(null);
      setFile(null);

      soundEngine.playFanfare();
      setToast(
        newCard.isAiGenerated
          ? `Visual analyzed: "${newCard.name}" (Tagged as AI-Generated)`
          : `Discovery recorded: "${newCard.name}"!`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Identification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Delete card from collection
  const handleDeleteCard = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Remove this card from your field collection?')) {
      await deleteCardFromDB(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      if (selectedCard?.id === id) {
        setSelectedCard(null);
      }
      setToast('Card removed from collection.');
    }
  };

  return (
    <div className={`app theme-${theme} view-${activeView} ${user ? 'is-logged-in' : 'is-logged-out'}`}>
      {/* Top Header */}
      <TopBar
        theme={theme}
        setTheme={setTheme}
        cardsCount={cards.length}
        health={health}
        user={user}
        activeView={activeView}
        onSelectView={setActiveView}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main View Router */}
      <main className="main-content-area">
        {activeView === 'landing' && (
          <LandingView
            user={user}
            cardsCount={cards.length}
            sampleCards={SAMPLE_CARDS}
            onOpenCard={(card) => setSelectedCard(card)}
            onGoToCollection={() => setActiveView('collection')}
            onGoToScanner={() => setActiveView('scanner')}
            onGoToRadar={() => setActiveView('radar')}
            onGoToExpeditions={() => setActiveView('expeditions')}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {activeView === 'collection' && (
          <CollectionDexView
            cards={cards}
            sampleCards={SAMPLE_CARDS}
            user={user}
            onSelectCard={(card) => setSelectedCard(card)}
            onDeleteCard={handleDeleteCard}
            onGoToScanner={() => setActiveView('scanner')}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {activeView === 'scanner' && (
          <ScannerView
            photo={photo}
            file={file}
            busy={busy}
            error={error}
            locationEnabled={locationEnabled}
            placeLabel={placeLabel}
            weather={weather}
            onFileSelect={handleFileSelect}
            onClearPhoto={handleClearPhoto}
            onEnableLocation={handleEnableLocation}
            onIdentify={handleIdentify}
            onBackToDex={() => setActiveView('collection')}
          />
        )}

        {activeView === 'radar' && (
          <RadarView
            specimens={radarSpecimens}
            loading={radarLoading}
            userCoords={coords}
            activeTargetName={activeTarget}
            onRefreshRadar={handleRefreshRadar}
            onSelectTarget={(target) => {
              setActiveTarget(target.commonName);
              setToast(`🎯 Set "${target.commonName}" as active expedition goal!`);
              setActiveView('expeditions');
            }}
            onClearTarget={() => setActiveTarget('')}
          />
        )}

        {activeView === 'expeditions' && (
          <ExpeditionsView
            stats={expeditionStats}
            quests={quests}
            activeTargetName={activeTarget}
            onClearTarget={() => setActiveTarget('')}
            onClaimQuest={handleClaimQuest}
            onGoToRadar={() => setActiveView('radar')}
            onGoToScanner={() => setActiveView('scanner')}
          />
        )}

        {/* 3D Holographic Card Result Modal */}
        {selectedCard && (
          <ResultModal
            selectedCard={selectedCard}
            cardIndex={cards.findIndex((c) => c.id === selectedCard.id) + 1 || 1}
            user={user}
            onClose={() => setSelectedCard(null)}
            onViewCollection={() => {
              setSelectedCard(null);
              setActiveView('collection');
            }}
            onToast={(msg) => setToast(msg)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar — strictly for logged-in explorers */}
      {user && (
        <BottomNav
          activeView={activeView}
          onSelectView={setActiveView}
          cardsCount={cards.length}
        />
      )}

      {/* Auth / Cloud Sync Modal */}
      <AuthModal
        user={user}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onToast={(msg) => setToast(msg)}
        onSetUser={(u) => {
          setUser(u);
          setActiveView('collection');
        }}
      />

      <Toast message={toast} onDismiss={() => setToast('')} />
    </div>
  );
}
