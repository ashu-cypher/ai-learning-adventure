import React, { useState } from 'react';
import { LogIn, ShieldCheck, Heart } from 'lucide-react';
import { MiloCompanion } from '../character/MiloCompanion';
import { signInWithGoogle, type User } from '../../services/auth';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

/**
 * Child-friendly parent sign-in screen.
 * Explains (to the grown-up) why sign-in exists, then offers a big,
 * colorful "Sign in with Google" button. Kids just see Milo.
 */
export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong signing in. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-amber-100 via-orange-50 to-pink-100">
      {/* Milo greets the family */}
      <MiloCompanion
        size="lg"
        mood="happy"
        speechText="Hi! I'm Milo! Ask a grown-up to sign in so we can save your stars!"
        showBubble
      />

      <h1 className="mt-6 text-4xl font-extrabold text-orange-900 text-center tracking-tight">
        AI Learning Adventure
      </h1>
      <p className="mt-2 text-lg text-orange-700/80 text-center max-w-md">
        A safe, self-learning playground for little explorers.
      </p>

      {/* Parent info card */}
      <div className="mt-6 w-full max-w-md rounded-3xl bg-white/80 shadow-lg p-5 border-2 border-orange-200">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800">For grown-ups</p>
            <p className="text-sm text-slate-600 mt-1">
              Signing in with Google saves your child's stars, game scores and
              favorites on this device. Everything stays offline on your phone —
              we never upload play data anywhere.
            </p>
          </div>
        </div>
      </div>

      {/* Big colorful Google sign-in button */}
      <button
        onClick={handleSignIn}
        disabled={busy}
        className="mt-6 w-full max-w-md flex items-center justify-center gap-3 rounded-full
                   bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500
                   px-8 py-5 text-2xl font-extrabold text-white shadow-xl
                   active:scale-95 transition-transform disabled:opacity-60 disabled:active:scale-100"
        aria-label="Sign in with Google"
      >
        {busy ? (
          <span className="animate-pulse">Signing in…</span>
        ) : (
          <>
            {/* Google "G" mark */}
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white font-black text-2xl">
              <span className="text-blue-600">G</span>
            </span>
            <LogIn className="w-7 h-7" />
            Sign in with Google
          </>
        )}
      </button>

      {error && (
        <p className="mt-4 text-red-600 font-semibold text-center max-w-md">{error}</p>
      )}

      <p className="mt-6 flex items-center gap-2 text-sm text-orange-800/70">
        <Heart className="w-4 h-4 text-pink-500" />
        Made with love for curious little minds
      </p>
    </div>
  );
};
