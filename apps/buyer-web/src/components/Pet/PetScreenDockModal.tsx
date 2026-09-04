import React, { useState, useEffect, useRef } from 'react';
import { Monitor, Save, Sparkles, X, Check, Compass, RotateCcw } from 'lucide-react';

interface PetScreenDockModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  accentColor?: string;
  onDockUpdated?: (coords: { xPercent: number; yPercent: number }) => void;
}

export const PetScreenDockModal: React.FC<PetScreenDockModalProps> = ({
  isOpen,
  onClose,
  userId = 'user_buyer_default',
  accentColor = '#00F0FF',
  onDockUpdated,
}) => {
  const [coords, setCoords] = useState<{ xPercent: number; yPercent: number }>({
    xPercent: 0.85,
    yPercent: 0.82,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const monitorRef = useRef<HTMLDivElement>(null);

  // Fetch current dock position from backend
  useEffect(() => {
    if (!isOpen) return;
    const loadCurrentDock = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/pet/dock-position?user_id=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.dock) {
            setCoords({
              xPercent: data.dock.x_percent ?? 0.85,
              yPercent: data.dock.y_percent ?? 0.82,
            });
          }
        }
      } catch (e) {
        console.warn('Dock position load warning:', e);
      }
    };
    loadCurrentDock();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (!monitorRef.current) return;
    const rect = monitorRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left) / rect.width;
    const rawY = (clientY - rect.top) / rect.height;

    // Clamp within 5% to 95% of the virtual screen
    const clampedX = Math.max(0.06, Math.min(0.94, rawX));
    const clampedY = Math.max(0.08, Math.min(0.90, rawY));

    setCoords({
      xPercent: Math.round(clampedX * 100) / 100,
      yPercent: Math.round(clampedY * 100) / 100,
    });
    setSavedSuccess(false);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const applyPreset = (x: number, y: number) => {
    setCoords({ xPercent: x, yPercent: y });
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('http://localhost:8000/api/pet/dock-position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_percent: coords.xPercent,
          y_percent: coords.yPercent,
          user_id: userId,
        }),
      });

      // Also persist to buyer settings
      await fetch(`http://localhost:8000/api/buyer/settings?user_id=${encodeURIComponent(userId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dock_x_percent: coords.xPercent,
          dock_y_percent: coords.yPercent,
        }),
      });

      if (onDockUpdated) {
        onDockUpdated(coords);
      }

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save dock position:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden border border-cyan-500/30 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-[0_0_50px_rgba(6,182,212,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 border rounded-xl bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                Desktop Pet Custom Resting Position
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  OMNI DOCK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Place Omni anywhere on your virtual screen. Omni will roam freely and return to this exact dock when sleeping.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Virtual Desktop Monitor Frame */}
          <div className="relative flex flex-col items-center">
            {/* Monitor Outer Bezel */}
            <div className="w-full p-2.5 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
              {/* Virtual Screen Display (16:9 ratio) */}
              <div
                ref={monitorRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-cyan-500/30 cursor-crosshair select-none touch-none shadow-inner group"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%),
                    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 32px 32px, 32px 32px',
                }}
              >
                {/* Virtual Desktop Taskbar Indicator at Bottom */}
                <div className="absolute bottom-0 inset-x-0 h-4 bg-slate-900/90 border-t border-slate-700/60 flex items-center justify-between px-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-[2px] bg-cyan-400" />
                    <div className="w-2 h-2 rounded-[2px] bg-cyan-600" />
                  </div>
                  <span className="text-[7.5px] font-mono font-semibold text-slate-400 tracking-wider">
                    WINDOWS TASKBAR
                  </span>
                  <div className="text-[7.5px] font-mono text-slate-500">12:00 PM</div>
                </div>

                {/* Crosshair guide lines */}
                <div
                  className="absolute inset-y-0 w-px border-l border-dashed border-cyan-500/25 pointer-events-none"
                  style={{ left: `${coords.xPercent * 100}%` }}
                />
                <div
                  className="absolute inset-x-0 h-px border-t border-dashed border-cyan-500/25 pointer-events-none"
                  style={{ top: `${coords.yPercent * 100}%` }}
                />

                {/* Omni Pet Avatar Target Marker */}
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 flex flex-col items-center"
                  style={{
                    left: `${coords.xPercent * 100}%`,
                    top: `${coords.yPercent * 100}%`,
                  }}
                >
                  {/* Energy Ripple Ring */}
                  <div className="absolute -inset-2 rounded-full border border-cyan-400/80 animate-ping opacity-60" />
                  <div className="relative flex flex-col items-center p-1.5 rounded-xl bg-slate-900/90 border border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] backdrop-blur-sm">
                    {/* Mini Chibi Robot Face */}
                    <div className="w-7 h-6 rounded-md bg-slate-100 border border-slate-300 flex items-center justify-center relative shadow-md">
                      <div className="w-5 h-3 rounded bg-slate-950 flex items-center justify-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                      </div>
                    </div>
                    {/* Charging Base Tray */}
                    <div className="w-9 h-1.5 rounded-full bg-cyan-400/80 mt-1 shadow-[0_0_8px_#00F0FF]" />
                  </div>
                  {/* Coordinate Badge */}
                  <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300 whitespace-nowrap shadow">
                    X: {Math.round(coords.xPercent * 100)}% | Y: {Math.round(coords.yPercent * 100)}%
                  </div>
                </div>

                {/* Instruction overlay badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-slate-900/80 border border-slate-700/80 text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-cyan-400 animate-spin" />
                  Click or drag anywhere to place Omni
                </div>
              </div>
            </div>
            {/* Monitor Stand Base */}
            <div className="w-14 h-3 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-md" />
            <div className="w-24 h-1.5 bg-slate-700 rounded-full shadow" />
          </div>

          {/* Quick Presets Bar */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Quick Placement Presets
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(0.50, 0.80)}
                className={`px-2.5 py-1.5 text-xs rounded-xl font-medium border transition text-center ${
                  coords.xPercent === 0.50 && coords.yPercent === 0.80
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                ⚡ Bottom Center
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.85, 0.80)}
                className={`px-2.5 py-1.5 text-xs rounded-xl font-medium border transition text-center ${
                  coords.xPercent === 0.85 && coords.yPercent === 0.80
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                ↘️ Bottom Right
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.15, 0.80)}
                className={`px-2.5 py-1.5 text-xs rounded-xl font-medium border transition text-center ${
                  coords.xPercent === 0.15 && coords.yPercent === 0.80
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                ↙️ Bottom Left
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.85, 0.20)}
                className={`px-2.5 py-1.5 text-xs rounded-xl font-medium border transition text-center ${
                  coords.xPercent === 0.85 && coords.yPercent === 0.20
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                ↗️ Top Right
              </button>
              <button
                type="button"
                onClick={() => applyPreset(0.15, 0.20)}
                className={`px-2.5 py-1.5 text-xs rounded-xl font-medium border transition text-center ${
                  coords.xPercent === 0.15 && coords.yPercent === 0.20
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                ↖️ Top Left
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/60">
          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>Dock Coords:</span>
            <span className="text-cyan-300 font-bold">
              X: {Math.round(coords.xPercent * 100)}%, Y: {Math.round(coords.yPercent * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => applyPreset(0.50, 0.80)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-xl transition shadow-lg ${
                savedSuccess
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25'
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  Saved & Dock Set!
                </>
              ) : isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Dock Position
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
