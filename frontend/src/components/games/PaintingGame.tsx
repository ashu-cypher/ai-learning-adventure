import React, { useRef, useState, useEffect } from 'react';
import { sound } from '../../audio/soundEngine';
import { ArrowLeft, Trash2, Paintbrush, Stamp as StampIcon } from 'lucide-react';

interface PaintingGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

const PALETTE = ['#EF4444', '#F97316', '#FBBF24', '#22C55E', '#38BDF8', '#8B5CF6', '#EC4899', '#111827'];
const STAMPS = ['⭐', '❤️', '🌈', '🦋', '🌸', '🐶', '🦁', '🚗'];
const BRUSH_SIZES = [8, 16, 28];

export const PaintingGame: React.FC<PaintingGameProps> = ({ onBack, onGameComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const strokesRef = useRef(0);
  const completedRef = useRef(false);

  const [color, setColor] = useState(PALETTE[4]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [mode, setMode] = useState<'brush' | 'stamp'>('brush');
  const [stamp, setStamp] = useState(STAMPS[0]);

  const fitCanvas = () => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, rect.width * dpr);
    canvas.height = Math.max(1, rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  };

  useEffect(() => {
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    sound.speak('Time to paint! Pick a pretty color and draw with your finger!');
    return () => window.removeEventListener('resize', fitCanvas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const countStroke = () => {
    strokesRef.current += 1;
    const n = strokesRef.current;
    if (n === 20 && !completedRef.current) {
      completedRef.current = true;
      sound.playSuccessChime();
      sound.speak('Wow! What a beautiful painting! You are an artist!');
      onGameComplete?.();
    } else if (n % 8 === 0) {
      sound.playGentleEncouragement();
    }
  };

  const handleDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const pos = getPos(e);
    drawingRef.current = true;
    lastRef.current = pos;
    sound.playPop();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (mode === 'stamp') {
      ctx.font = `${brushSize * 3}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp, pos.x, pos.y);
      countStroke();
      drawingRef.current = false;
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const handleMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || mode === 'stamp') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pos = getPos(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    ctx.moveTo(lastRef.current.x, lastRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastRef.current = pos;
  };

  const handleUp = () => {
    if (drawingRef.current && mode === 'brush') {
      countStroke();
    }
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);
    strokesRef.current = 0;
    completedRef.current = false;
    sound.playPop();
    sound.speak('Fresh clean canvas! Paint something new!');
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-4 py-2.5 rounded-2xl shadow-md border-2 border-sky-200 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6 text-sky-500" />
          <span className="font-bubble font-bold text-lg">Games</span>
        </button>
        <h2 className="font-bubble font-extrabold text-2xl md:text-3xl text-slate-800">
          🎨 Painting Fun
        </h2>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-2 bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2.5 rounded-2xl shadow-md border-2 border-rose-300 active:scale-95 transition-transform"
        >
          <Trash2 className="w-6 h-6" />
          <span className="font-bubble font-bold text-lg hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="w-full bg-white/80 rounded-3xl border-2 border-amber-200 shadow-md p-3 mb-3 flex flex-col gap-3">
        {/* Colors */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => {
                sound.playPop();
                setColor(c);
                setMode('brush');
              }}
              className={`w-11 h-11 md:w-12 md:h-12 rounded-full border-4 transition-transform active:scale-90 ${
                color === c && mode === 'brush'
                  ? 'border-amber-500 scale-110 shadow-lg'
                  : 'border-white shadow'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>

        {/* Brush sizes + mode */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-50 rounded-2xl px-3 py-1.5 border-2 border-amber-200">
            <Paintbrush className="w-5 h-5 text-amber-600" />
            {BRUSH_SIZES.map((s, i) => (
              <button
                key={s}
                onClick={() => {
                  sound.playPop();
                  setBrushSize(s);
                  setMode('brush');
                }}
                className={`rounded-full transition-transform active:scale-90 ${
                  brushSize === s && mode === 'brush'
                    ? 'bg-amber-400 scale-110'
                    : 'bg-slate-200'
                }`}
                style={{ width: 14 + i * 8, height: 14 + i * 8 }}
                aria-label={`Brush size ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => {
              sound.playPop();
              setMode(mode === 'stamp' ? 'brush' : 'stamp');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bubble font-bold text-lg border-2 active:scale-95 transition-transform ${
              mode === 'stamp'
                ? 'bg-purple-400 text-white border-purple-300'
                : 'bg-white text-purple-700 border-purple-200'
            }`}
          >
            <StampIcon className="w-5 h-5" />
            Stamps
          </button>
        </div>

        {/* Stamps row */}
        {mode === 'stamp' && (
          <div className="flex items-center justify-center gap-2 flex-wrap animate-fade-in">
            {STAMPS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  sound.playPop();
                  setStamp(s);
                }}
                className={`text-4xl p-1.5 rounded-2xl transition-transform active:scale-90 ${
                  stamp === s ? 'bg-purple-100 scale-110 ring-2 ring-purple-400' : 'hover:scale-110'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 min-h-[320px] md:min-h-[420px] bg-white rounded-3xl border-4 border-amber-200 shadow-xl overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: 'none' }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          onPointerLeave={handleUp}
        />
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        {mode === 'stamp' ? 'Tap the canvas to stamp your picture! 👆' : 'Draw with your finger! 🖌️'}
      </p>
    </div>
  );
};
