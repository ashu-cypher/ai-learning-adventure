/**
 * Voice engine diagnostics for AI Learning Adventure.
 *
 * Run `runVoiceDiagnostics()` (optionally with a spoken test) to get a
 * human-readable report about why voice may not be working — especially
 * useful on Android APK builds where WebView speechSynthesis is flaky.
 */
import { sound, type VoiceEngineStatus } from './soundEngine';

export interface VoiceDiagnosticCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface VoiceDiagnosticReport {
  timestamp: string;
  engine: VoiceEngineStatus;
  checks: VoiceDiagnosticCheck[];
  /** True when every critical check passed */
  healthy: boolean;
  /** Short spoken-test outcome, present only when speakTest was requested */
  speakTestResult?: 'ok' | 'failed' | 'skipped';
  speakTestDetail?: string;
  summary: string;
}

export interface VoiceDiagnosticsOptions {
  /**
   * Speak a short test phrase and verify the onEnd callback fires.
   * Defaults to false so diagnostics stay silent.
   */
  speakTest?: boolean;
  /** How long to wait for the spoken test to finish (ms). Default 8000. */
  speakTestTimeoutMs?: number;
}

const TEST_PHRASE = 'Hello! Milo is ready to play with you.';

function buildChecks(status: VoiceEngineStatus): VoiceDiagnosticCheck[] {
  const checks: VoiceDiagnosticCheck[] = [];

  checks.push({
    name: 'TTS engine available',
    passed: status.platform !== 'unavailable',
    detail:
      status.platform === 'unavailable'
        ? 'Neither the native TTS plugin nor window.speechSynthesis is available.'
        : status.platform === 'android-native'
        ? 'Using the native Capacitor Text-to-Speech plugin.'
        : 'Using the browser Web Speech API (window.speechSynthesis).',
  });

  checks.push({
    name: 'Voices loaded',
    // Native plugin manages its own voices, so only the web path needs them
    passed: status.platform === 'android-native' || status.voicesLoaded,
    detail:
      status.platform === 'android-native'
        ? 'Native engine handles voices internally.'
        : status.voicesLoaded
        ? `${status.voiceCount} voice(s) found.`
        : 'No voices yet — on Android WebView, voices only appear after the voiceschanged event. If this stays empty, install Google TTS / a voice pack on the device.',
  });

  checks.push({
    name: 'Hindi voice available',
    passed: status.hindiVoiceAvailable,
    detail:
      status.platform === 'android-native'
        ? 'Native engine handles Hindi voices via the OS.'
        : status.hindiVoiceAvailable
        ? `${status.hindiVoiceCount} Hindi voice(s) found.`
        : 'No Hindi (hi-IN) voice found — on Android, install Google Text-to-Speech and a Hindi voice pack from the Play Store.',
  });

  checks.push({
    name: 'Audio unlocked',
    passed: status.audioUnlocked,
    detail: status.audioUnlocked
      ? 'AudioContext unlocked by a user gesture.'
      : 'No user gesture seen yet — tap the screen once, then re-run diagnostics.',
  });

  if (status.lastError) {
    checks.push({
      name: 'No recent speech errors',
      passed: false,
      detail: status.lastError,
    });
  } else {
    checks.push({
      name: 'No recent speech errors',
      passed: true,
      detail: 'No errors recorded since app start.',
    });
  }

  return checks;
}

function summarize(
  checks: VoiceDiagnosticCheck[],
  speakTestResult?: VoiceDiagnosticReport['speakTestResult']
): { healthy: boolean; summary: string } {
  const failed = checks.filter((c) => !c.passed);
  const healthy = failed.length === 0 && speakTestResult !== 'failed';
  let summary: string;
  if (healthy) {
    summary = 'Voice engine looks healthy.';
  } else {
    summary = `Issues found: ${failed.map((c) => c.name).join(', ')}${
      speakTestResult === 'failed' ? ', spoken test' : ''
    }.`;
  }
  return { healthy, summary };
}

/**
 * Test the voice engine and return a full report. Never throws —
 * failures are captured inside the report instead.
 */
export async function runVoiceDiagnostics(
  options: VoiceDiagnosticsOptions = {}
): Promise<VoiceDiagnosticReport> {
  const timestamp = new Date().toISOString();
  try {
    const engine = await sound.checkVoiceEngine();
    const checks = buildChecks(engine);

    let speakTestResult: VoiceDiagnosticReport['speakTestResult'];
    let speakTestDetail: string | undefined;

    if (options.speakTest) {
      if (sound.isMuted) {
        speakTestResult = 'skipped';
        speakTestDetail = 'Sound engine is muted; unmute to run the spoken test.';
      } else {
        const timeoutMs = options.speakTestTimeoutMs ?? 8000;
        const outcome = await new Promise<'ok' | 'failed'>((resolve) => {
          let settled = false;
          const finish = (value: 'ok' | 'failed') => {
            if (settled) return;
            settled = true;
            resolve(value);
          };
          const timer = setTimeout(() => finish('failed'), timeoutMs);
          try {
            sound.speak(TEST_PHRASE, () => {
              clearTimeout(timer);
              finish('ok');
            });
          } catch {
            clearTimeout(timer);
            finish('failed');
          }
        });
        speakTestResult = outcome;
        speakTestDetail =
          outcome === 'ok'
            ? `Spoke test phrase and onEnd fired within ${timeoutMs}ms.`
            : `onEnd did not fire within ${timeoutMs}ms — voice output is likely broken on this device.`;
      }
    }

    const { healthy, summary } = summarize(checks, speakTestResult);
    return { timestamp, engine, checks, healthy, speakTestResult, speakTestDetail, summary };
  } catch (err) {
    const engine = await sound
      .checkVoiceEngine()
      .catch(
        (): VoiceEngineStatus => ({
          platform: 'unavailable',
          ttsPluginAvailable: false,
          speechSynthesisAvailable: false,
          voicesLoaded: false,
          voiceCount: 0,
          hindiVoiceAvailable: false,
          hindiVoiceCount: 0,
          audioUnlocked: false,
          speechPrimed: false,
          lastError: err instanceof Error ? err.message : 'diagnostics failed',
        })
      );
    return {
      timestamp,
      engine,
      checks: [
        {
          name: 'Diagnostics completed',
          passed: false,
          detail: err instanceof Error ? err.message : 'Unknown diagnostics error',
        },
      ],
      healthy: false,
      summary: 'Voice diagnostics themselves failed — see checks for detail.',
    };
  }
}

/**
 * Print the report to the console in a readable form. Handy during
 * on-device debugging (e.g. via Chrome remote inspector on the APK).
 */
export function logVoiceDiagnostics(report: VoiceDiagnosticReport): void {
  // eslint-disable-next-line no-console
  console.group('[voice] diagnostics');
  // eslint-disable-next-line no-console
  console.log('summary:', report.summary);
  // eslint-disable-next-line no-console
  console.log('engine:', report.engine);
  for (const check of report.checks) {
    // eslint-disable-next-line no-console
    console.log(`${check.passed ? 'PASS' : 'FAIL'} ${check.name} — ${check.detail}`);
  }
  if (report.speakTestResult) {
    // eslint-disable-next-line no-console
    console.log(`speak test: ${report.speakTestResult} — ${report.speakTestDetail}`);
  }
  // eslint-disable-next-line no-console
  console.groupEnd();
}
