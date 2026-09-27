import React, { useState, useEffect } from 'react';
import { ParentDashboardData } from '../../types';
import { api } from '../../services/api';
import { sound } from '../../audio/soundEngine';
import { ShieldCheck, X, Star, CheckCircle, AlertCircle, RefreshCw, BookOpen, Sparkles, Volume2, Stethoscope } from 'lucide-react';

interface ParentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
}

export const ParentDashboardModal: React.FC<ParentDashboardProps> = ({
  isOpen,
  onClose,
  onResetComplete,
}) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [mathProblem, setMathProblem] = useState({ a: 4, b: 3, answer: 7 });
  const [parentInput, setParentInput] = useState('');
  const [gateError, setGateError] = useState(false);

  const [data, setData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const [testingVoice, setTestingVoice] = useState(false);

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
      // Speak the test line out loud (English then Hindi)
      sound.speak('Hello! Milo is ready to talk with you!', 'en', () => {
        sound.speak('नमस्ते! मीलो आपसे बात करने के लिए तैयार है!', 'hi', () => {
          setTestingVoice(false);
        });
      });
    } catch (err) {
      setVoiceStatus(`Voice check failed: ${err instanceof Error ? err.message : 'unknown error'}`);
      setTestingVoice(false);
    }
  };

  // Generate new math problem on open
  useEffect(() => {
    if (isOpen) {
      const a = Math.floor(Math.random() * 6) + 3;
      const b = Math.floor(Math.random() * 5) + 2;
      setMathProblem({ a, b, answer: a + b });
      setIsUnlocked(false);
      setParentInput('');
      setGateError(false);
    }
  }, [isOpen]);

  const handleUnlockGate = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(parentInput.trim(), 10) === mathProblem.answer) {
      setIsUnlocked(true);
      sound.playPop();
      loadDashboard();
    } else {
      setGateError(true);
      sound.playGentleEncouragement();
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.fetchParentDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!window.confirm("Are you sure you want to reset all game progress? This will reset stars and stages.")) {
      return;
    }
    setResetting(true);
    try {
      await api.resetProgress();
      sound.playPop();
      await loadDashboard();
      onResetComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
      <div className="bg-white rounded-3xl border-4 border-indigo-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col p-6 relative">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Parent & Teacher Area</h2>
            <p className="text-sm text-slate-500">Learning analytics, concept mastery & recommendations</p>
          </div>
        </div>

        {/* STEP 1: PARENT GATE */}
        {!isUnlocked ? (
          <div className="flex flex-col items-center text-center py-8">
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Parent Gate Verification</h3>
              <p className="text-sm text-slate-600 mb-4">
                To keep the child interface safe, please solve this simple question:
              </p>

              <form onSubmit={handleUnlockGate} className="flex flex-col items-center gap-4">
                <div className="text-3xl font-extrabold text-indigo-700 font-mono tracking-wider">
                  {mathProblem.a} + {mathProblem.b} = ?
                </div>

                <input
                  type="number"
                  value={parentInput}
                  onChange={(e) => {
                    setParentInput(e.target.value);
                    setGateError(false);
                  }}
                  placeholder="Enter answer"
                  className="w-36 text-center text-2xl font-bold py-2 border-2 border-slate-300 rounded-xl focus:border-indigo-500 outline-none"
                  autoFocus
                />

                {gateError && (
                  <p className="text-sm font-semibold text-rose-500">
                    Incorrect answer. Please try again!
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
                >
                  Enter Parent Area
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* STEP 2: DASHBOARD CONTENT */
          <div className="flex flex-col gap-6 py-2">
            {loading ? (
              <div className="text-center py-10 font-bubble text-lg text-slate-500">Loading progress...</div>
            ) : data ? (
              <>
                {/* Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col items-center">
                    <Star className="w-6 h-6 text-amber-500 fill-amber-400 mb-1" />
                    <span className="text-2xl font-bold text-amber-900">{data.total_stars}</span>
                    <span className="text-xs text-amber-700 uppercase font-semibold">Stars Earned</span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col items-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 mb-1" />
                    <span className="text-2xl font-bold text-emerald-900">{data.total_stages_completed} / {data.total_stages_available}</span>
                    <span className="text-xs text-emerald-700 uppercase font-semibold">Stages Completed</span>
                  </div>

                  <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex flex-col items-center col-span-2 sm:col-span-1">
                    <Sparkles className="w-6 h-6 text-sky-600 mb-1" />
                    <span className="text-2xl font-bold text-sky-900">{data.overall_progress_percentage}%</span>
                    <span className="text-xs text-sky-700 uppercase font-semibold">Overall Mastery</span>
                  </div>
                </div>

                {/* AI Companion Notes */}
                <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl">
                  <h4 className="font-bold text-indigo-950 text-sm mb-1 flex items-center gap-1.5">
                    <span>🐰 Milo's Learning Notes:</span>
                  </h4>
                  <p className="text-sm text-indigo-900 leading-relaxed">
                    {data.ai_companion_notes}
                  </p>
                </div>

                {/* Concept Mastery Breakdown */}
                <div>
                  <h4 className="font-bold text-slate-800 text-base mb-3 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>Concept Mastery Breakdown</span>
                  </h4>

                  {data.concept_masteries.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No concept activities recorded yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.concept_masteries.map((m) => (
                        <div key={m.concept} className="bg-slate-50 border rounded-2xl p-3 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold capitalize text-slate-700 text-sm">
                              {m.concept.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                              {Math.round(m.mastery * 100)}%
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-1">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                m.mastery >= 0.8 ? 'bg-emerald-500' : m.mastery >= 0.5 ? 'bg-amber-500' : 'bg-rose-400'
                              }`}
                              style={{ width: `${Math.round(m.mastery * 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                            <span>Attempts: {m.attempts}</span>
                            <span>Mistakes: {m.mistakes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recommended Practice */}
                <div>
                  <h4 className="font-bold text-slate-800 text-base mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    <span>Recommended Parent Practice</span>
                  </h4>
                  <ul className="list-disc list-inside text-sm text-slate-600 space-y-1 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                    {data.recommended_activities.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>

                {/* Reset Progress Section */}
                <div className="border-t pt-4 mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Need to start over for another child?</span>
                  <button
                    onClick={handleResetProgress}
                    disabled={resetting}
                    className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold px-3 py-1.5 border border-rose-200 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                    <span>Reset All Progress</span>
                  </button>
                </div>

                {/* Voice Engine Test */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-violet-600" />
                      Voice Engine Health
                    </span>
                    <button
                      onClick={handleTestVoice}
                      disabled={testingVoice}
                      className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-bold px-4 py-2 rounded-xl shadow active:scale-95 transition-all"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{testingVoice ? 'Testing...' : '🔊 Test Voice'}</span>
                    </button>
                  </div>
                  {voiceStatus && (
                    <p className="text-xs text-slate-600 bg-violet-50 border border-violet-200 rounded-xl p-3 leading-relaxed">
                      {voiceStatus}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    Tip: if no voice plays on the installed APK, install "Google Text-to-Speech" from the Play Store and rebuild the app after running npm install + npx cap sync android.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};
