import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  Smartphone,
  RotateCw,
  Volume2,
  Sparkles,
  RefreshCw,
  Maximize2,
  Gamepad2,
  MapPin,
  Home,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { resetAllProgress } from '../../engine/progressStore';

interface MobileSimulatorProps {
  children: React.ReactNode;
  onNavigateHome: () => void;
  onNavigateMap: () => void;
  onNavigateGames: () => void;
}

interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  deviceType: 'phone' | 'tablet';
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'pixel-8', name: 'Google Pixel 8', width: 393, height: 852, deviceType: 'phone' },
  { id: 'galaxy-s24', name: 'Samsung Galaxy S24', width: 360, height: 780, deviceType: 'phone' },
  { id: 'iphone-15', name: 'iPhone 15 / Galaxy A54', width: 393, height: 852, deviceType: 'phone' },
  { id: 'tablet', name: 'Android Tablet (8")', width: 600, height: 960, deviceType: 'tablet' },
];

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({
  children,
  onNavigateHome,
  onNavigateMap,
  onNavigateGames,
}) => {
  // If running inside native Android APK, render child directly (no frame)
  const isNative = Capacitor.isNativePlatform();

  const [simulatorEnabled, setSimulatorEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // Default to true on desktop screens (> 1024px)
    return window.innerWidth >= 1024;
  });

  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[0]);
  const [isLandscape, setIsLandscape] = useState(false);
  const [scale, setScale] = useState<number>(0.9);
  const [isTestDrawerOpen, setIsTestDrawerOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('9:41');

  // Clock in status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const flashStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleTestAudio = async () => {
    sound.playSuccessChime();
    await sound.speak(
      "Hello! Milo's voice and audio engine are working perfectly for local testing!",
      'en'
    );
    flashStatus('🔊 Voice & Audio tested!');
  };

  const handleTestHindiAudio = async () => {
    sound.playPop();
    await sound.speak('नमस्ते! खेल का ऑडियो बहुत अच्छे से चल रहा है!', 'hi');
    flashStatus('🇮🇳 Hindi voice tested!');
  };

  const handleResetData = () => {
    if (confirm('Reset all progress & local game data to test fresh start?')) {
      resetAllProgress();
      localStorage.removeItem('ala_user');
      localStorage.removeItem('ala_game_stats');
      flashStatus('🔄 Reset complete! Reloading...');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  const handleAddStars = () => {
    try {
      const raw = localStorage.getItem('ala_child');
      const child = raw ? JSON.parse(raw) : { id: 'default-child', name: 'Little Explorer', total_stars: 0 };
      child.total_stars = (child.total_stars || 0) + 10;
      localStorage.setItem('ala_child', JSON.stringify(child));
      sound.playFanfare();
      flashStatus(`⭐ Added 10 Stars! (Total: ${child.total_stars})`);
      setTimeout(() => window.location.reload(), 500);
    } catch {
      flashStatus('Failed to add stars');
    }
  };

  // If inside native APK, don't show any simulator frame
  if (isNative) {
    return <>{children}</>;
  }

  const effectiveWidth = isLandscape ? selectedDevice.height : selectedDevice.width;
  const effectiveHeight = isLandscape ? selectedDevice.width : selectedDevice.height;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center">
      {/* Top Testing Control Bar */}
      <header className="w-full bg-slate-800/90 backdrop-blur border-b border-slate-700/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-50 shadow-md">
        {/* Left: Title & Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bubble text-sm text-amber-400 font-bold">
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>AI Learning Adventure — Local Tester</span>
          </div>

          <button
            onClick={() => setSimulatorEnabled(!simulatorEnabled)}
            className={`px-2.5 py-1 rounded-full font-bold transition-all flex items-center gap-1.5 ${
              simulatorEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            title="Toggle between Phone Simulation and Responsive Full Screen"
          >
            {simulatorEnabled ? (
              <>
                <Smartphone className="w-3.5 h-3.5" /> 📱 Phone Frame Mode
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> 🖥️ Full Screen Mode
              </>
            )}
          </button>
        </div>

        {/* Center: Device Presets & Controls (only when simulator enabled) */}
        {simulatorEnabled && (
          <div className="flex items-center gap-2">
            <select
              value={selectedDevice.id}
              onChange={(e) => {
                const found = DEVICE_PRESETS.find((d) => d.id === e.target.value);
                if (found) setSelectedDevice(found);
              }}
              className="bg-slate-700 text-slate-100 text-xs rounded-lg px-2 py-1 border border-slate-600 focus:outline-none focus:ring-1 focus:ring-pink-500"
            >
              {DEVICE_PRESETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.width}×{d.height})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsLandscape(!isLandscape)}
              className={`p-1.5 rounded-lg border transition-all ${
                isLandscape
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              }`}
              title="Rotate Screen (Portrait / Landscape)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1 bg-slate-700 px-2 py-0.5 rounded-lg border border-slate-600">
              <span className="text-slate-400">Zoom:</span>
              {[0.75, 0.85, 0.95, 1.0].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`px-1 rounded ${scale === s ? 'bg-pink-600 text-white font-bold' : 'text-slate-300 hover:text-white'}`}
                >
                  {Math.round(s * 100)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: Quick Action Shortcuts */}
        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-amber-300 font-bold bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded animate-pulse">
              {statusMessage}
            </span>
          )}

          <button
            onClick={() => setIsTestDrawerOpen(!isTestDrawerOpen)}
            className="px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold flex items-center gap-1 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dev Tools</span>
          </button>
        </div>
      </header>

      {/* Dev Tools Drawer / Popover */}
      {isTestDrawerOpen && (
        <div className="w-full bg-slate-800/95 border-b border-slate-700 p-3 z-40 text-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Fast Jump:
            </span>
            <button
              onClick={() => {
                onNavigateHome();
                setIsTestDrawerOpen(false);
              }}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-1"
            >
              <Home className="w-3 h-3 text-sky-400" /> Welcome
            </button>
            <button
              onClick={() => {
                onNavigateMap();
                setIsTestDrawerOpen(false);
              }}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-emerald-400" /> Worlds Map
            </button>
            <button
              onClick={() => {
                onNavigateGames();
                setIsTestDrawerOpen(false);
              }}
              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded flex items-center gap-1"
            >
              <Gamepad2 className="w-3 h-3 text-pink-400" /> Games Hub
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Audio & Engine:
            </span>
            <button
              onClick={handleTestAudio}
              className="px-2 py-1 bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 rounded flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" /> Test English TTS
            </button>
            <button
              onClick={handleTestHindiAudio}
              className="px-2 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40 rounded flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" /> Test Hindi TTS
            </button>
            <button
              onClick={handleAddStars}
              className="px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-200 border border-yellow-500/40 rounded flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> +10 Stars
            </button>
            <button
              onClick={handleResetData}
              className="px-2 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 border border-rose-500/40 rounded flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reset Storage
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-sky-400" />
            <span>Press <kbd className="bg-slate-700 px-1 rounded text-white">F12</kbd> &rarr; <kbd className="bg-slate-700 px-1 rounded text-white">Ctrl+Shift+M</kbd> in Chrome to emulate touch</span>
          </div>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 w-full flex items-center justify-center p-2 sm:p-6 overflow-auto">
        {simulatorEnabled ? (
          /* Phone Device Frame */
          <div
            className="transition-all duration-300 flex flex-col items-center justify-center"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          >
            {/* Phone Bezel */}
            <div
              className="relative bg-slate-950 rounded-[48px] p-3.5 shadow-2xl ring-1 ring-slate-800 shadow-pink-500/10 border-4 border-slate-800 flex flex-col overflow-hidden"
              style={{
                width: effectiveWidth + 28,
                height: effectiveHeight + 28,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(236, 72, 153, 0.15)',
              }}
            >
              {/* Dynamic Island / Notch */}
              {!isLandscape && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
                  <div className="w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 text-[10px] text-slate-400 ring-1 ring-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700" />
                  </div>
                </div>
              )}

              {/* Native Status Bar */}
              <div
                className="w-full h-8 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-700 select-none z-40 bg-transparent shrink-0"
                style={{ width: effectiveWidth }}
              >
                <span>{currentTime}</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span>5G</span>
                  <span>📶</span>
                  <span>100% 🔋</span>
                </div>
              </div>

              {/* Screen Area */}
              <div
                className="flex-1 w-full rounded-[36px] overflow-y-auto overflow-x-hidden bg-white text-slate-800 relative flex flex-col"
                style={{ width: effectiveWidth, height: effectiveHeight - 32 }}
              >
                {children}
              </div>

              {/* Bottom Home Indicator Bar */}
              <div className="w-full h-4 flex items-center justify-center shrink-0 z-40 pt-1">
                <div className="w-32 h-1 bg-slate-400/60 rounded-full" />
              </div>
            </div>

            {/* Device Label under frame */}
            <div className="mt-3 text-slate-400 text-xs font-mono flex items-center gap-2">
              <span>{selectedDevice.name}</span>
              <span>•</span>
              <span>{effectiveWidth} × {effectiveHeight} px</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready for APK
              </span>
            </div>
          </div>
        ) : (
          /* Full Responsive Mode */
          <div className="w-full h-full min-h-screen bg-white rounded-xl shadow-xl overflow-hidden flex flex-col">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};
