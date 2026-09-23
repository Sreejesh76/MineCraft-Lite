import React from 'react';
import { GameSettings, PlayerStats } from '../types/game';
import { sound } from '../utils/audio';

interface PauseMenuProps {
  isOpen: boolean;
  onResume: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  stats: PlayerStats;
  onToggleGameMode: () => void;
  onRespawn: () => void;
  onRegenerateWorld: (newSeed?: number) => void;
  onSaveWorld: () => void;
  onLoadWorld: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  isOpen,
  onResume,
  settings,
  onUpdateSettings,
  stats,
  onToggleGameMode,
  onRespawn,
  onRegenerateWorld,
  onSaveWorld,
  onLoadWorld,
}) => {
  if (!isOpen) return null;

  const handleAction = (cb: () => void) => {
    sound.playButtonClick();
    cb();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md font-mono select-none">
      <div className="relative flex w-[520px] flex-col rounded-2xl border border-stone-600 bg-stone-900 p-6 shadow-2xl text-stone-100">
        {/* Title */}
        <div className="text-center border-b border-stone-700 pb-3">
          <h1 className="text-2xl font-black tracking-widest text-amber-400">GAME PAUSED</h1>
          <p className="text-xs text-stone-400 mt-1">VOXELVERSE SANDBOX ENGINE</p>
        </div>

        {/* Status notice if dead */}
        {stats.isDead && (
          <div className="my-3 rounded-lg bg-red-950/80 border border-red-500/50 p-3 text-center">
            <div className="text-sm font-bold text-red-300">YOU HAVE PERISHED!</div>
            <button
              onClick={() => handleAction(onRespawn)}
              className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition cursor-pointer active:scale-95"
            >
              Respawn Now
            </button>
          </div>
        )}

        {/* Settings and Options */}
        <div className="my-4 flex flex-col gap-3.5 text-xs">
          {/* Game Mode Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-stone-800/80 p-3 border border-stone-700">
            <span className="font-semibold text-stone-300">Game Mode</span>
            <button
              onClick={() => handleAction(onToggleGameMode)}
              className={`rounded-lg px-3.5 py-1.5 font-bold uppercase transition cursor-pointer active:scale-95 shadow ${
                stats.gameMode === 'survival'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {stats.gameMode}
            </button>
          </div>

          {/* Render Distance */}
          <div className="flex flex-col gap-1 rounded-xl bg-stone-800/80 p-3 border border-stone-700">
            <div className="flex justify-between font-semibold text-stone-300">
              <span>Render Distance (Radius)</span>
              <span className="text-amber-400 font-bold">{settings.renderDistance} Chunks</span>
            </div>
            <input
              type="range"
              min={2}
              max={6}
              step={1}
              value={settings.renderDistance}
              onChange={(e) => onUpdateSettings({ renderDistance: parseInt(e.target.value, 10) })}
              className="accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Mouse Sensitivity */}
          <div className="flex flex-col gap-1 rounded-xl bg-stone-800/80 p-3 border border-stone-700">
            <div className="flex justify-between font-semibold text-stone-300">
              <span>Mouse Look Sensitivity</span>
              <span className="text-amber-400 font-bold">{Math.round(settings.mouseSensitivity * 1000)}</span>
            </div>
            <input
              type="range"
              min={0.001}
              max={0.005}
              step={0.0005}
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Field of View (FOV) */}
          <div className="flex flex-col gap-1 rounded-xl bg-stone-800/80 p-3 border border-stone-700">
            <div className="flex justify-between font-semibold text-stone-300">
              <span>Field of View (FOV)</span>
              <span className="text-amber-400 font-bold">{settings.fov}°</span>
            </div>
            <input
              type="range"
              min={60}
              max={100}
              step={5}
              value={settings.fov}
              onChange={(e) => onUpdateSettings({ fov: parseInt(e.target.value, 10) })}
              className="accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Sound Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-stone-800/80 p-3 border border-stone-700">
            <div className="flex flex-col">
              <span className="font-semibold text-stone-300">Creature Sounds</span>
              <span className="text-[10px] text-stone-500">Only creature audio (No movement or music)</span>
            </div>
            <button
              onClick={() => handleAction(() => onUpdateSettings({ soundEnabled: !settings.soundEnabled }))}
              className={`rounded-lg px-3.5 py-1.5 font-bold transition cursor-pointer active:scale-95 shadow ${
                settings.soundEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-400'
              }`}
            >
              {settings.soundEnabled ? '🔊 ON' : '🔇 MUTED'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-stone-700">
          <button
            onClick={() => handleAction(onResume)}
            className="w-full rounded-xl bg-amber-500 py-3 text-sm font-black text-stone-950 hover:bg-amber-400 transition shadow-lg cursor-pointer active:scale-95"
          >
            ▶ Back to Game (ESC)
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAction(onSaveWorld)}
              className="rounded-xl border border-stone-700 bg-stone-800 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition cursor-pointer active:scale-95"
            >
              💾 Save World State
            </button>
            <button
              onClick={() => handleAction(onLoadWorld)}
              className="rounded-xl border border-stone-700 bg-stone-800 py-2.5 text-xs font-bold text-stone-300 hover:bg-stone-700 hover:text-white transition cursor-pointer active:scale-95"
            >
              📂 Load Saved World
            </button>
          </div>

          <button
            onClick={() => {
              handleAction(() => {
                const seed = Math.floor(Math.random() * 999999);
                onRegenerateWorld(seed);
              });
            }}
            className="w-full rounded-xl border border-red-900/60 bg-red-950/40 py-2.5 text-xs font-bold text-red-400 hover:bg-red-900/50 hover:text-white transition cursor-pointer active:scale-95"
          >
            🔄 Regenerate New Procedural World
          </button>
        </div>
      </div>
    </div>
  );
};
