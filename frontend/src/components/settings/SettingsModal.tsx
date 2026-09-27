import React, { useState } from 'react';
import { X, Volume2, VolumeX, Languages, Stethoscope, Sparkles } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { settingsStore, useKidSettings, type KidLang } from '../../engine/settingsStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Child-friendly Settings: the ONLY place language is chosen.
 * Big buttons, instant voice preview in the picked language.
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { lang, soundEnabled } = useKidSettings();
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [testingVoice, setTestingVoice] = useState(false);

  if (!isOpen) return null;

  const pickLanguage = (next: KidLang) => {
    settingsStore.setLang(next);
    sound.playSparkle();
    // Instant preview so the parent hears the difference immediately
    if (next === 'hi') {
      sound.speak('नमस्ते! अब मैं हिंदी में बात करूँगा!', 'hi');
    } else {
      sound.speak("Hi! Now I'll talk in English!", 'en');
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    settingsStore.setSoundEnabled(next);
    if (next) {
      sound.isMuted = false;
      sound.playPop();
    } else {
      sound.isMuted = true;
      sound.stopSpeaking();
    }
  };

  const handleTestVoice = async () => {
    setTestingVoice(true);
    setVoiceStatus('Checking voice engine...');
    try {
      const status = await sound.checkVoiceEngine();
      const bits: string[] = [];
      bits.push(`Engine: ${status.platform === 'android-native' ? 'Android native TTS' : status.platform === 'web' ? 'Web speech' : 'NONE FOUND'}`);
      bits.push(`Voices loaded: ${status.voiceCount}`);
      bits.push(`Hindi voice: ${status.hindiVoiceAvailable ? 'yes' : 'no'}`);
      bits.push(`Audio unlocked: ${status.audioUnlocked ? 'yes' : 'not yet — tap something first'}`);
      if (status.lastError) bits.push(`Last error: ${status.lastError}`);
      setVoiceStatus(bits.join(' • '));
      const l = settingsStore.getLang();
      if (l === 'hi') {
        sound.speak('नमस्ते! मीलो आपसे बात करने के लिए तैयार है!', 'hi', () => setTestingVoice(false));
      } else {
        sound.speak('Hello! Milo is ready to talk with you!', 'en', () => setTestingVoice(false));
      }
    } catch (err) {
      setVoiceStatus(`Voice check failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      setTestingVoice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="bg-white rounded-3xl border-4 border-violet-200 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative animate-pop-in">
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          aria-label="Close settings"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-3xl shadow-md">
            ⚙️
          </div>
          <h2 className="font-bubble font-extrabold text-2xl text-slate-800">Settings</h2>
        </div>

        {/* Language — the one and only place to change it */}
        <div className="mb-6">
          <h3 className="font-bubble font-extrabold text-lg text-slate-700 mb-3 flex items-center gap-2">
            <Languages className="w-5 h-5 text-violet-600" />
            Talking Language
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => pickLanguage('en')}
              className={`min-h-[88px] rounded-3xl border-4 font-bubble font-extrabold text-xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 ${
                lang === 'en'
                  ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white border-blue-300 shadow-xl scale-105'
                  : 'bg-sky-50 text-sky-800 border-sky-200'
              }`}
            >
              <span className="text-4xl">🇬🇧</span>
              <span>English</span>
              {lang === 'en' && <span className="text-sm font-bold">✓ Selected</span>}
            </button>
            <button
              onClick={() => pickLanguage('hi')}
              className={`min-h-[88px] rounded-3xl border-4 font-bubble font-extrabold text-xl flex flex-col items-center justify-center gap-1 transition-transform active:scale-95 ${
                lang === 'hi'
                  ? 'bg-gradient-to-br from-orange-400 to-rose-500 text-white border-orange-300 shadow-xl scale-105'
                  : 'bg-orange-50 text-orange-800 border-orange-200'
              }`}
            >
              <span className="text-4xl">🇮🇳</span>
              <span>हिंदी</span>
              {lang === 'hi' && <span className="text-sm font-bold">✓ चुना गया</span>}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Milo and all games will talk in this language.
          </p>
        </div>

        {/* Sound on/off */}
        <button
          onClick={toggleSound}
          className={`w-full min-h-[72px] rounded-3xl border-4 font-bubble font-extrabold text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 mb-6 ${
            soundEnabled
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white border-emerald-300 shadow-xl'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-8 h-8" /> : <VolumeX className="w-8 h-8" />}
          <span>Sound: {soundEnabled ? 'ON 🔊' : 'OFF 🔇'}</span>
        </button>

        {/* Voice health */}
        <div className="bg-violet-50 border-2 border-violet-200 rounded-3xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bubble font-extrabold text-slate-700 flex items-center gap-1.5">
              <Stethoscope className="w-5 h-5 text-violet-600" />
              Voice Check
            </span>
            <button
              onClick={handleTestVoice}
              disabled={testingVoice}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bubble font-bold px-4 py-2 rounded-2xl shadow active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{testingVoice ? 'Testing...' : 'Test Voice'}</span>
            </button>
          </div>
          {voiceStatus && (
            <p className="text-xs text-slate-600 bg-white border border-violet-200 rounded-2xl p-3 leading-relaxed">
              {voiceStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
