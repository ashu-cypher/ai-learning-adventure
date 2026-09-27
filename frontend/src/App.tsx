import React, { useState, useEffect, useCallback } from 'react';
import { WorldSummary, LessonPlan } from './types';
import { api } from './services/api';
import { sound } from './audio/soundEngine';
import { ChildHeader } from './components/navigation/ChildHeader';
import { WelcomeScreen } from './components/welcome/WelcomeScreen';
import { ProgressMap } from './components/map/ProgressMap';
import { StageContainer } from './components/stages/StageContainer';
import { ParentDashboardModal } from './components/parent/ParentDashboardModal';
import { GamesScreen } from './components/menu/GamesScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { MobileSimulator } from './components/simulator/MobileSimulator';
import { getCurrentUser, onAuthChange, signOut, type User } from './services/auth';
import { SettingsModal } from './components/settings/SettingsModal';
import { settingsStore } from './engine/settingsStore';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'map' | 'stage' | 'games'>('welcome');
  const [worlds, setWorlds] = useState<WorldSummary[]>([]);
  const [activeWorldId, setActiveWorldId] = useState<string>('colors');
  const [currentLesson, setCurrentLesson] = useState<LessonPlan | null>(null);
  const [totalStars, setTotalStars] = useState<number>(0);
  const [isParentGateOpen, setIsParentGateOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  // Parent Google sign-in (Gmail auth)
  const [user, setUser] = useState<User | null>(() => getCurrentUser());
  const [showLogin, setShowLogin] = useState(false);
  // Settings modal (language, sound, voice check)
  const [showSettings, setShowSettings] = useState(false);
  // Quick-play: jump straight into a game from the home screen
  const [quickGameId, setQuickGameId] = useState<string | null>(null);

  useEffect(() => {
    // Sync the sound engine with the persisted Settings choice
    sound.isMuted = !settingsStore.isSoundEnabled();
  }, []);

  useEffect(() => {
    // Keep auth state in sync (native + web)
    const unsubscribe = onAuthChange(setUser);
    return unsubscribe;
  }, []);

  const handleParentSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  // Load worlds and compute total stars
  const loadWorldsData = useCallback(async () => {
    try {
      const data = await api.fetchWorlds();
      setWorlds(data);
      // Sum all stars
      let starsSum = 0;
      data.forEach(w => {
        w.stages.forEach(s => {
          starsSum += s.stars;
        });
      });
      setTotalStars(starsSum);
    } catch (err) {
      console.error('Error fetching worlds:', err);
    }
  }, []);

  useEffect(() => {
    loadWorldsData();
  }, [loadWorldsData]);

  // Load lesson plan when activeStageId changes
  const loadStageLesson = useCallback(async (worldId: string, stageId: string) => {
    setLoading(true);
    try {
      const lesson = await api.fetchStageLesson(worldId, stageId);
      setCurrentLesson(lesson);
      setActiveWorldId(worldId);
      setCurrentScreen('stage');
    } catch (err) {
      console.error('Error loading lesson:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartAdventure = () => {
    // Launch directly into Stage 1 of Colors
    loadStageLesson('colors', 'colors-1');
  };

  const handleStageSelect = (worldId: string, stageId: string) => {
    loadStageLesson(worldId, stageId);
  };

  const handleStageComplete = async (nextStageId?: string) => {
    await loadWorldsData();
    if (nextStageId) {
      loadStageLesson(activeWorldId, nextStageId);
    } else {
      // Completed all stages in this world! Show map
      sound.playSuccessChime();
      setCurrentScreen('map');
    }
  };

  return (
    <MobileSimulator
      onNavigateHome={() => setCurrentScreen('welcome')}
      onNavigateMap={() => setCurrentScreen('map')}
      onNavigateGames={() => {
        sound.playPop();
        setQuickGameId(null);
        setCurrentScreen('games');
      }}
    >
      <div className="min-h-full flex-1 text-slate-800 flex flex-col font-sans relative selection:bg-amber-200 overflow-x-hidden bg-gradient-to-b from-sky-200 via-rose-100 to-amber-100">
        {/* Playful drifting background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="animate-blob absolute -top-10 -left-10 w-64 h-64 rounded-full bg-pink-300/50 blur-2xl" />
          <div className="animate-blob-slow absolute top-1/3 -right-16 w-80 h-80 rounded-full bg-amber-300/50 blur-2xl" />
          <div className="animate-blob absolute bottom-10 left-1/4 w-72 h-72 rounded-full bg-sky-300/50 blur-2xl" />
          <div className="animate-blob-slow absolute top-10 right-1/3 w-40 h-40 rounded-full bg-violet-300/40 blur-2xl" />
          {/* Floating decorative emojis */}
          <div className="animate-float absolute top-24 left-6 text-4xl opacity-60">🌈</div>
          <div className="animate-float absolute top-64 right-8 text-4xl opacity-60" style={{ animationDelay: '0.8s' }}>⭐</div>
          <div className="animate-float absolute bottom-32 left-10 text-4xl opacity-60" style={{ animationDelay: '1.6s' }}>🎈</div>
          <div className="animate-float absolute bottom-56 right-12 text-4xl opacity-60" style={{ animationDelay: '2.2s' }}>🦋</div>
        </div>

        {/* Inner Content */}
        <div className="relative z-10 flex flex-col min-h-full flex-1">
      {/* Top Header */}
      <ChildHeader
        currentStars={totalStars}
        onNavigateHome={() => setCurrentScreen('welcome')}
        onNavigateMap={() => setCurrentScreen('map')}
        onNavigateGames={() => {
          sound.playPop();
          setCurrentScreen('games');
        }}
        onOpenParentGate={() => setIsParentGateOpen(true)}
        onOpenSettings={() => setShowSettings(true)}
        currentScreen={currentScreen}
      />

      {/* Main Content View */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="font-bubble text-xl font-bold text-amber-900 animate-pulse">
              Milo is setting up the adventure... 🌟
            </p>
          </div>
        ) : currentScreen === 'welcome' ? (
          <WelcomeScreen
            onStartAdventure={handleStartAdventure}
            onPlayGames={() => {
              sound.playPop();
              setQuickGameId(null);
              setCurrentScreen('games');
            }}
            onQuickPlayGame={(gameId) => {
              setQuickGameId(gameId);
              setCurrentScreen('games');
            }}
            parentUser={user}
            onParentSignIn={() => setShowLogin(true)}
            onParentSignOut={handleParentSignOut}
          />
        ) : currentScreen === 'games' ? (
          <GamesScreen
            initialGameId={quickGameId}
            onBack={() => {
              setQuickGameId(null);
              setCurrentScreen('welcome');
            }}
            onGoToLearning={() => setCurrentScreen('map')}
          />
        ) : currentScreen === 'map' ? (
          <ProgressMap
            worlds={worlds}
            activeWorldId={activeWorldId}
            onSelectWorld={(wId) => setActiveWorldId(wId)}
            onSelectStage={handleStageSelect}
          />
        ) : currentScreen === 'stage' && currentLesson ? (
          <StageContainer
            lesson={currentLesson}
            onStageComplete={handleStageComplete}
            onGoToMap={() => {
              loadWorldsData();
              setCurrentScreen('map');
            }}
          />
        ) : null}
      </main>

      {/* Parent Area Modal */}
      <ParentDashboardModal
        isOpen={isParentGateOpen}
        onClose={() => setIsParentGateOpen(false)}
        onResetComplete={() => {
          loadWorldsData();
          setCurrentScreen('welcome');
          setIsParentGateOpen(false);
        }}
      />

      {/* Settings (language, sound, voice check) */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Parent Google Sign-In */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md">
            <LoginScreen
              onLogin={(u) => {
                setUser(u);
                setShowLogin(false);
                sound.playSuccessChime();
              }}
            />
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 text-slate-600 font-bubble font-bold text-xl shadow active:scale-95 transition-transform"
              aria-label="Close sign in"
            >
              ✕
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </MobileSimulator>
  );
};

export default App;
