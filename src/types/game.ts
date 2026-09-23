export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  SAND = 4,
  WATER = 5,
  WOOD = 6,
  LEAVES = 7,
  PLANKS = 8,
  COBBLESTONE = 9,
  COAL_ORE = 10,
  IRON_ORE = 11,
  GOLD_ORE = 12,
  DIAMOND_ORE = 13,
  GLASS = 14,
  BRICKS = 15,
  CRAFTING_BENCH = 16,
  TORCH = 17,
  STONE_BRICKS = 18,
  SNOW = 19,
  FLOWER = 20,
}

export type ItemType =
  | 'block'
  | 'tool_pickaxe'
  | 'tool_axe'
  | 'tool_shovel'
  | 'tool_sword'
  | 'material'
  | 'food';

export interface ItemDef {
  id: string;
  name: string;
  type: ItemType;
  blockId?: BlockType;
  iconColor: string;
  iconSymbol?: string;
  description: string;
  maxStack: number;
  miningSpeedMultiplier?: number;
  attackDamage?: number;
  foodValue?: number;
  tier?: 'wood' | 'stone' | 'iron' | 'diamond';
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  width: number;
  height: number;
  grid: (string | null)[];
  output: {
    itemId: string;
    count: number;
  };
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  hunger: number;
  maxHunger: number;
  air: number;
  maxAir: number;
  isDead: boolean;
  score: number;
  gameMode: 'survival' | 'creative';
}

export interface GameSettings {
  fov: number;
  mouseSensitivity: number;
  soundEnabled: boolean;
  soundVolume: number;
  renderDistance: number; // in chunks
  showCoordinates: boolean;
  dayCycleSpeed: number; // 1 = standard ~10 min, 0 = freeze
}

export interface MobEntity {
  id: string;
  type: 'piglet' | 'sheep' | 'shadow_crawler' | 'golem' | 'dino' | 'spider' | 'zombie' | 'pet';
  name: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  yaw: number;
  health: number;
  maxHealth: number;
  isHostile: boolean;
  attackCooldown: number;
  walkCycle: number;
  targetPlayer: boolean;
  isPetSitting?: boolean;
  isPet?: boolean;
}

export interface DroppedItem {
  id: string;
  itemId: string;
  count: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotationY: number;
  lifetime: number;
}
