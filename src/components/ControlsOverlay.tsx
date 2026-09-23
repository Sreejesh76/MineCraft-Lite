import React from 'react';
import { sound } from '../utils/audio';

interface ControlsOverlayProps {
  gameStarted: boolean;
  isLocked: boolean;
  onStartClick: () => void;
  isPaused: boolean;
  isInventoryOpen: boolean;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  gameStarted,
  onStartClick,
  isPaused,
  isInventoryOpen,
}) => {
  if (gameStarted || isPaused || isInventoryOpen) return null;

  const handleStart = () => {
    sound.playButtonClick();
    onStartClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm font-mono text-white select-none p-4">
      <div className="flex max-w-lg w-full flex-col items-center rounded-2xl border border-stone-600 bg-stone-900/95 p-6 text-center shadow-2xl">
        <div className="text-3xl font-black tracking-widest text-amber-400 drop-shadow">
          VOXELVERSE
        </div>
        <p className="mt-1 text-xs text-stone-400">
          PROCEDURAL 3D VOXEL SANDBOX WORLD
        </p>

        {/* Feature Badges */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 text-emerald-300 font-semibold">
            🏡 Inbuilt House
          </span>
          <span className="rounded-full bg-amber-950/80 border border-amber-500/40 px-2.5 py-0.5 text-amber-300 font-semibold">
            🐾 Loyal Pet Buddy
          </span>
          <span className="rounded-full bg-lime-950/80 border border-lime-500/40 px-2.5 py-0.5 text-lime-300 font-semibold">
            🦖 Dinos
          </span>
          <span className="rounded-full bg-red-950/80 border border-red-500/40 px-2.5 py-0.5 text-red-300 font-semibold">
            🕷️ Spiders & 🧟 Zombies
          </span>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="my-5 w-full rounded-xl bg-amber-500 py-3.5 text-base font-black text-stone-950 shadow-lg hover:bg-amber-400 active:scale-95 transition cursor-pointer hover:shadow-amber-500/25"
        >
          ▶ ENTER 3D WORLD
        </button>

        {/* Controls Guide */}
        <div className="w-full rounded-xl border border-stone-800 bg-stone-950/70 p-4 text-xs text-stone-300">
          <div className="mb-2 font-bold text-amber-300 text-center border-b border-stone-800 pb-1.5 tracking-wider">
            CONTROLS GUIDE
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">↑ ↓ ← →</kbd> Move
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">Space</kbd> Jump
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">W A S D</kbd> Alt Move
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">Mouse</kbd> Look around
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">Left Click</kbd> Mine / Attack
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">Right Click</kbd> Place / Interact
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">1 - 9</kbd> Hotbar Slots
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">E</kbd> Inventory / Crafting
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">F</kbd> Toggle Flight
            </div>
            <div>
              <kbd className="rounded bg-stone-800 px-1.5 py-0.5 text-amber-400 font-bold">ESC</kbd> Pause & Settings
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-stone-400">
          💡 You can also drag the mouse anywhere on screen to look around freely!
        </p>
      </div>
    </div>
  );
};
