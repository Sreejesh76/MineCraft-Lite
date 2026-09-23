import React from 'react';
import { InventorySlot, PlayerStats } from '../types/game';
import { ITEM_REGISTRY } from '../engine/items';
import { sound } from '../utils/audio';

interface HUDProps {
  stats: PlayerStats;
  hotbar: (InventorySlot | null)[];
  activeSlotIndex: number;
  playerPos: { x: number; y: number; z: number };
  timeOfDay: number; // 0 to 1
  isUnderwater: boolean;
  isFlying: boolean;
  damageFlash: boolean;
  isPointerLocked: boolean;
  inputState: { forward: boolean; backward: boolean; left: boolean; right: boolean; jump: boolean };
  onRequestLock: () => void;
  onOpenInventory: () => void;
  onToggleFly: () => void;
  onOpenMenu: () => void;
  onSelectSlot: (index: number) => void;
  onDirectionPress?: (direction: 'forward' | 'backward' | 'left' | 'right' | 'jump', active: boolean) => void;
  onResetKeys?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  hotbar,
  activeSlotIndex,
  playerPos,
  timeOfDay,
  isUnderwater,
  isFlying,
  damageFlash,
  isPointerLocked,
  inputState,
  onRequestLock,
  onOpenInventory,
  onToggleFly,
  onOpenMenu,
  onSelectSlot,
  onDirectionPress,
  onResetKeys,
}) => {
  const activeItem = hotbar[activeSlotIndex]
    ? ITEM_REGISTRY[hotbar[activeSlotIndex]!.itemId]
    : null;

  // Day Phase
  const getDayPhase = (t: number) => {
    if (t >= 0.18 && t < 0.32) return { text: 'Morning 🌅', color: 'text-amber-300' };
    if (t >= 0.32 && t < 0.68) return { text: 'Day ☀️', color: 'text-yellow-300' };
    if (t >= 0.68 && t < 0.82) return { text: 'Sunset 🌇', color: 'text-orange-400' };
    return { text: 'Night 🌙', color: 'text-indigo-300' };
  };

  const dayInfo = getDayPhase(timeOfDay);

  return (
    <div className="pointer-events-none absolute inset-0 select-none overflow-hidden font-mono">
      {/* Damage Flash Overlay */}
      {damageFlash && (
        <div className="absolute inset-0 bg-red-600/30 transition-opacity duration-150" />
      )}

      {/* Underwater Tint Overlay */}
      {isUnderwater && (
        <div className="absolute inset-0 bg-cyan-900/35 backdrop-blur-[0.5px]" />
      )}

      {/* Center Crosshair */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative h-6 w-6">
          <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
          <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
          <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/60" />
        </div>
      </div>

      {/* Top Left: Coordinates, Status, and Controls Help */}
      <div className="absolute left-4 top-4 flex flex-col gap-1.5 rounded-xl border border-white/15 bg-black/70 p-3 text-xs text-white backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="font-black tracking-wider text-amber-400">VOXELVERSE</span>
          <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-300">
            {stats.gameMode}
          </span>
          {isFlying && (
            <span className="rounded bg-sky-500/80 px-1.5 py-0.5 text-[10px] font-bold text-white animate-pulse">
              FLYING
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-zinc-300">
          <span>
            XYZ: <span className="text-white font-bold">{Math.floor(playerPos.x)}</span>,{' '}
            <span className="text-white font-bold">{Math.floor(playerPos.y)}</span>,{' '}
            <span className="text-white font-bold">{Math.floor(playerPos.z)}</span>
          </span>
          <span className={dayInfo.color}>{dayInfo.text}</span>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-300">
          <span>Move: <kbd className="rounded bg-stone-800 px-1 text-white font-bold">↑ ↓ ← →</kbd> or <kbd className="rounded bg-stone-800 px-1 text-white font-bold">WASD</kbd></span>
        </div>

        {/* Clickable Quick Action Buttons */}
        <div className="pointer-events-auto mt-1 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenInventory();
            }}
            className="flex items-center gap-1 rounded bg-stone-800/90 hover:bg-stone-700 px-2 py-1 text-[11px] font-semibold text-white border border-stone-600 transition cursor-pointer active:scale-95"
            title="Open Inventory & Crafting Bench (E)"
          >
            <span>🎒 Bag [E]</span>
          </button>
          <button
            onClick={() => {
              sound.playButtonClick();
              onToggleFly();
            }}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold border transition cursor-pointer active:scale-95 ${
              isFlying
                ? 'bg-sky-600 border-sky-400 text-white'
                : 'bg-stone-800/90 hover:bg-stone-700 border-stone-600 text-white'
            }`}
            title="Toggle Flight (F)"
          >
            <span>🕊️ Fly [F]</span>
          </button>
          <button
            onClick={() => {
              sound.playButtonClick();
              onOpenMenu();
            }}
            className="flex items-center gap-1 rounded bg-stone-800/90 hover:bg-stone-700 px-2 py-1 text-[11px] font-semibold text-white border border-stone-600 transition cursor-pointer active:scale-95"
            title="Open Pause Menu & Settings (ESC)"
          >
            <span>⚙️ Menu [ESC]</span>
          </button>
        </div>
      </div>

      {/* Top Right: Pointer Lock / Look mode status & toggle */}
      <div className="pointer-events-auto absolute right-4 top-4 flex items-center gap-2">
        <button
          onClick={() => {
            sound.playButtonClick();
            onRequestLock();
          }}
          className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-xl cursor-pointer active:scale-95 ${
            isPointerLocked
              ? 'border-emerald-500/60 bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900/80'
              : 'border-amber-500/70 bg-stone-900/95 text-amber-300 hover:bg-stone-800 animate-pulse'
          }`}
        >
          <span>{isPointerLocked ? '🔒 Mouse Look Locked' : '👆 Click to Lock Look'}</span>
        </button>
      </div>

      {/* Bottom Left: Directional Controls & Movement Indicator */}
      <div className="pointer-events-auto absolute bottom-4 left-4 flex flex-col items-center gap-1.5 rounded-2xl border border-white/15 bg-black/75 p-2.5 backdrop-blur-md shadow-2xl">
        <div className="flex w-full items-center justify-between gap-2 px-1 text-[10px] text-zinc-400">
          <span className="font-bold text-amber-300">CONTROLS</span>
          {onResetKeys && (
            <button
              onClick={() => {
                sound.playButtonClick();
                onResetKeys();
              }}
              className="rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 transition cursor-pointer active:scale-95"
              title="Click if any movement keys get stuck"
            >
              🔄 Unstick
            </button>
          )}
        </div>

        {/* Arrow Keys D-Pad */}
        <div className="flex flex-col items-center gap-1">
          {/* UP / Forward */}
          <button
            onMouseDown={() => onDirectionPress?.('forward', true)}
            onMouseUp={() => onDirectionPress?.('forward', false)}
            onMouseLeave={() => onDirectionPress?.('forward', false)}
            onTouchStart={() => onDirectionPress?.('forward', true)}
            onTouchEnd={() => onDirectionPress?.('forward', false)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition cursor-pointer active:scale-95 ${
              inputState.forward
                ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-95'
                : 'bg-stone-800/90 border-stone-600 text-white hover:bg-stone-700'
            }`}
            title="Move Forward (Up Arrow / W)"
          >
            ▲
          </button>

          {/* LEFT - DOWN - RIGHT */}
          <div className="flex items-center gap-1">
            <button
              onMouseDown={() => onDirectionPress?.('left', true)}
              onMouseUp={() => onDirectionPress?.('left', false)}
              onMouseLeave={() => onDirectionPress?.('left', false)}
              onTouchStart={() => onDirectionPress?.('left', true)}
              onTouchEnd={() => onDirectionPress?.('left', false)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition cursor-pointer active:scale-95 ${
                inputState.left
                  ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-95'
                  : 'bg-stone-800/90 border-stone-600 text-white hover:bg-stone-700'
              }`}
              title="Move Left (Left Arrow / A)"
            >
              ◄
            </button>
            <button
              onMouseDown={() => onDirectionPress?.('backward', true)}
              onMouseUp={() => onDirectionPress?.('backward', false)}
              onMouseLeave={() => onDirectionPress?.('backward', false)}
              onTouchStart={() => onDirectionPress?.('backward', true)}
              onTouchEnd={() => onDirectionPress?.('backward', false)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition cursor-pointer active:scale-95 ${
                inputState.backward
                  ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-95'
                  : 'bg-stone-800/90 border-stone-600 text-white hover:bg-stone-700'
              }`}
              title="Move Backward (Down Arrow / S)"
            >
              ▼
            </button>
            <button
              onMouseDown={() => onDirectionPress?.('right', true)}
              onMouseUp={() => onDirectionPress?.('right', false)}
              onMouseLeave={() => onDirectionPress?.('right', false)}
              onTouchStart={() => onDirectionPress?.('right', true)}
              onTouchEnd={() => onDirectionPress?.('right', false)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black transition cursor-pointer active:scale-95 ${
                inputState.right
                  ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-95'
                  : 'bg-stone-800/90 border-stone-600 text-white hover:bg-stone-700'
              }`}
              title="Move Right (Right Arrow / D)"
            >
              ►
            </button>
          </div>

          {/* JUMP */}
          <button
            onMouseDown={() => onDirectionPress?.('jump', true)}
            onMouseUp={() => onDirectionPress?.('jump', false)}
            onMouseLeave={() => onDirectionPress?.('jump', false)}
            onTouchStart={() => onDirectionPress?.('jump', true)}
            onTouchEnd={() => onDirectionPress?.('jump', false)}
            className={`mt-0.5 flex h-7 w-28 items-center justify-center rounded-lg border text-[11px] font-bold transition cursor-pointer active:scale-95 ${
              inputState.jump
                ? 'bg-amber-400 border-amber-300 text-black shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-95'
                : 'bg-stone-800/90 border-stone-600 text-white hover:bg-stone-700'
            }`}
            title="Jump / Fly Up (Space)"
          >
            ⬆ Jump [Space]
          </button>
        </div>
      </div>

      {/* Bottom Center: Vitals & Hotbar */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 pointer-events-none">
        {/* Active item tooltip */}
        {activeItem && (
          <div className="rounded-lg bg-black/80 px-3.5 py-1 text-sm font-bold text-amber-300 shadow-xl border border-white/10 backdrop-blur-sm">
            {activeItem.name}
          </div>
        )}

        {/* Survival Bars */}
        {stats.gameMode === 'survival' && (
          <div className="flex items-center gap-6 rounded-lg bg-black/60 px-3.5 py-1 backdrop-blur-sm shadow-md border border-white/10">
            {/* Health Hearts */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const healthVal = stats.health - i * 2;
                return (
                  <span
                    key={i}
                    className={`text-base ${
                      healthVal <= 0 ? 'text-zinc-600 opacity-40' : 'text-red-500 animate-pulse'
                    }`}
                  >
                    ❤️
                  </span>
                );
              })}
            </div>

            {/* Oxygen Bubbles (Underwater) */}
            {isUnderwater && (
              <div className="flex items-center gap-1 animate-bounce">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-sm ${
                      stats.air - i * 2 <= 0 ? 'text-zinc-600 opacity-30' : 'text-sky-400'
                    }`}
                  >
                    🫧
                  </span>
                ))}
              </div>
            )}

            {/* Hunger Drumsticks */}
            <div className="flex items-center gap-1">
              {Array.from({ length: 10 }).map((_, i) => {
                const foodVal = stats.hunger - i * 2;
                return (
                  <span
                    key={i}
                    className={`text-base ${
                      foodVal <= 0 ? 'text-zinc-600 opacity-40' : 'text-amber-500'
                    }`}
                  >
                    🍗
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 9-Slot Hotbar - Fully interactive clickable buttons */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border-2 border-stone-700/80 bg-stone-900/95 p-2 shadow-2xl backdrop-blur-md">
          {hotbar.map((slot, index) => {
            const isSelected = index === activeSlotIndex;
            const item = slot ? ITEM_REGISTRY[slot.itemId] : null;

            return (
              <button
                key={index}
                onClick={() => {
                  sound.playButtonClick();
                  onSelectSlot(index);
                }}
                className={`relative flex h-14 w-14 items-center justify-center rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-400/20 shadow-[0_0_14px_rgba(251,191,36,0.6)] scale-105'
                    : 'border-stone-700 bg-stone-800/80 hover:border-stone-500 hover:bg-stone-800'
                }`}
              >
                {/* Slot index key number */}
                <span className="absolute left-1 top-0.5 text-[10px] font-bold text-zinc-400">
                  {index + 1}
                </span>

                {/* Item Icon / Symbol */}
                {item && (
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl drop-shadow-md">
                      {item.iconSymbol || '📦'}
                    </span>
                    {/* Stack count */}
                    {slot!.count > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
                        {slot!.count}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
