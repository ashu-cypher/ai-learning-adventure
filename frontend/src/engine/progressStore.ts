/**
 * Local Progress Store — uses localStorage to persist child progress.
 * Replaces the Python SQLite backend entirely.
 * 100% offline, works inside an Android APK.
 */

export interface ChildProfile {
  id: string;
  name: string;
  total_stars: number;
  current_world_id: string;
}

export interface StageProgressRecord {
  id: string;
  child_id: string;
  world_id: string;
  stage_id: string;
  status: 'locked' | 'unlocked' | 'completed';
  stars: number;
  attempts: number;
  mistakes: number;
  correct_answers: number;
  mastery_score: number;
  completed_at?: string;
}

export interface ConceptMasteryRecord {
  id: string;
  child_id: string;
  world_id: string;
  concept: string;
  mastery: number;
  attempts: number;
  mistakes: number;
  correct_answers: number;
  needs_practice: boolean;
  last_practiced: string;
}

const STORAGE_KEYS = {
  CHILD: 'ala_child',
  STAGES: 'ala_stages',
  MASTERY: 'ala_mastery',
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full or unavailable
  }
}

// ─── Child Profile ────────────────────────────────────────────────────────────

export function getOrCreateChild(childId = 'default-child'): ChildProfile {
  const all = load<ChildProfile[]>(STORAGE_KEYS.CHILD, []);
  let child = all.find(c => c.id === childId);
  if (!child) {
    child = { id: childId, name: 'Little Explorer', total_stars: 0, current_world_id: 'colors' };
    all.push(child);
    save(STORAGE_KEYS.CHILD, all);
  }
  return child;
}

function saveChild(child: ChildProfile): void {
  const all = load<ChildProfile[]>(STORAGE_KEYS.CHILD, []);
  const idx = all.findIndex(c => c.id === child.id);
  if (idx >= 0) all[idx] = child;
  else all.push(child);
  save(STORAGE_KEYS.CHILD, all);
}

// ─── Stage Progress ───────────────────────────────────────────────────────────

export function getOrCreateStageProgress(
  childId: string,
  worldId: string,
  stageId: string
): StageProgressRecord {
  const all = load<StageProgressRecord[]>(STORAGE_KEYS.STAGES, []);
  const progId = `${childId}_${stageId}`;
  let prog = all.find(p => p.id === progId);
  if (!prog) {
    const status = stageId === 'colors-1' || stageId === 'shapes-1' ? 'unlocked' : 'locked';
    prog = {
      id: progId, child_id: childId, world_id: worldId, stage_id: stageId,
      status, stars: 0, attempts: 0, mistakes: 0, correct_answers: 0, mastery_score: 0,
    };
    all.push(prog);
    save(STORAGE_KEYS.STAGES, all);
  }
  return prog;
}

function saveStageProgress(prog: StageProgressRecord): void {
  const all = load<StageProgressRecord[]>(STORAGE_KEYS.STAGES, []);
  const idx = all.findIndex(p => p.id === prog.id);
  if (idx >= 0) all[idx] = prog;
  else all.push(prog);
  save(STORAGE_KEYS.STAGES, all);
}

// ─── Concept Mastery ──────────────────────────────────────────────────────────

export function getOrCreateConceptMastery(
  childId: string,
  worldId: string,
  concept: string
): ConceptMasteryRecord {
  const all = load<ConceptMasteryRecord[]>(STORAGE_KEYS.MASTERY, []);
  const mastId = `${childId}_${concept}`;
  let mast = all.find(m => m.id === mastId);
  if (!mast) {
    mast = {
      id: mastId, child_id: childId, world_id: worldId, concept,
      mastery: 0, attempts: 0, mistakes: 0, correct_answers: 0,
      needs_practice: false, last_practiced: new Date().toISOString(),
    };
    all.push(mast);
    save(STORAGE_KEYS.MASTERY, all);
  }
  return mast;
}

function saveConceptMastery(mast: ConceptMasteryRecord): void {
  const all = load<ConceptMasteryRecord[]>(STORAGE_KEYS.MASTERY, []);
  const idx = all.findIndex(m => m.id === mast.id);
  if (idx >= 0) all[idx] = mast;
  else all.push(mast);
  save(STORAGE_KEYS.MASTERY, all);
}

// ─── All Stage Progresses (for map rendering) ─────────────────────────────────

export function getAllStageProgresses(childId: string): StageProgressRecord[] {
  return load<StageProgressRecord[]>(STORAGE_KEYS.STAGES, []).filter(p => p.child_id === childId);
}

export function getAllConceptMasteries(childId: string): ConceptMasteryRecord[] {
  return load<ConceptMasteryRecord[]>(STORAGE_KEYS.MASTERY, []).filter(m => m.child_id === childId);
}

// ─── Record Answer & Update Progress ─────────────────────────────────────────

interface UpdateResult {
  prog: StageProgressRecord;
  mast: ConceptMasteryRecord;
  stars_earned: number;
  next_stage_id: string | null;
}

const WORLD_STAGE_SEQUENCES: Record<string, string[]> = {
  colors: ['colors-1', 'colors-2', 'colors-3', 'colors-4', 'colors-5', 'colors-6', 'colors-7'],
  shapes: ['shapes-1', 'shapes-2', 'shapes-3', 'shapes-4'],
};

export function recordAnswerAndUpdateProgress(
  childId: string,
  worldId: string,
  stageId: string,
  concept: string,
  isCorrect: boolean
): UpdateResult {
  const child = getOrCreateChild(childId);
  const prog = getOrCreateStageProgress(childId, worldId, stageId);
  const mast = getOrCreateConceptMastery(childId, worldId, concept);

  prog.attempts += 1;
  mast.attempts += 1;

  let stars_earned = 0;
  let next_stage_id: string | null = null;

  if (isCorrect) {
    prog.correct_answers += 1;
    mast.correct_answers += 1;

    stars_earned = prog.mistakes === 0 ? 3 : prog.mistakes === 1 ? 2 : 1;
    const newStars = Math.max(prog.stars, stars_earned);
    const starsDiff = newStars - prog.stars;
    prog.stars = newStars;
    child.total_stars += starsDiff;

    prog.status = 'completed';
    prog.completed_at = new Date().toISOString();
    mast.needs_practice = false;

    // Unlock next stage
    const sequence = WORLD_STAGE_SEQUENCES[worldId] || [];
    const currentIndex = sequence.indexOf(stageId);
    if (currentIndex >= 0 && currentIndex + 1 < sequence.length) {
      next_stage_id = sequence[currentIndex + 1];
      const nextProg = getOrCreateStageProgress(childId, worldId, next_stage_id);
      if (nextProg.status === 'locked') {
        nextProg.status = 'unlocked';
        saveStageProgress(nextProg);
      }
    }
  } else {
    prog.mistakes += 1;
    mast.mistakes += 1;
    if (mast.mistakes >= 2) mast.needs_practice = true;
  }

  // Mastery formula
  const totalEval = mast.correct_answers + mast.mistakes * 0.5;
  mast.mastery = totalEval > 0 ? Math.min(1, Number((mast.correct_answers / totalEval).toFixed(2))) : 0;
  prog.mastery_score = mast.mastery;
  mast.last_practiced = new Date().toISOString();

  saveChild(child);
  saveStageProgress(prog);
  saveConceptMastery(mast);

  return { prog, mast, stars_earned, next_stage_id };
}

// ─── Reset All Progress ───────────────────────────────────────────────────────

export function resetAllProgress(childId = 'default-child'): void {
  const stages = load<StageProgressRecord[]>(STORAGE_KEYS.STAGES, []).filter(p => p.child_id !== childId);
  const mastery = load<ConceptMasteryRecord[]>(STORAGE_KEYS.MASTERY, []).filter(m => m.child_id !== childId);
  const children = load<ChildProfile[]>(STORAGE_KEYS.CHILD, []).filter(c => c.id !== childId);

  save(STORAGE_KEYS.STAGES, stages);
  save(STORAGE_KEYS.MASTERY, mastery);
  save(STORAGE_KEYS.CHILD, children);
}

// ─── Compute total stars across all stages ────────────────────────────────────

export function getTotalStars(childId = 'default-child'): number {
  return getAllStageProgresses(childId).reduce((sum, p) => sum + p.stars, 0);
}
