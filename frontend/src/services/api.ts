import {
  WorldSummary,
  LessonPlan,
  AnswerSubmission,
  AssessmentResult,
  ParentDashboardData,
  GameActivity,
} from '../types';
import { offlineAdapter } from '../engine/offlineAdapter';

const API_BASE = '/api';

// Helper to attempt fetch with a short timeout, falling back to offline adapter
async function fetchWithFallback<T>(
  url: string,
  options?: RequestInit,
  fallbackFn?: () => T
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

export const api = {
  async fetchWorlds(childId = 'default-child'): Promise<WorldSummary[]> {
    return fetchWithFallback<WorldSummary[]>(
      `${API_BASE}/worlds?child_id=${encodeURIComponent(childId)}`,
      undefined,
      () => offlineAdapter.fetchWorlds(childId)
    );
  },

  async fetchStageLesson(worldId: string, stageId: string, childId = 'default-child'): Promise<LessonPlan> {
    return fetchWithFallback<LessonPlan>(
      `${API_BASE}/stages/${worldId}/${stageId}?child_id=${encodeURIComponent(childId)}`,
      undefined,
      () => offlineAdapter.fetchStageLesson(worldId, stageId, childId)
    );
  },

  async submitAnswer(worldId: string, stageId: string, submission: AnswerSubmission): Promise<AssessmentResult> {
    return fetchWithFallback<AssessmentResult>(
      `${API_BASE}/stages/${worldId}/${stageId}/submit`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
      },
      () => offlineAdapter.submitAnswer(worldId, stageId, submission)
    );
  },

  async fetchStageHint(worldId: string, stageId: string, attempt = 1): Promise<{ hint_text: string; spoken_hint: string }> {
    return fetchWithFallback<{ hint_text: string; spoken_hint: string }>(
      `${API_BASE}/stages/${worldId}/${stageId}/hint?attempt=${attempt}`,
      undefined,
      () => offlineAdapter.fetchStageHint(worldId, stageId, attempt)
    );
  },

  async fetchSimplifiedActivity(worldId: string, stageId: string, childId = 'default-child'): Promise<GameActivity> {
    return fetchWithFallback<GameActivity>(
      `${API_BASE}/stages/${worldId}/${stageId}/simplify?child_id=${encodeURIComponent(childId)}`,
      undefined,
      () => offlineAdapter.fetchSimplifiedActivity(worldId, stageId, childId)
    );
  },

  async fetchParentDashboard(childId = 'default-child'): Promise<ParentDashboardData> {
    return fetchWithFallback<ParentDashboardData>(
      `${API_BASE}/progress/${encodeURIComponent(childId)}/parent-dashboard`,
      undefined,
      () => offlineAdapter.fetchParentDashboard(childId)
    );
  },

  async resetProgress(childId = 'default-child'): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/progress/${encodeURIComponent(childId)}/reset`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Backend failed');
    } catch {
      offlineAdapter.resetProgress(childId);
    }
  },
};
