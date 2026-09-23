import React, { useState } from 'react';
import { CraftingRecipe, InventorySlot } from '../types/game';
import { ITEM_REGISTRY, RECIPES } from '../engine/items';
import { sound } from '../utils/audio';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: (InventorySlot | null)[]; // 27 slots
  hotbar: (InventorySlot | null)[]; // 9 slots
  onUpdateInventory: (inv: (InventorySlot | null)[], hot: (InventorySlot | null)[]) => void;
  gameMode: 'survival' | 'creative';
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  hotbar,
  onUpdateInventory,
  gameMode,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<{
    type: 'inventory' | 'hotbar';
    index: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'survival' | 'recipes' | 'creative'>(
    gameMode === 'creative' ? 'creative' : 'survival'
  );

  // 3x3 crafting grid state (strings or null)
  const [craftGrid, setCraftGrid] = useState<(string | null)[]>([
    null, null, null,
    null, null, null,
    null, null, null,
  ]);

  if (!isOpen) return null;

  // Find if current craft grid matches any recipe
  const findMatchingRecipe = (): { recipe: CraftingRecipe; outputCount: number } | null => {
    for (const r of RECIPES) {
      if (matchesRecipe(craftGrid, r)) {
        return { recipe: r, outputCount: r.output.count };
      }
    }
    return null;
  };

  const matchesRecipe = (grid: (string | null)[], recipe: CraftingRecipe): boolean => {
    // 3x3 grid comparison
    for (let startRow = 0; startRow <= 3 - recipe.height; startRow++) {
      for (let startCol = 0; startCol <= 3 - recipe.width; startCol++) {
        let matched = true;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const gridIdx = r * 3 + c;
            const inRecipeBounds =
              r >= startRow &&
              r < startRow + recipe.height &&
              c >= startCol &&
              c < startCol + recipe.width;

            if (inRecipeBounds) {
              const recIdx = (r - startRow) * recipe.width + (c - startCol);
              const expectedItem = recipe.grid[recIdx];
              if (grid[gridIdx] !== expectedItem) {
                matched = false;
                break;
              }
            } else {
              if (grid[gridIdx] !== null) {
                matched = false;
                break;
              }
            }
          }
          if (!matched) break;
        }
        if (matched) return true;
      }
    }
    return false;
  };

  const currentMatch = findMatchingRecipe();

  // Handle slot click (move, swap, or select)
  const handleSlotClick = (type: 'inventory' | 'hotbar', index: number) => {
    sound.playFootstep('wood');
    const sourceArr = type === 'inventory' ? [...inventory] : [...hotbar];

    if (!selectedSlot) {
      if (sourceArr[index]) {
        setSelectedSlot({ type, index });
      }
      return;
    }

    // If clicking same slot, deselect
    if (selectedSlot.type === type && selectedSlot.index === index) {
      setSelectedSlot(null);
      return;
    }

    // Perform swap or merge
    const newInv = [...inventory];
    const newHot = [...hotbar];

    const sourceSlot = selectedSlot.type === 'inventory' ? newInv[selectedSlot.index] : newHot[selectedSlot.index];
    const targetSlot = type === 'inventory' ? newInv[index] : newHot[index];

    if (sourceSlot && targetSlot && sourceSlot.itemId === targetSlot.itemId) {
      // Merge stack
      const itemDef = ITEM_REGISTRY[sourceSlot.itemId];
      const maxStack = itemDef?.maxStack || 64;
      const space = maxStack - targetSlot.count;
      const transfer = Math.min(space, sourceSlot.count);

      targetSlot.count += transfer;
      sourceSlot.count -= transfer;

      const remainingSource = sourceSlot.count > 0 ? sourceSlot : null;
      if (selectedSlot.type === 'inventory') newInv[selectedSlot.index] = remainingSource;
      else newHot[selectedSlot.index] = remainingSource;

      if (type === 'inventory') newInv[index] = targetSlot;
      else newHot[index] = targetSlot;
    } else {
      // Direct Swap
      if (selectedSlot.type === 'inventory') newInv[selectedSlot.index] = targetSlot;
      else newHot[selectedSlot.index] = targetSlot;

      if (type === 'inventory') newInv[index] = sourceSlot;
      else newHot[index] = sourceSlot;
    }

    onUpdateInventory(newInv, newHot);
    setSelectedSlot(null);
  };

  // Click on Crafting Grid cell
  const handleGridCellClick = (idx: number) => {
    sound.playFootstep('wood');
    if (selectedSlot) {
      const sourceArr = selectedSlot.type === 'inventory' ? [...inventory] : [...hotbar];
      const item = sourceArr[selectedSlot.index];
      if (item) {
        const nextGrid = [...craftGrid];
        nextGrid[idx] = item.itemId;
        setCraftGrid(nextGrid);

        // Deduct 1 from source
        if (item.count > 1) {
          item.count -= 1;
        } else {
          sourceArr[selectedSlot.index] = null;
          setSelectedSlot(null);
        }

        if (selectedSlot.type === 'inventory') onUpdateInventory(sourceArr, hotbar);
        else onUpdateInventory(inventory, sourceArr);
      }
    } else {
      // Take item back from grid to inventory
      const currentItemInGrid = craftGrid[idx];
      if (currentItemInGrid) {
        const nextGrid = [...craftGrid];
        nextGrid[idx] = null;
        setCraftGrid(nextGrid);
        addItemToInventory(currentItemInGrid, 1);
      }
    }
  };

  // Add item helper
  const addItemToInventory = (itemId: string, count: number) => {
    const newHot = [...hotbar];
    const newInv = [...inventory];
    const itemDef = ITEM_REGISTRY[itemId];
    const maxStack = itemDef?.maxStack || 64;

    // Check hotbar stacks
    for (let i = 0; i < newHot.length; i++) {
      if (newHot[i] && newHot[i]!.itemId === itemId && newHot[i]!.count < maxStack) {
        const space = maxStack - newHot[i]!.count;
        const add = Math.min(space, count);
        newHot[i]!.count += add;
        count -= add;
        if (count <= 0) break;
      }
    }

    // Check inventory stacks
    if (count > 0) {
      for (let i = 0; i < newInv.length; i++) {
        if (newInv[i] && newInv[i]!.itemId === itemId && newInv[i]!.count < maxStack) {
          const space = maxStack - newInv[i]!.count;
          const add = Math.min(space, count);
          newInv[i]!.count += add;
          count -= add;
          if (count <= 0) break;
        }
      }
    }

    // Check empty slots
    if (count > 0) {
      for (let i = 0; i < newHot.length; i++) {
        if (!newHot[i]) {
          newHot[i] = { itemId, count };
          count = 0;
          break;
        }
      }
    }
    if (count > 0) {
      for (let i = 0; i < newInv.length; i++) {
        if (!newInv[i]) {
          newInv[i] = { itemId, count };
          count = 0;
          break;
        }
      }
    }

    onUpdateInventory(newInv, newHot);
  };

  // Perform Craft
  const handleCraft = () => {
    if (!currentMatch) return;
    const { recipe } = currentMatch;

    // Add crafted output to inventory
    addItemToInventory(recipe.output.itemId, recipe.output.count);
    sound.playCraft();

    // Deduct 1 from all non-null grid cells
    const nextGrid = [...craftGrid];
    for (let i = 0; i < 9; i++) {
      if (nextGrid[i]) {
        nextGrid[i] = null;
      }
    }
    setCraftGrid(nextGrid);
  };

  // Quick craft from recipe book
  const handleQuickCraft = (recipe: CraftingRecipe) => {
    // Count ingredients needed
    const reqCounts: Record<string, number> = {};
    for (const item of recipe.grid) {
      if (item) {
        reqCounts[item] = (reqCounts[item] || 0) + 1;
      }
    }

    // Check if player has all ingredients
    const allSlots = [...hotbar, ...inventory];
    const availableCounts: Record<string, number> = {};
    allSlots.forEach(s => {
      if (s) {
        availableCounts[s.itemId] = (availableCounts[s.itemId] || 0) + s.count;
      }
    });

    for (const [itemId, needed] of Object.entries(reqCounts)) {
      if ((availableCounts[itemId] || 0) < needed) {
        return; // not enough ingredients
      }
    }

    // Deduct ingredients
    const newHot = [...hotbar];
    const newInv = [...inventory];

    const deduct = (itemId: string, amount: number) => {
      let rem = amount;
      for (let i = 0; i < newHot.length; i++) {
        if (newHot[i] && newHot[i]!.itemId === itemId) {
          const take = Math.min(rem, newHot[i]!.count);
          newHot[i]!.count -= take;
          rem -= take;
          if (newHot[i]!.count <= 0) newHot[i] = null;
          if (rem <= 0) return;
        }
      }
      for (let i = 0; i < newInv.length; i++) {
        if (newInv[i] && newInv[i]!.itemId === itemId) {
          const take = Math.min(rem, newInv[i]!.count);
          newInv[i]!.count -= take;
          rem -= take;
          if (newInv[i]!.count <= 0) newInv[i] = null;
          if (rem <= 0) return;
        }
      }
    };

    for (const [itemId, needed] of Object.entries(reqCounts)) {
      deduct(itemId, needed);
    }

    onUpdateInventory(newInv, newHot);
    addItemToInventory(recipe.output.itemId, recipe.output.count);
    sound.playCraft();
  };

  // Selected item description
  const inspectingItem = selectedSlot
    ? selectedSlot.type === 'inventory'
      ? inventory[selectedSlot.index]
      : hotbar[selectedSlot.index]
    : null;
  const inspectingDef = inspectingItem ? ITEM_REGISTRY[inspectingItem.itemId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md font-mono select-none">
      <div className="relative flex max-h-[92vh] w-[900px] flex-col rounded-2xl border border-stone-600 bg-stone-900 p-6 shadow-2xl text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-700 pb-3">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold tracking-wide text-amber-400">INVENTORY & CRAFTING</h2>
            <div className="flex rounded-lg bg-stone-800 p-1 border border-stone-700 text-xs">
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab('survival');
                }}
                className={`rounded px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                  activeTab === 'survival' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-300 hover:text-white'
                }`}
              >
                Backpack & Bench
              </button>
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab('recipes');
                }}
                className={`rounded px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                  activeTab === 'recipes' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-300 hover:text-white'
                }`}
              >
                Recipe Book
              </button>
              <button
                onClick={() => {
                  sound.playButtonClick();
                  setActiveTab('creative');
                }}
                className={`rounded px-3 py-1 font-semibold transition cursor-pointer active:scale-95 ${
                  activeTab === 'creative' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-300 hover:text-white'
                }`}
              >
                Item Catalog
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playButtonClick();
              onClose();
            }}
            className="rounded-lg bg-stone-800 px-3 py-1 text-sm font-bold text-stone-400 hover:bg-stone-700 hover:text-white transition cursor-pointer active:scale-95"
          >
            ESC ✕
          </button>
        </div>

        {/* Content Tabs */}
        {activeTab === 'survival' && (
          <div className="mt-4 grid grid-cols-12 gap-6">
            {/* Left Column: Backpack (27 slots) + Hotbar (9 slots) */}
            <div className="col-span-7 flex flex-col gap-4">
              <div>
                <span className="text-xs font-bold text-stone-400 tracking-wider">BACKPACK STORAGE (27)</span>
                <div className="mt-1.5 grid grid-cols-9 gap-1.5 rounded-xl border border-stone-700 bg-stone-950/60 p-2.5">
                  {inventory.map((slot, idx) => {
                    const item = slot ? ITEM_REGISTRY[slot.itemId] : null;
                    const isSelected = selectedSlot?.type === 'inventory' && selectedSlot.index === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSlotClick('inventory', idx)}
                        className={`relative flex h-12 w-12 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? 'border-yellow-400 bg-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'border-stone-800 bg-stone-800/80 hover:border-stone-600'
                        }`}
                      >
                        {item && (
                          <>
                            <span className="text-2xl drop-shadow">{item.iconSymbol || '📦'}</span>
                            {slot!.count > 1 && (
                              <span className="absolute bottom-0.5 right-1 text-[11px] font-black text-white drop-shadow">
                                {slot!.count}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hotbar (9 slots) */}
              <div>
                <span className="text-xs font-bold text-amber-400 tracking-wider">HOTBAR (SLOTS 1-9)</span>
                <div className="mt-1.5 grid grid-cols-9 gap-1.5 rounded-xl border border-stone-700 bg-stone-950/60 p-2.5">
                  {hotbar.map((slot, idx) => {
                    const item = slot ? ITEM_REGISTRY[slot.itemId] : null;
                    const isSelected = selectedSlot?.type === 'hotbar' && selectedSlot.index === idx;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSlotClick('hotbar', idx)}
                        className={`relative flex h-12 w-12 items-center justify-center rounded-lg border transition ${
                          isSelected
                            ? 'border-yellow-400 bg-amber-500/30 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'border-stone-700 bg-stone-800/80 hover:border-stone-500'
                        }`}
                      >
                        <span className="absolute left-1 top-0.5 text-[9px] font-bold text-stone-500">
                          {idx + 1}
                        </span>
                        {item && (
                          <>
                            <span className="text-2xl drop-shadow">{item.iconSymbol || '📦'}</span>
                            {slot!.count > 1 && (
                              <span className="absolute bottom-0.5 right-1 text-[11px] font-black text-white drop-shadow">
                                {slot!.count}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Item Details Info Box */}
              {inspectingDef && (
                <div className="rounded-xl border border-stone-700 bg-stone-950/80 p-3 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{inspectingDef.iconSymbol}</span>
                    <span className="font-bold text-amber-300 text-sm">{inspectingDef.name}</span>
                    <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[10px] text-stone-400">
                      {inspectingDef.type}
                    </span>
                  </div>
                  <p className="text-stone-300">{inspectingDef.description}</p>
                  <div className="flex gap-4 text-stone-400 pt-1 text-[11px]">
                    {inspectingDef.miningSpeedMultiplier && (
                      <span>Speed: {inspectingDef.miningSpeedMultiplier}x</span>
                    )}
                    {inspectingDef.attackDamage && (
                      <span>Damage: +{inspectingDef.attackDamage}</span>
                    )}
                    {inspectingDef.foodValue && (
                      <span>Food: +{inspectingDef.foodValue} Hunger</span>
                    )}
                    <span>Stack: {inspectingItem?.count}/{inspectingDef.maxStack}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: 3x3 Crafting Bench */}
            <div className="col-span-5 flex flex-col gap-3 rounded-xl border border-stone-700 bg-stone-950/50 p-4">
              <span className="text-xs font-bold text-stone-400 tracking-wider">CRAFTING BENCH (3x3)</span>

              <div className="flex items-center justify-between gap-4 mt-2">
                {/* 3x3 Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {craftGrid.map((itemId, idx) => {
                    const item = itemId ? ITEM_REGISTRY[itemId] : null;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleGridCellClick(idx)}
                        className="flex h-14 w-14 items-center justify-center rounded-lg border border-stone-700 bg-stone-800/90 text-2xl hover:border-amber-400 transition"
                      >
                        {item ? item.iconSymbol || '📦' : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Arrow */}
                <div className="text-2xl text-stone-500 font-bold">➔</div>

                {/* Output Slot */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={handleCraft}
                    disabled={!currentMatch}
                    className={`relative flex h-16 w-16 items-center justify-center rounded-xl border-2 transition ${
                      currentMatch
                        ? 'border-emerald-400 bg-emerald-950/60 shadow-[0_0_12px_rgba(52,211,153,0.4)] cursor-pointer hover:scale-105'
                        : 'border-stone-800 bg-stone-900/50 cursor-not-allowed opacity-40'
                    }`}
                  >
                    {currentMatch && (
                      <>
                        <span className="text-3xl">
                          {ITEM_REGISTRY[currentMatch.recipe.output.itemId]?.iconSymbol || '📦'}
                        </span>
                        {currentMatch.outputCount > 1 && (
                          <span className="absolute bottom-1 right-1.5 text-xs font-black text-white">
                            {currentMatch.outputCount}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                  <span className="text-[11px] font-bold text-stone-300">
                    {currentMatch ? currentMatch.recipe.name : 'Craft Output'}
                  </span>
                </div>
              </div>

              {/* Clear grid button */}
              <button
                onClick={() => {
                  craftGrid.forEach((id, idx) => {
                    if (id) addItemToInventory(id, 1);
                  });
                  setCraftGrid([null, null, null, null, null, null, null, null, null]);
                }}
                className="mt-3 rounded border border-stone-700 bg-stone-800/60 py-1.5 text-xs text-stone-400 hover:text-white"
              >
                Clear Crafting Grid
              </button>
            </div>
          </div>
        )}

        {/* Recipe Book Tab */}
        {activeTab === 'recipes' && (
          <div className="mt-4 flex max-h-[58vh] flex-col overflow-y-auto pr-2">
            <span className="mb-2 text-xs font-bold text-stone-400">
              CLICK ANY RECIPE TO QUICK-CRAFT WITH AVAILABLE RESOURCES
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {RECIPES.map((recipe) => {
                const outDef = ITEM_REGISTRY[recipe.output.itemId];
                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleQuickCraft(recipe)}
                    className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-950/60 p-3 text-left hover:border-amber-400 hover:bg-stone-800/60 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{outDef?.iconSymbol || '📦'}</span>
                      <div>
                        <div className="font-bold text-white group-hover:text-amber-300">
                          {recipe.name}
                        </div>
                        <div className="text-xs text-stone-400">
                          {recipe.grid.filter(Boolean).map((id, i) => (
                            <span key={i} className="mr-1.5">
                              {ITEM_REGISTRY[id!]?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="rounded bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-300 group-hover:bg-amber-500 group-hover:text-stone-950 transition">
                      Craft
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Creative Item Catalog Tab */}
        {activeTab === 'creative' && (
          <div className="mt-4 flex max-h-[58vh] flex-col overflow-y-auto pr-2">
            <span className="mb-2 text-xs font-bold text-amber-400">
              CREATIVE CATALOG: CLICK ANY ITEM TO INSTANTLY ADD A FULL STACK (x64)
            </span>
            <div className="grid grid-cols-4 gap-2.5">
              {Object.values(ITEM_REGISTRY).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    addItemToInventory(item.id, item.maxStack);
                    sound.playPickup();
                  }}
                  className="flex items-center gap-2.5 rounded-xl border border-stone-800 bg-stone-950/60 p-2.5 text-left hover:border-yellow-400 hover:bg-stone-800/80 transition"
                >
                  <span className="text-2xl">{item.iconSymbol || '📦'}</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-xs font-bold text-white">{item.name}</span>
                    <span className="text-[10px] text-stone-400 capitalize">{item.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
