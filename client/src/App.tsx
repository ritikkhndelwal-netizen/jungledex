import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Discovery, ThemeType, HealthStatus, UserProfile, Quest, RadarSpecimen } from './types';
import {
  getStoredCards,
  saveCardToDB,
  deleteCardFromDB,
  fileToDataUrl,
  getQueuedScans,
  queueOfflineScan,
  removeQueuedScan,
  dataUrlToFile,
  type QueuedScan,
} from './services/db';
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
import {
  HomePage,
  DexPage,
  ScannerPage,
  RadarPage,
  ExpeditionsPage,
  CardDetailPage,
} from './pages';
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
  const [guestScansUsed, setGuestScansUsed] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('jungledex_guest_scans_used') || 0);
    } catch {
      return 0;
    }
  });

  // Offline & Queued Field Scans
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queuedScans, setQueuedScans] = useState<QueuedScan[]>([]);
  const [syncingQueue, setSyncingQueue] = useState<boolean>(false);

  // Expeditions & Quests State
  const [expeditionStats, setExpeditionStats] = useState<ExpeditionStats>(getStoredExpeditionStats());
  const [quests, setQuests] = useState<Quest[]>(getStoredQuests());
  const [activeTarget, setActiveTarget] = useState<string>('');
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(false);

  // Radar State
  const [radarSpecimens, setRadarSpecimens] = useState<RadarSpecimen[]>([]);
  const [radarLoading, setRadarLoading] = useState(false);

  // Environmental context
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [placeLabel, setPlaceLabel] = useState('Location not added');
  const [weather, setWeather] = useState('Weather not loaded');

  const lastCoordsRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Map internal views to friendly URL hashes for multi-page routing
  const viewToHash = (v: ActiveView, cardId?: string): string => {
    switch (v) {
      case 'collection': return '#/dex';
      case 'scanner': return '#/scan';
      case 'radar': return '#/radar';
      case 'expeditions': return '#/quests';
      case 'card-detail': return cardId ? `#/card/${cardId}` : (selectedCard ? `#/card/${selectedCard.id}` : '#/dex');
      default: return '#/home';
    }
  };

  const hashToView = (hash: string): ActiveView => {
    if (hash.startsWith('#/card/') || hash.includes('/card/')) return 'card-detail';
    if (hash.includes('dex')) return 'collection';
    if (hash.includes('scan')) return 'scanner';
    if (hash.includes('radar')) return 'radar';
    if (hash.includes('quest')) return 'expeditions';
    return 'landing';
  };

  const changeView = (view: ActiveView) => {
    if (view !== 'card-detail') {
      setSelectedCard(null);
    }
    setActiveView(view);
    const targetHash = viewToHash(view);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCardDetail = (card: Discovery) => {
    setSelectedCard(card);
    setActiveView('card-detail');
    const targetHash = `#/card/${card.id}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeCardDetail = () => {
    setSelectedCard(null);
    changeView('collection');
  };

  // Synchronize browser history and hash navigation
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      const v = hashToView(hash);
      if (v === 'card-detail') {
        const cardId = hash.replace(/^#\/card\//, '');
        const allSpecimens = [...cards, ...SAMPLE_CARDS];
        const match = allSpecimens.find((c) => c.id === cardId);
        if (match) {
          setSelectedCard(match);
        }
      }
      setActiveView(v);
    };

    if (window.location.hash) {
      handleHash();
    } else {
      window.location.hash = '#/home';
    }

    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [cards]);

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
        // Automatically migrate any guest trial cards to this user's account
        getStoredCards().then(async (localCards) => {
          const unassigned = localCards.filter((c) => !c.userId || c.userId === profile.uid);
          for (const card of unassigned) {
            if (!card.userId) {
              const updatedCard: Discovery = { ...card, userId: profile.uid };
              await saveCardToDB(updatedCard);
              await syncCardToCloud(profile.uid, updatedCard);
            }
          }
        });

        // Fetch cloud cards and merge with local collection
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

    // Load offline queued scans
    getQueuedScans().then((queued) => {
      setQueuedScans(queued);
    });

    const handleOnline = () => {
      setIsOnline(true);
      setToast('📶 Signal Restored: Device is back online!');
      soundEngine.playBeep(980, 0.05);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToast('📶 Offline: Photos will be saved to your Field Queue.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
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
    // Only track if user has explicitly activated an outdoor walk session
    if (!navigator.geolocation || !isTrackingActive) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy || 999;
        // Ignore low-accuracy positions (> 25m) typical of indoor Wi-Fi or laptops
        if (accuracy > 25) {
          return;
        }

        const current = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        if (lastCoordsRef.current) {
          const delta = haversineMeters(
            lastCoordsRef.current.latitude,
            lastCoordsRef.current.longitude,
            current.latitude,
            current.longitude
          );

          // Only accept movements that clearly exceed sensor inaccuracy (> max(8m, accuracy * 0.8))
          const minMovementThreshold = Math.max(8, accuracy * 0.8);
          if (delta >= minMovementThreshold && delta < 150) {
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
                      setToast(`Quest Complete: ${q.title}! (+${q.rewardXp} XP)`);
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
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTrackingActive]);

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

  // Toggle live outdoor expedition tracking session
  const handleToggleTracking = () => {
    const next = !isTrackingActive;
    setIsTrackingActive(next);
    if (next) {
      lastCoordsRef.current = null;
      soundEngine.playFanfare();
      setToast('Expedition Walk Started: Real-time GPS stride tracking enabled.');
    } else {
      soundEngine.playBeep(750, 0.05);
      setToast('Expedition Walk Paused: Stride tracking paused.');
    }
  };

  // Reset expedition telemetry (clears phantom steps/distance from laptop tests)
  const handleResetExpeditionStats = () => {
    const freshStats: ExpeditionStats = {
      distanceMeters: 0,
      estimatedSteps: 0,
      totalXp: 0,
      level: 1,
      unlockedBadges: [],
    };
    setExpeditionStats(freshStats);
    saveExpeditionStats(freshStats);
    soundEngine.playBeep(650, 0.08);
    setToast('Expedition telemetry reset back to 0.');
  };

  // Process offline queued scans when connection is restored
  const processQueuedScans = async () => {
    if (!navigator.onLine || syncingQueue || queuedScans.length === 0) return;
    setSyncingQueue(true);
    setToast(`Processing ${queuedScans.length} queued field observation(s)…`);

    for (const item of queuedScans) {
      try {
        const queueFile = dataUrlToFile(item.photoDataUrl, 'field-observation.jpg');
        const data = await identifySpecimen(queueFile, item.coordinates, (item.theme as ThemeType) || theme);

        const newCard: Discovery = {
          id: crypto.randomUUID(),
          name: data.name || 'Nature Discovery',
          scientificName: data.scientificName || 'Species / Phenomenon unconfirmed',
          category: data.category || 'Nature',
          rarity: data.rarity || 'Discovery',
          confidence: data.confidence || 'Verified AI Observation',
          description: data.description || 'A new observation from your outdoor adventure.',
          facts: Array.isArray(data.facts) ? data.facts.slice(0, 3) : [],
          image: item.photoDataUrl,
          date: new Date(item.timestamp).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          location: item.placeLabel,
          coordinates: item.coordinates,
          weather: item.weather,
          theme: (item.theme as ThemeType) || theme,
          modelUsed: data.modelUsed,
          isAiGenerated: data.isAiGenerated,
          aiGenerationReason: data.aiGenerationReason,
          userId: user?.uid,
        };

        await saveCardToDB(newCard);
        if (user) {
          await syncCardToCloud(user.uid, newCard);
        }
        await removeQueuedScan(item.id);

        setCards((prev) => [newCard, ...prev]);
        setQueuedScans((prev) => prev.filter((q) => q.id !== item.id));
        soundEngine.playFanfare();
        setToast(`🎉 Field Discovery Processed: "${newCard.name}" added to your Dex!`);
      } catch (err) {
        console.warn('[Queue Process Error]:', err);
        break;
      }
    }
    setSyncingQueue(false);
  };

  // Automatically process queue when connection is restored
  useEffect(() => {
    if (isOnline && queuedScans.length > 0 && !syncingQueue) {
      processQueuedScans();
    }
  }, [isOnline, queuedScans.length]);

  // AI Identification trigger
  const handleIdentify = async () => {
    if (!file || !photo) {
      setError('Capture or choose a photo first.');
      return;
    }

    // Guest Trial Protection: check if 1 free scan already used
    if (!user && guestScansUsed >= 1) {
      soundEngine.playBeep(600, 0.08);
      setToast("You've used your 1 free guest scan! Create a free account or sign in to continue scanning.");
      setAuthOpen(true);
      return;
    }

    // Offline Queue trigger: if device is offline, save observation locally
    if (!navigator.onLine) {
      const scanId = crypto.randomUUID();
      const queuedItem: QueuedScan = {
        id: scanId,
        photoDataUrl: photo,
        coordinates: coords || undefined,
        placeLabel: locationEnabled ? placeLabel : undefined,
        weather: locationEnabled ? weather : undefined,
        timestamp: Date.now(),
        theme,
      };
      await queueOfflineScan(queuedItem);
      setQueuedScans((prev) => [...prev, queuedItem]);
      setPhoto(null);
      setFile(null);
      soundEngine.playBeep(750, 0.08);
      setToast('📶 Offline: Photo saved to Field Queue! It will identify automatically when connection returns.');
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
      } else {
        // Track guest trial scan used
        const nextCount = guestScansUsed + 1;
        setGuestScansUsed(nextCount);
        try {
          localStorage.setItem('jungledex_guest_scans_used', String(nextCount));
        } catch {
          // ignore
        }
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
              setToast(`Quest Complete: ${q.title}! (+${q.rewardXp} XP)`);
              return { ...q, completed: true };
            }
          }
          return q;
        })
      );

      // Update state and navigate to dedicated card detail page
      setCards((prev) => [newCard, ...prev]);
      openCardDetail(newCard);
      setPhoto(null);
      setFile(null);

      soundEngine.playFanfare();
      setToast(
        !user
          ? `🎉 Free trial scan recorded: "${newCard.name}"! Sign in to save permanently to cloud.`
          : newCard.isAiGenerated
            ? `Visual analyzed: "${newCard.name}" (Tagged as AI-Generated)`
            : `Discovery recorded: "${newCard.name}"!`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Identification failed. Please try again.';
      if (message.includes('fetch failed') || message.includes('Failed to fetch') || !navigator.onLine) {
        const scanId = crypto.randomUUID();
        const queuedItem: QueuedScan = {
          id: scanId,
          photoDataUrl: photo,
          coordinates: coords || undefined,
          placeLabel: locationEnabled ? placeLabel : undefined,
          weather: locationEnabled ? weather : undefined,
          timestamp: Date.now(),
          theme,
        };
        await queueOfflineScan(queuedItem);
        setQueuedScans((prev) => [...prev, queuedItem]);
        setPhoto(null);
        setFile(null);
        soundEngine.playBeep(750, 0.08);
        setToast('📶 Signal dropped. Observation saved to Field Queue for auto-sync!');
      } else {
        setError(message);
      }
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
        closeCardDetail();
      }
      setToast('Card removed from collection.');
    }
  };

  const allCollectionCards = user ? cards : (cards.length > 0 ? cards : SAMPLE_CARDS);
  const currentCardIndex = selectedCard
    ? allCollectionCards.findIndex((c) => c.id === selectedCard.id)
    : -1;
  const prevCard = currentCardIndex > 0 ? allCollectionCards[currentCardIndex - 1] : undefined;
  const nextCard =
    currentCardIndex >= 0 && currentCardIndex < allCollectionCards.length - 1
      ? allCollectionCards[currentCardIndex + 1]
      : undefined;

  return (
    <div className={`app theme-${theme} view-${activeView} ${user ? 'is-logged-in' : 'is-logged-out'}`}>
      {/* Top Header */}
      <TopBar
        theme={theme}
        setTheme={setTheme}
        cardsCount={cards.length}
        health={health}
        user={user}
        isOnline={isOnline}
        queuedScansCount={queuedScans.length}
        activeView={activeView}
        onSelectView={changeView}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main View Router */}
      <main className="main-content-area">
        {activeView === 'landing' && (
          <HomePage
            user={user}
            theme={theme}
            cardsCount={cards.length}
            cards={cards}
            sampleCards={SAMPLE_CARDS}
            placeLabel={placeLabel}
            weather={weather}
            onOpenCard={openCardDetail}
            onGoToCollection={() => changeView('collection')}
            onGoToScanner={() => changeView('scanner')}
            onGoToRadar={() => changeView('radar')}
            onGoToExpeditions={() => changeView('expeditions')}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {activeView === 'collection' && (
          <DexPage
            cards={cards}
            sampleCards={SAMPLE_CARDS}
            user={user}
            onSelectCard={openCardDetail}
            onDeleteCard={handleDeleteCard}
            onGoToScanner={() => changeView('scanner')}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}

        {activeView === 'scanner' && (
          <ScannerPage
            photo={photo}
            file={file}
            busy={busy}
            error={error}
            locationEnabled={locationEnabled}
            placeLabel={placeLabel}
            weather={weather}
            user={user}
            guestScansUsed={guestScansUsed}
            isOnline={isOnline}
            queuedScansCount={queuedScans.length}
            syncingQueue={syncingQueue}
            onSyncQueue={processQueuedScans}
            onOpenAuth={() => setAuthOpen(true)}
            onFileSelect={handleFileSelect}
            onClearPhoto={handleClearPhoto}
            onEnableLocation={handleEnableLocation}
            onIdentify={handleIdentify}
            onBackToDex={() => changeView('collection')}
          />
        )}

        {activeView === 'radar' && (
          <RadarPage
            specimens={radarSpecimens}
            loading={radarLoading}
            userCoords={coords}
            activeTargetName={activeTarget}
            onRefreshRadar={handleRefreshRadar}
            onSelectTarget={(target) => {
              setActiveTarget(target.commonName);
              setToast(`Target Locked: "${target.commonName}" set as active expedition goal!`);
              changeView('expeditions');
            }}
            onClearTarget={() => setActiveTarget('')}
          />
        )}

        {activeView === 'expeditions' && (
          <ExpeditionsPage
            stats={expeditionStats}
            quests={quests}
            user={user}
            onOpenAuth={() => setAuthOpen(true)}
            activeTargetName={activeTarget}
            isTrackingActive={isTrackingActive}
            onToggleTracking={handleToggleTracking}
            onResetStats={handleResetExpeditionStats}
            onClearTarget={() => setActiveTarget('')}
            onClaimQuest={handleClaimQuest}
            onGoToRadar={() => changeView('radar')}
            onGoToScanner={() => changeView('scanner')}
          />
        )}

        {/* Dedicated Full-Page Specimen Detail Inspector */}
        {activeView === 'card-detail' && selectedCard && (
          <CardDetailPage
            card={selectedCard}
            cardIndex={currentCardIndex >= 0 ? currentCardIndex + 1 : 1}
            totalCards={allCollectionCards.length}
            user={user}
            onBack={closeCardDetail}
            onNavigatePrev={prevCard ? () => openCardDetail(prevCard) : undefined}
            onNavigateNext={nextCard ? () => openCardDetail(nextCard) : undefined}
            onDeleteCard={handleDeleteCard}
            onToast={(msg) => setToast(msg)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar — only visible when explorer is signed in */}
      {user && (
        <BottomNav
          activeView={activeView}
          onSelectView={changeView}
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
