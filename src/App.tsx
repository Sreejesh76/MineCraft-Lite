/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BlockType, GameSettings, InventorySlot, PlayerStats } from './types/game';
import { GameRenderer } from './engine/renderer';
import { WorldManager, RaycastHit, isBlockSolid } from './engine/world';
import { Player, PlayerInput } from './engine/player';
import { EntityManager } from './engine/entities';
import { ITEM_REGISTRY } from './engine/items';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { PauseMenu } from './components/PauseMenu';
import { ControlsOverlay } from './components/ControlsOverlay';
import { sound } from './utils/audio';

const STORAGE_KEY = 'voxelverse_saved_world_v1';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Engine instance references
  const rendererRef = useRef<GameRenderer | null>(null);
  const worldRef = useRef<WorldManager | null>(null);
  const playerRef = useRef<Player | null>(null);
  const entitiesRef = useRef<EntityManager | null>(null);
  const currentHitRef = useRef<RaycastHit | null>(null);

  // Input states (Arrow keys + WASD)
  const inputRef = useRef<PlayerInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sneak: false,
    sprint: false,
  });

  // UI state
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [damageFlash, setDamageFlash] = useState<boolean>(false);

  // Settings
  const [settings, setSettings] = useState<GameSettings>({
    fov: 75,
    mouseSensitivity: 0.0022,
    soundEnabled: true,
    soundVolume: 0.5,
    renderDistance: 3, // radius: 7x7 chunks
    showCoordinates: true,
    dayCycleSpeed: 1.0,
  });

  // Hotbar (9 slots) & Inventory (27 slots)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);

  const [hotbar, setHotbar] = useState<(InventorySlot | null)[]>([
    { itemId: 'stone_pickaxe', count: 1 },
    { itemId: 'stone_sword', count: 1 },
    { itemId: 'wood_log', count: 32 },
    { itemId: 'cobblestone', count: 64 },
    { itemId: 'torch', count: 24 },
    { itemId: 'crafting_bench', count: 1 },
    { itemId: 'apple', count: 8 },
    { itemId: 'glass', count: 16 },
    { itemId: 'bricks', count: 32 },
  ]);

  const [inventory, setInventory] = useState<(InventorySlot | null)[]>(() => {
    const slots = new Array(27).fill(null);
    slots[0] = { itemId: 'stick', count: 16 };
    slots[1] = { itemId: 'coal', count: 12 };
    slots[2] = { itemId: 'dirt', count: 32 };
    return slots;
  });

  // Player Stats for HUD
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    air: 20,
    maxAir: 20,
    isDead: false,
    score: 0,
    gameMode: 'survival',
  });

  // HUD Info
  const [playerPos, setPlayerPos] = useState<{ x: number; y: number; z: number }>({ x: 8, y: 32, z: 8 });
  const [timeOfDay, setTimeOfDay] = useState<number>(0.2);
  const [isUnderwater, setIsUnderwater] = useState<boolean>(false);
  const [isFlying, setIsFlying] = useState<boolean>(false);

  // Active inputs state for HUD visualization & virtual controls
  const [hudInputState, setHudInputState] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });

  const pressedKeysRef = useRef<Set<string>>(new Set());
  const virtualInputsRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  const updateInputRef = useRef<(() => void) | null>(null);

  // Input reset helper to guarantee movement keys NEVER get locked or stuck
  const resetAllInputs = useCallback(() => {
    pressedKeysRef.current.clear();
    virtualInputsRef.current = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    };
    const inp = inputRef.current;
    inp.forward = false;
    inp.backward = false;
    inp.left = false;
    inp.right = false;
    inp.jump = false;
    inp.sneak = false;
    inp.sprint = false;
    setHudInputState({
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
    });
  }, []);

  // Direct directional press handler (from on-screen D-Pad or buttons)
  const handleDirectionPress = useCallback((direction: 'forward' | 'backward' | 'left' | 'right' | 'jump', active: boolean) => {
    virtualInputsRef.current[direction] = active;
    if (updateInputRef.current) {
      updateInputRef.current();
    } else {
      inputRef.current[direction] = active;
      setHudInputState((prev) => ({ ...prev, [direction]: active }));
    }
    if (direction === 'jump' && active && playerRef.current) {
      playerRef.current.handleJumpTap();
    }
  }, []);

  // Synchronous Refs for Game Loop & Event Handlers
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const hotbarRef = useRef(hotbar);
  hotbarRef.current = hotbar;

  const activeSlotIndexRef = useRef(activeSlotIndex);
  activeSlotIndexRef.current = activeSlotIndex;

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const isInventoryOpenRef = useRef(isInventoryOpen);
  isInventoryOpenRef.current = isInventoryOpen;

  const isDraggingLookRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Damage flash helper
  const triggerDamageFlash = useCallback(() => {
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 200);
  }, []);

  // Sync settings with audio & FOV
  useEffect(() => {
    sound.enabled = settings.soundEnabled;
    sound.volume = settings.soundVolume;
    if (rendererRef.current) {
      rendererRef.current.setFov(settings.fov);
    }
  }, [settings]);

  // Sync held item with renderer
  useEffect(() => {
    if (rendererRef.current) {
      const activeSlot = hotbar[activeSlotIndex];
      rendererRef.current.updateHeldItem(activeSlot ? activeSlot.itemId : null);
    }
  }, [activeSlotIndex, hotbar]);

  // Request pointer lock with fallback
  const requestLock = useCallback(() => {
    setGameStarted(true);
    const container = containerRef.current;
    if (container && !isPausedRef.current && !isInventoryOpenRef.current) {
      try {
        const promise = container.requestPointerLock?.();
        if (promise && 'catch' in promise) {
          promise.catch(() => {
            // Pointer lock not allowed by iframe permissions, drag-to-look will handle it!
          });
        }
      } catch {
        // Fallback to drag-to-look
      }
    }
  }, []);

  // Main Engine Initialization (Run ONCE on mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Create 3D Renderer
    const renderer = new GameRenderer(container);
    rendererRef.current = renderer;

    // 2. Create World Manager
    const world = new WorldManager(renderer.scene, 58219);
    world.renderDistance = settingsRef.current.renderDistance;
    worldRef.current = world;

    // 3. Create Player
    const player = new Player(renderer.camera);
    playerRef.current = player;

    // 4. Initial chunk generation around spawn
    const spawnX = 8;
    const spawnZ = 8;
    world.updatePlayerChunks(spawnX, spawnZ);

    // Find surface ground height
    let groundY = 24;
    for (let y = 46; y >= 1; y--) {
      if (isBlockSolid(world.getBlock(spawnX, y, spawnZ))) {
        groundY = y;
        break;
      }
    }

    // 5. Build Inbuilt Starter House with foundation, walls, glass windows, roof & furnishings
    const houseX = spawnX + 3;
    const houseZ = spawnZ + 2;
    world.buildStarterHouse(houseX, groundY, houseZ);

    // Ensure clear headroom and path around spawn & house porch
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 1; dy <= 4; dy++) {
          world.setBlock(spawnX + dx, groundY + dy, spawnZ + dz, BlockType.AIR);
        }
      }
    }

    // Place player right outside the front porch
    player.setPosition(spawnX, groundY + 1.1, spawnZ);
    world.updatePlayerChunks(spawnX, spawnZ);

    // 6. Create Entity Manager
    const entities = new EntityManager(renderer.scene);
    entitiesRef.current = entities;

    // Spawn In-built Loyal Pet Companion (Buddy) right beside the player!
    entities.spawnPet(spawnX + 1.6, groundY + 1.0, spawnZ + 1.0);

    // Spawn prehistoric Dinosaur roaming nearby
    entities.spawnDino(spawnX + 14, groundY + 1.0, spawnZ + 12);

    // Spawn friendly Boar & Ram in the meadow
    entities.spawnBoar(spawnX - 7, groundY + 1.0, spawnZ + 6);
    entities.spawnRam(spawnX - 9, groundY + 1.0, spawnZ - 5);

    // Spawn initial Spider and Zombie in distant trees
    entities.spawnSpider(spawnX + 20, groundY + 1.0, spawnZ - 12);
    entities.spawnZombie(spawnX - 18, groundY + 1.0, spawnZ + 16);

    // Initial held item
    renderer.updateHeldItem(hotbarRef.current[0]?.itemId || null);

    // Pointer Lock state listener
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === container;
      setIsPointerLocked(isLocked);
      if (!isLocked) {
        resetAllInputs();
      }
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    // Mouse Move (Handles both Pointer Lock AND Drag-to-look fallback)
    const handleMouseMove = (e: MouseEvent) => {
      const curPlayer = playerRef.current;
      if (!curPlayer) return;

      const sens = settingsRef.current.mouseSensitivity;

      if (document.pointerLockElement === container) {
        curPlayer.updateRotation(e.movementX, e.movementY, sens);
      } else if (isDraggingLookRef.current) {
        const dx = e.clientX - lastMousePosRef.current.x;
        const dy = e.clientY - lastMousePosRef.current.y;
        curPlayer.updateRotation(dx, dy, sens);
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Mouse Down (Drag start, Mining, Attacking, Placing, Pet interaction)
    const handleMouseDown = (e: MouseEvent) => {
      if (isPausedRef.current || isInventoryOpenRef.current) return;

      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }

      isDraggingLookRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const curPlayer = playerRef.current;
      const curWorld = worldRef.current;
      const curEntities = entitiesRef.current;
      const curRenderer = rendererRef.current;
      if (!curPlayer || !curWorld || !curEntities || !curRenderer || curPlayer.stats.isDead) return;

      const curSlot = hotbarRef.current[activeSlotIndexRef.current];
      const activeDef = curSlot ? ITEM_REGISTRY[curSlot.itemId] : null;

      // LEFT CLICK: Attack Mob or Mine Block
      if (e.button === 0) {
        curRenderer.triggerSwing();

        // 1. Attack Mob Check
        const lookDir = curPlayer.getLookDirection();
        const eyePos = curPlayer.camera.position;
        let attackedMob = false;

        for (const mob of curEntities.mobs) {
          if (mob.type === 'pet') continue; // Don't hurt your own pet!
          const mobPos = new THREE.Vector3(mob.x, mob.y + 0.6, mob.z);
          const toMob = mobPos.clone().sub(eyePos);
          const dist = toMob.length();

          if (dist < 4.5) {
            const angle = lookDir.angleTo(toMob.normalize());
            if (angle < 0.4) {
              const damage = activeDef?.attackDamage || 1;
              curEntities.damageMob(mob.id, damage, lookDir);
              attackedMob = true;
              break;
            }
          }
        }

        // 2. Mine Block Check
        if (!attackedMob && currentHitRef.current) {
          const hit = currentHitRef.current;
          const minedBlock = hit.blockType;

          if (minedBlock !== BlockType.AIR && minedBlock !== BlockType.WATER) {
            curWorld.setBlock(hit.blockX, hit.blockY, hit.blockZ, BlockType.AIR);
            curWorld.updatePlayerChunks(curPlayer.position.x, curPlayer.position.z);

            curRenderer.spawnBreakParticles(hit.blockX, hit.blockY, hit.blockZ, minedBlock);
            sound.playBlockBreak();

            let dropItemId = 'dirt';
            if (minedBlock === BlockType.GRASS || minedBlock === BlockType.DIRT) dropItemId = 'dirt';
            else if (minedBlock === BlockType.STONE || minedBlock === BlockType.COBBLESTONE) dropItemId = 'cobblestone';
            else if (minedBlock === BlockType.SAND) dropItemId = 'sand';
            else if (minedBlock === BlockType.WOOD) dropItemId = 'wood_log';
            else if (minedBlock === BlockType.LEAVES) dropItemId = Math.random() > 0.6 ? 'apple' : 'stick';
            else if (minedBlock === BlockType.PLANKS) dropItemId = 'planks';
            else if (minedBlock === BlockType.COAL_ORE) dropItemId = 'coal';
            else if (minedBlock === BlockType.IRON_ORE) dropItemId = 'iron_ore';
            else if (minedBlock === BlockType.GOLD_ORE) dropItemId = 'gold_ore';
            else if (minedBlock === BlockType.DIAMOND_ORE) dropItemId = 'diamond';
            else if (minedBlock === BlockType.CRAFTING_BENCH) dropItemId = 'crafting_bench';
            else if (minedBlock === BlockType.TORCH) dropItemId = 'torch';
            else if (minedBlock === BlockType.BRICKS) dropItemId = 'bricks';
            else if (minedBlock === BlockType.STONE_BRICKS) dropItemId = 'stone_bricks';
            else if (minedBlock === BlockType.GLASS) dropItemId = 'glass';

            curEntities.spawnDroppedItem(
              dropItemId,
              1,
              hit.blockX + 0.5,
              hit.blockY + 0.5,
              hit.blockZ + 0.5
            );
          }
        }
      }

      // RIGHT CLICK: Pet interact, Eat Food, Open Bench, Place Block
      if (e.button === 2) {
        e.preventDefault();

        // 1. Pet Interaction Check (Sit / Stand toggle)
        const eyePos = curPlayer.camera.position;
        const lookDir = curPlayer.getLookDirection();
        for (const mob of curEntities.mobs) {
          if (mob.type === 'pet') {
            const petPos = new THREE.Vector3(mob.x, mob.y + 0.4, mob.z);
            const toPet = petPos.clone().sub(eyePos);
            if (toPet.length() < 4.0 && lookDir.angleTo(toPet.normalize()) < 0.4) {
              mob.isPetSitting = !mob.isPetSitting;
              if (mob.isPetSitting) {
                sound.playPetWhine();
              } else {
                sound.playPetBark();
              }
              curRenderer.triggerSwing();
              return;
            }
          }
        }

        // 2. Eat Food
        if (activeDef && activeDef.type === 'food' && activeDef.foodValue) {
          if (curPlayer.stats.hunger < curPlayer.stats.maxHunger || curPlayer.stats.health < curPlayer.stats.maxHealth) {
            curPlayer.feed(activeDef.foodValue);
            curPlayer.heal(Math.floor(activeDef.foodValue / 2));
            sound.playPickup();
            curRenderer.triggerSwing();

            setHotbar((prev) => {
              const next = [...prev];
              const idx = activeSlotIndexRef.current;
              if (next[idx]) {
                next[idx]!.count -= 1;
                if (next[idx]!.count <= 0) next[idx] = null;
              }
              return next;
            });
            return;
          }
        }

        // 3. Open Crafting Bench
        if (currentHitRef.current && currentHitRef.current.blockType === BlockType.CRAFTING_BENCH) {
          setIsInventoryOpen(true);
          document.exitPointerLock?.();
          return;
        }

        // 4. Place Block
        if (activeDef && activeDef.type === 'block' && activeDef.blockId && currentHitRef.current) {
          const hit = currentHitRef.current;
          const px = hit.placeX;
          const py = hit.placeY;
          const pz = hit.placeZ;

          const playerBox = new THREE.Box3(
            new THREE.Vector3(curPlayer.position.x - curPlayer.width / 2, curPlayer.position.y, curPlayer.position.z - curPlayer.width / 2),
            new THREE.Vector3(curPlayer.position.x + curPlayer.width / 2, curPlayer.position.y + curPlayer.height, curPlayer.position.z + curPlayer.width / 2)
          );
          const blockBox = new THREE.Box3(
            new THREE.Vector3(px, py, pz),
            new THREE.Vector3(px + 1, py + 1, pz + 1)
          );

          if (!playerBox.intersectsBox(blockBox)) {
            curWorld.setBlock(px, py, pz, activeDef.blockId);
            curWorld.updatePlayerChunks(curPlayer.position.x, curPlayer.position.z);
            sound.playBlockPlace();
            curRenderer.triggerSwing();

            if (curPlayer.stats.gameMode === 'survival') {
              setHotbar((prev) => {
                const next = [...prev];
                const idx = activeSlotIndexRef.current;
                if (next[idx]) {
                  next[idx]!.count -= 1;
                  if (next[idx]!.count <= 0) next[idx] = null;
                }
                return next;
              });
            }
          }
        }
      }
    };
    window.addEventListener('mousedown', handleMouseDown);

    const handleMouseUp = () => {
      isDraggingLookRef.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener('contextmenu', handleContextMenu);

    // Synchronize player input states from active keys and virtual controls
    const updateInputFromKeys = () => {
      const keys = pressedKeysRef.current;
      const v = virtualInputsRef.current;
      const fwd = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('w') || keys.has('arrowup') || v.forward;
      const bwd = keys.has('ArrowDown') || keys.has('KeyS') || keys.has('s') || keys.has('arrowdown') || v.backward;
      const lft = keys.has('ArrowLeft') || keys.has('KeyA') || keys.has('a') || keys.has('arrowleft') || v.left;
      const rgt = keys.has('ArrowRight') || keys.has('KeyD') || keys.has('d') || keys.has('arrowright') || v.right;
      const jmp = keys.has('Space') || keys.has(' ') || v.jump;
      const spr = keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('shift');
      const snk = keys.has('KeyC') || keys.has('c') || keys.has('ControlLeft') || keys.has('ControlRight');

      const inp = inputRef.current;
      inp.forward = fwd;
      inp.backward = bwd;
      inp.left = lft;
      inp.right = rgt;
      inp.jump = jmp;
      inp.sprint = spr;
      inp.sneak = snk;

      setHudInputState({
        forward: fwd,
        backward: bwd,
        left: lft,
        right: rgt,
        jump: jmp,
      });
    };
    updateInputRef.current = updateInputFromKeys;

    // Keyboard handlers (Movement with ARROW KEYS and WASD)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent browser page scrolling when using Arrow keys or Space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.code === 'KeyE') {
        resetAllInputs();
        if (!isPausedRef.current) {
          setIsInventoryOpen((prev) => {
            const next = !prev;
            if (next) document.exitPointerLock?.();
            else requestLock();
            return next;
          });
        }
        return;
      }

      if (e.code === 'Escape') {
        resetAllInputs();
        if (isInventoryOpenRef.current) {
          setIsInventoryOpen(false);
          requestLock();
        } else {
          setIsPaused((prev) => {
            const next = !prev;
            if (next) document.exitPointerLock?.();
            else requestLock();
            return next;
          });
        }
        return;
      }

      if (e.code >= 'Digit1' && e.code <= 'Digit9') {
        const slotIdx = parseInt(e.code.replace('Digit', ''), 10) - 1;
        setActiveSlotIndex(slotIdx);
        return;
      }

      if (e.code === 'KeyF') {
        if (playerRef.current) {
          playerRef.current.toggleFlight();
          setIsFlying(playerRef.current.isFlying);
        }
        return;
      }

      if (isPausedRef.current || isInventoryOpenRef.current) {
        return;
      }

      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';
      if (code) pressedKeysRef.current.add(code);
      if (key) pressedKeysRef.current.add(key);

      if (code === 'Space' || key === ' ') {
        playerRef.current?.handleJumpTap();
      }

      updateInputFromKeys();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';
      if (code) pressedKeysRef.current.delete(code);
      if (key) pressedKeysRef.current.delete(key);
      updateInputFromKeys();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Window blur listener to clear keys if user switches away from the window/tab
    window.addEventListener('blur', resetAllInputs);
    const handleVisibilityChange = () => {
      if (document.hidden) resetAllInputs();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Mouse wheel hotbar scroll
    const handleWheel = (e: WheelEvent) => {
      setActiveSlotIndex((prev) => {
        if (e.deltaY > 0) return (prev + 1) % 9;
        return (prev - 1 + 9) % 9;
      });
    };
    window.addEventListener('wheel', handleWheel, { passive: true });

    // Main Game Animation Loop
    let lastTime = performance.now();
    let animId: number;
    let mobSpawnTimer = 0;

    const gameLoop = (now: number) => {
      animId = requestAnimationFrame(gameLoop);
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const world = worldRef.current;
      const player = playerRef.current;
      const entities = entitiesRef.current;
      const renderer = rendererRef.current;
      if (!world || !player || !entities || !renderer) return;

      // Update Player Physics
      player.update(dt, inputRef.current, world);

      // Raycast target block
      const rayOrigin = player.camera.position;
      const rayDir = player.getLookDirection();
      const hit = world.raycastVoxel(rayOrigin, rayDir, 5.5);
      currentHitRef.current = hit;

      if (hit) {
        renderer.targetBox.position.set(hit.blockX + 0.5, hit.blockY + 0.5, hit.blockZ + 0.5);
        renderer.targetBox.visible = true;
      } else {
        renderer.targetBox.visible = false;
      }

      // Update World Chunks around Player
      world.updatePlayerChunks(player.position.x, player.position.z);

      // Ambient Mob Spawning (Dinos, Spiders, Zombies, Boars, Rams)
      mobSpawnTimer += dt;
      if (mobSpawnTimer > 6.0) {
        mobSpawnTimer = 0;
        if (entities.mobs.length < 10) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 18 + Math.random() * 12;
          const mx = Math.floor(player.position.x + Math.cos(angle) * dist);
          const mz = Math.floor(player.position.z + Math.sin(angle) * dist);

          for (let my = 46; my >= 2; my--) {
            if (isBlockSolid(world.getBlock(mx, my, mz)) && !isBlockSolid(world.getBlock(mx, my + 1, mz))) {
              const isNight = renderer.timeOfDay < 0.2 || renderer.timeOfDay > 0.8;
              if (isNight) {
                const randNight = Math.random();
                if (randNight < 0.4) {
                  entities.spawnZombie(mx + 0.5, my + 1, mz + 0.5);
                } else if (randNight < 0.75) {
                  entities.spawnSpider(mx + 0.5, my + 1, mz + 0.5);
                } else {
                  entities.spawnShadowCrawler(mx + 0.5, my + 1, mz + 0.5);
                }
              } else {
                const randDay = Math.random();
                if (randDay < 0.3) {
                  entities.spawnDino(mx + 0.5, my + 1, mz + 0.5);
                } else if (randDay < 0.65) {
                  entities.spawnBoar(mx + 0.5, my + 1, mz + 0.5);
                } else {
                  entities.spawnRam(mx + 0.5, my + 1, mz + 0.5);
                }
              }
              break;
            }
          }
        }
      }

      // Entities & Mob AI
      entities.update(
        dt,
        player.position,
        world,
        (damage) => {
          player.takeDamage(damage, 'monster');
          triggerDamageFlash();
        },
        (itemId, count) => {
          setHotbar((prevHot) => {
            const nextHot = [...prevHot];
            let rem = count;
            const itemDef = ITEM_REGISTRY[itemId];
            const maxStack = itemDef?.maxStack || 64;

            for (let i = 0; i < 9; i++) {
              if (nextHot[i] && nextHot[i]!.itemId === itemId && nextHot[i]!.count < maxStack) {
                const add = Math.min(maxStack - nextHot[i]!.count, rem);
                nextHot[i]!.count += add;
                rem -= add;
                if (rem <= 0) break;
              }
            }
            if (rem > 0) {
              for (let i = 0; i < 9; i++) {
                if (!nextHot[i]) {
                  nextHot[i] = { itemId, count: rem };
                  rem = 0;
                  break;
                }
              }
            }
            if (rem > 0) {
              setInventory((prevInv) => {
                const nextInv = [...prevInv];
                for (let i = 0; i < 27; i++) {
                  if (nextInv[i] && nextInv[i]!.itemId === itemId && nextInv[i]!.count < maxStack) {
                    const add = Math.min(maxStack - nextInv[i]!.count, rem);
                    nextInv[i]!.count += add;
                    rem -= add;
                    if (rem <= 0) break;
                  }
                }
                if (rem > 0) {
                  for (let i = 0; i < 27; i++) {
                    if (!nextInv[i]) {
                      nextInv[i] = { itemId, count: rem };
                      rem = 0;
                      break;
                    }
                  }
                }
                return nextInv;
              });
            }
            return nextHot;
          });
        }
      );

      // Render 3D Scene
      renderer.update(dt, player.position, player.isUnderwater, settingsRef.current.dayCycleSpeed);

      // Sync state for HUD
      setPlayerPos({ x: player.position.x, y: player.position.y, z: player.position.z });
      setTimeOfDay(renderer.timeOfDay);
      setIsUnderwater(player.isUnderwater);
      setIsFlying(player.isFlying);
      setPlayerStats({ ...player.stats });
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetAllInputs);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, [triggerDamageFlash, requestLock]);

  // Respawn Handler
  const handleRespawn = () => {
    if (playerRef.current && worldRef.current) {
      const spawnX = 8;
      const spawnZ = 8;
      let groundY = 24;
      for (let y = 46; y >= 1; y--) {
        if (isBlockSolid(worldRef.current.getBlock(spawnX, y, spawnZ))) {
          groundY = y;
          break;
        }
      }
      playerRef.current.respawn(spawnX, groundY + 1.1, spawnZ);
      setIsPaused(false);
      requestLock();
    }
  };

  // Regenerate World with seed (includes House and Pet)
  const handleRegenerateWorld = (newSeed: number = Math.floor(Math.random() * 999999)) => {
    if (!rendererRef.current || !playerRef.current) return;

    if (worldRef.current) {
      for (const [, chunk] of worldRef.current.chunks.entries()) {
        chunk.dispose();
        rendererRef.current.scene.remove(chunk.group);
      }
      worldRef.current.chunks.clear();
    }

    if (entitiesRef.current) {
      entitiesRef.current.clearAll();
    }

    const world = new WorldManager(rendererRef.current.scene, newSeed);
    world.renderDistance = settingsRef.current.renderDistance;
    worldRef.current = world;

    const spawnX = 8;
    const spawnZ = 8;
    world.updatePlayerChunks(spawnX, spawnZ);

    let groundY = 24;
    for (let y = 46; y >= 1; y--) {
      if (isBlockSolid(world.getBlock(spawnX, y, spawnZ))) {
        groundY = y;
        break;
      }
    }

    // Inbuilt starter house
    world.buildStarterHouse(spawnX + 3, groundY, spawnZ + 2);

    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 1; dy <= 4; dy++) {
          world.setBlock(spawnX + dx, groundY + dy, spawnZ + dz, BlockType.AIR);
        }
      }
    }

    playerRef.current.respawn(spawnX, groundY + 1.1, spawnZ);

    if (entitiesRef.current) {
      // In-built pet
      entitiesRef.current.spawnPet(spawnX + 1.6, groundY + 1.0, spawnZ + 1.0);
      // Dino
      entitiesRef.current.spawnDino(spawnX + 14, groundY + 1.0, spawnZ + 12);
      // Friendly animals
      entitiesRef.current.spawnBoar(spawnX + 5, groundY + 1.0, spawnZ + 4);
      entitiesRef.current.spawnRam(spawnX - 4, groundY + 1.0, spawnZ + 5);
      // Spiders and Zombies
      entitiesRef.current.spawnSpider(spawnX + 18, groundY + 1.0, spawnZ - 12);
      entitiesRef.current.spawnZombie(spawnX - 16, groundY + 1.0, spawnZ + 16);
    }

    setIsPaused(false);
    requestLock();
  };

  // Save World to LocalStorage
  const handleSaveWorld = () => {
    if (!playerRef.current || !worldRef.current) return;

    const saveData = {
      seed: worldRef.current.seed,
      playerPos: {
        x: playerRef.current.position.x,
        y: playerRef.current.position.y,
        z: playerRef.current.position.z,
      },
      stats: playerRef.current.stats,
      hotbar,
      inventory,
      timeOfDay: rendererRef.current?.timeOfDay || 0.2,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      sound.playCraft();
      alert('World and inventory saved successfully!');
    } catch {
      // Storage full or unavailable
    }
  };

  // Load World from LocalStorage
  const handleLoadWorld = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        alert('No saved world found in storage!');
        return;
      }
      const data = JSON.parse(raw);
      if (data.seed) {
        handleRegenerateWorld(data.seed);
      }
      if (data.playerPos && playerRef.current) {
        playerRef.current.setPosition(data.playerPos.x, data.playerPos.y, data.playerPos.z);
      }
      if (data.stats && playerRef.current) {
        playerRef.current.stats = data.stats;
      }
      if (data.hotbar) setHotbar(data.hotbar);
      if (data.inventory) setInventory(data.inventory);
      if (data.timeOfDay && rendererRef.current) {
        rendererRef.current.timeOfDay = data.timeOfDay;
      }
      sound.playCraft();
      setIsPaused(false);
      requestLock();
    } catch {
      alert('Failed to load saved world.');
    }
  };

  // Toggle Survival / Creative
  const handleToggleGameMode = () => {
    if (playerRef.current) {
      const nextMode = playerRef.current.stats.gameMode === 'survival' ? 'creative' : 'survival';
      playerRef.current.stats.gameMode = nextMode;
      if (nextMode === 'creative') {
        playerRef.current.stats.health = playerRef.current.stats.maxHealth;
        playerRef.current.stats.hunger = playerRef.current.stats.maxHunger;
      }
      setPlayerStats({ ...playerRef.current.stats });
    }
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 cursor-crosshair" />

      {/* In-Game Heads-Up Display (HUD) */}
      <HUD
        stats={playerStats}
        hotbar={hotbar}
        activeSlotIndex={activeSlotIndex}
        playerPos={playerPos}
        timeOfDay={timeOfDay}
        isUnderwater={isUnderwater}
        isFlying={isFlying}
        damageFlash={damageFlash}
        isPointerLocked={isPointerLocked}
        inputState={hudInputState}
        onRequestLock={requestLock}
        onOpenInventory={() => {
          resetAllInputs();
          setIsInventoryOpen(true);
          document.exitPointerLock?.();
        }}
        onToggleFly={() => {
          if (playerRef.current) {
            playerRef.current.toggleFlight();
            setIsFlying(playerRef.current.isFlying);
          }
        }}
        onOpenMenu={() => {
          resetAllInputs();
          setIsPaused(true);
          document.exitPointerLock?.();
        }}
        onSelectSlot={(idx) => setActiveSlotIndex(idx)}
        onDirectionPress={handleDirectionPress}
        onResetKeys={resetAllInputs}
      />

      {/* Start Game Modal */}
      <ControlsOverlay
        gameStarted={gameStarted}
        isLocked={isPointerLocked}
        onStartClick={requestLock}
        isPaused={isPaused}
        isInventoryOpen={isInventoryOpen}
      />

      {/* 27-Slot Inventory & 3x3 Crafting Bench Modal */}
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => {
          setIsInventoryOpen(false);
          requestLock();
        }}
        inventory={inventory}
        hotbar={hotbar}
        onUpdateInventory={(newInv, newHot) => {
          setInventory(newInv);
          setHotbar(newHot);
        }}
        gameMode={playerStats.gameMode}
      />

      {/* Pause Menu & Game Settings Modal */}
      <PauseMenu
        isOpen={isPaused}
        onResume={() => {
          setIsPaused(false);
          requestLock();
        }}
        settings={settings}
        onUpdateSettings={(newSet) => setSettings((s) => ({ ...s, ...newSet }))}
        stats={playerStats}
        onToggleGameMode={handleToggleGameMode}
        onRespawn={handleRespawn}
        onRegenerateWorld={handleRegenerateWorld}
        onSaveWorld={handleSaveWorld}
        onLoadWorld={handleLoadWorld}
      />
    </div>
  );
}
