# 🌟 My Learning Adventure — AI Preschool Game (Ages 3–6)

A colorful, interactive, AI-powered educational game designed specifically for nursery and kindergarten children (ages 3–6).

Unlike traditional chatbots or e-learning websites, **AI Learning Adventure** provides an immersive world-map adventure where children travel with **Milo the Bunny 🐰** (their animated AI companion and teacher), learn through multi-sensory experiences (👀 See, 🔊 Hear, 🎵 Sing, 📖 Story, 🎮 Play), and unlock subsequent stages only after demonstrating genuine conceptual understanding.

---

## 🚀 Key Features

* **Child-First UX (Ages 3–6)**: Large illustrations, vibrant colors, big touch targets, minimal text, bouncy animations, and positive reinforcement.
* **Friendly AI Companion ("Milo")**: Animated character with eye blinks, speaking mouth motions, cheerful bounce animations, and built-in voice narration (Web Speech API).
* **Multi-Sensory Learning**: Every stage includes:
  1. **Intro & Greeting**: Milo warmly introduces the concept.
  2. **See & Hear**: Visual objects (e.g., Red Apple, Strawberry, Fire Engine) with audio cues.
  3. **Sing / Story**: Rhyming nursery sing-along lyrics and micro-stories.
  4. **Play**: Interactive mini-games (`ObjectSelection`, `ColorMatch`, `ColorSort`, `CountingGame`).
  5. **AI Assessment**: Dynamic feedback without any shaming.
  6. **Celebration**: Confetti burst, star awards (1–3 stars), and stage unlocks.
* **Dynamic Adaptive AI**:
  - Automatically assesses child answers.
  - If a child struggles repeatedly (2+ mistakes), the system automatically simplifies the task (e.g., reduces choices from 3 to 2, enlarges the target object, adds a pulsing golden glow assistance, and offers a gentle vocal hint).
* **Mastery & Progression Engine**:
  - Tracks attempts, mistakes, correct answers, and computes mastery percentage.
  - Basic mastery is required to unlock subsequent stages.
* **Parent & Teacher Area**:
  - Guarded by a Parent Gate (math challenge).
  - Shows concept mastery breakdowns, attempts, areas needing practice, and offline activity recommendations.
* **Zero-External Asset Sound Engine**:
  - Built-in Web Audio API synthesizers provide instant, cheerful pops, success bells, and fanfares without relying on external MP3 downloads.
  - Web Speech API provides cheerful speech narration.
  - Optional microphone speech recognition allows children to say their answers out loud!

---

## 📁 Project Architecture

```
ai-learning-adventure/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── learning_agent.py      # Master Orchestrator Agent
│   │   │   ├── teacher_agent.py       # Friendly speech, hints, explanations
│   │   │   ├── visual_agent.py        # Visual layout, icons, glow highlights
│   │   │   ├── game_agent.py          # Mini-game mechanics & distractors
│   │   │   ├── assessment_agent.py    # Zero-shame answer evaluation
│   │   │   ├── adaptation_agent.py    # Dynamic task simplification & glow cues
│   │   │   ├── story_agent.py         # Micro-stories with Milo & friends
│   │   │   ├── song_agent.py          # Educational rhyming sing-along lyrics
│   │   │   ├── safety_agent.py        # Strict non-shaming tone enforcement
│   │   │   └── progress_agent.py      # Mastery scoring, stars, and unlocks
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── session.py             # SQLAlchemy Async Engine with SQLite
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── domain.py              # ChildProfile, StageProgress, ConceptMastery, SessionLog
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── worlds.py              # World maps and stage progress
│   │   │   ├── stages.py              # Lesson plan generation and answer submissions
│   │   │   └── progress.py            # Parent dashboard analytics and resets
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── stage_schemas.py       # LessonPlan, VisualObject, AssessmentResult
│   │   │   └── progress_schemas.py    # ParentDashboardData, WorldSummary
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   └── ai_provider.py         # AI Provider abstraction (SmartRules, Gemini, OpenAI)
│   │   └── main.py                    # FastAPI application entrypoint
│   ├── tests/
│   │   └── test_progression.py        # Automated test suite for all stages & agents
│   ├── requirements.txt
│   ├── .env.example
│   └── .env
└── frontend/
    ├── src/
    │   ├── audio/
    │   │   └── soundEngine.ts         # Web Audio API synthesizers & Speech synthesis
    │   ├── components/
    │   │   ├── character/
    │   │   │   └── MiloCompanion.tsx  # Animated SVG Milo AI mascot
    │   │   ├── games/
    │   │   │   ├── ObjectSelection.tsx# Tap to choose with voice input option
    │   │   │   ├── ColorMatch.tsx     # Match objects to paint buckets
    │   │   │   ├── ColorSort.tsx      # Sort objects into color treasure chests
    │   │   │   ├── CountingGame.tsx   # Number counting pads
    │   │   │   ├── SongScene.tsx      # Sing-along song scene
    │   │   │   └── StoryScene.tsx     # Micro-story reader
    │   │   ├── map/
    │   │   │   └── ProgressMap.tsx    # Adventure island world map & stages
    │   │   ├── navigation/
    │   │   │   └── ChildHeader.tsx    # Home, Map, Star Counter, Voice, Parent Gate
    │   │   ├── parent/
    │   │   │   └── ParentDashboardModal.tsx # Parent gate & analytics
    │   │   ├── celebration/
    │   │   │   └── CelebrationModal.tsx # Confetti, fanfare, star count-up
    │   │   └── welcome/
    │   │       └── WelcomeScreen.tsx  # First launch screen ("Welcome, Little Explorer!")
    │   ├── services/
    │   │   └── api.ts                 # Typed API client connecting to backend
    │   ├── types/
    │   │   └── index.ts               # Shared TypeScript models
    │   ├── App.tsx                    # Main app coordinator
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 🤖 AI Agent Workflow

The system uses a multi-agent pipeline orchestrated by `LearningAgent`:

```
Child Input
    │
    ▼
LearningAgent (Orchestrator)
    │
    ├──► ProgressAgent: Inspects child's mastery & stage status
    ├──► AdaptationAgent: Determines difficulty level & assistance needs
    ├──► TeacherAgent: Generates child-friendly spoken greeting & instructions
    ├──► VisualAgent: Assembles large visual objects, icons, and glow cues
    ├──► GameAgent: Configures mini-game mechanics (Select, Match, Sort, Count)
    ├──► StoryAgent & SongAgent: Generates micro-story and sing-along rhyme
    └──► SafetyAgent: Sanitizes all outputs to ensure 100% positive, non-shaming tone
    │
    ▼
Frontend Visual Component Engine
(Renders safe predefined components: ObjectSelection, ColorMatch, etc.)
    │
    ▼
Child Interacts (Tap or Speech Input)
    │
    ▼
AssessmentAgent: Evaluates understanding without shaming
    │
    ▼
AdaptationAgent: If struggling, simplifies task & adds glowing assistance
    │
    ▼
ProgressAgent: Updates mastery score, awards 1–3 stars, unlocks next stage
    │
    ▼
Celebration & Next Stage
```

---

## 🛠 Setup & Running Instructions

### 1. Backend Setup (FastAPI & SQLite)

From the project root:

```bash
cd backend

# Install dependencies (FastAPI, SQLAlchemy, greenlet, aiosqlite, pydantic, httpx, uvicorn)
pip install -r requirements.txt

# Run the backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be live at `http://127.0.0.1:8000`. You can inspect the interactive OpenAPI documentation at `http://127.0.0.1:8000/docs`.

### 2. Frontend Setup (React, Vite, Tailwind CSS)

In a new terminal:

```bash
cd frontend

# Install frontend dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at `http://127.0.0.1:5173`.

---

## 🧪 Testing Instructions

Run the automated backend test suite covering the entire progression, adaptive simplification, and non-shaming safety checks:

```bash
cd backend
python -m tests.test_progression
```

This verifies:
1. Health check & database initialization
2. World 1 (Colors) stage generation
3. Non-shaming response when a child makes an error
4. Dynamic task simplification (reducing choices and applying visual glow assistance) on repeated mistakes
5. Correct answer evaluation, star awards, and automatic unlocking of Stage 2
6. Mini-game structures for Match Colors and Color Sorting
7. Parent dashboard analytics generation

---

## ➕ Adding New Worlds & Stages

New worlds (e.g., Shapes, Numbers, Alphabet, Animals, Everyday Knowledge) can be easily added:

1. **Add stage definitions** in `backend/app/agents/progress_agent.py`:
   ```python
   WORLD_STAGES["shapes"] = [
       {"id": "shapes-1", "title": "Round Circle", "concept": "circle", "icon": "🔴"},
       {"id": "shapes-2", "title": "Square Box", "concept": "square", "icon": "🟧"},
       {"id": "shapes-3", "title": "Triangle Wedge", "concept": "triangle", "icon": "🔺"},
       {"id": "shapes-4", "title": "Match Shapes", "concept": "shape_matching", "icon": "🔷"},
   ]
   ```
2. **Add knowledge & activities** in `backend/app/services/ai_provider.py` under `SmartRulesAIProvider` (or configure Gemini/OpenAI API keys in `backend/.env`).
3. **Register the world metadata** in `backend/app/routes/worlds.py`:
   ```python
   {
       "id": "shapes",
       "name": "Magic Shapes Kingdom",
       "icon": "🔷",
       "theme_color": "from-blue-400 via-indigo-400 to-cyan-300",
       "accent_color": "#3B82F6",
       "description": "Roll with round circles, balance with squares, and discover pointy triangles!",
       "is_unlocked": True,
   }
   ```
4. The frontend adventure map and stage container automatically render the new stages using the structured visual component engine.
