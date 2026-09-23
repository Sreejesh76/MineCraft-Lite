import * as THREE from 'three';
import { BlockType } from '../types/game';

// Face atlas coordinate indexes (x, y) on 16x16 grid (each cell is 16x16 pixels)
export const ATLAS_GRID_SIZE = 16;
export const ATLAS_TEX_SIZE = 256;

export enum AtlasFace {
  GRASS_TOP = 0,
  GRASS_SIDE = 1,
  DIRT = 2,
  STONE = 3,
  COBBLESTONE = 4,
  SAND = 5,
  WOOD_SIDE = 6,
  WOOD_TOP = 7,
  PLANKS = 8,
  LEAVES = 9,
  WATER = 10,
  GLASS = 11,
  BRICKS = 12,
  STONE_BRICKS = 13,
  BENCH_TOP = 14,
  BENCH_SIDE = 15,
  COAL_ORE = 16,
  IRON_ORE = 17,
  GOLD_ORE = 18,
  DIAMOND_ORE = 19,
  TORCH = 20,
}

// Pseudo random for deterministic noise in textures
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

function fillNoise(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  baseColor: string,
  varianceColors: string[],
  seedOffset: number = 0
) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(px, py, 16, 16);

  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const r = seededRandom(x * 17 + y * 31 + seedOffset);
      if (r > 0.45) {
        const colorIdx = Math.floor(seededRandom(x * 43 + y * 7 + seedOffset) * varianceColors.length);
        ctx.fillStyle = varianceColors[colorIdx];
        ctx.fillRect(px + x, py + y, 1, 1);
      }
    }
  }
}

export class AtlasManager {
  public atlasTexture!: THREE.CanvasTexture;
  public opaqueMaterial!: THREE.MeshLambertMaterial;
  public transparentMaterial!: THREE.MeshLambertMaterial;
  public waterMaterial!: THREE.MeshLambertMaterial;

  constructor() {
    this.createAtlas();
  }

  private getCellPos(faceIndex: AtlasFace): { x: number; y: number } {
    const col = faceIndex % ATLAS_GRID_SIZE;
    const row = Math.floor(faceIndex / ATLAS_GRID_SIZE);
    return { x: col * 16, y: row * 16 };
  }

  private createAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = ATLAS_TEX_SIZE;
    canvas.height = ATLAS_TEX_SIZE;
    const ctx = canvas.getContext('2d')!;

    // Clear background
    ctx.clearRect(0, 0, ATLAS_TEX_SIZE, ATLAS_TEX_SIZE);

    // 1. DIRT
    let pos = this.getCellPos(AtlasFace.DIRT);
    fillNoise(ctx, pos.x, pos.y, '#614126', ['#533720', '#6e492b', '#482f1b', '#7b5433'], 10);

    // 2. GRASS TOP
    pos = this.getCellPos(AtlasFace.GRASS_TOP);
    fillNoise(ctx, pos.x, pos.y, '#5c9e31', ['#518f29', '#69b33a', '#477e23', '#73c040'], 20);

    // 3. GRASS SIDE
    pos = this.getCellPos(AtlasFace.GRASS_SIDE);
    fillNoise(ctx, pos.x, pos.y, '#614126', ['#533720', '#6e492b', '#482f1b'], 10);
    for (let x = 0; x < 16; x++) {
      const grassH = 3 + Math.floor(seededRandom(x * 19) * 2.5);
      for (let y = 0; y < grassH; y++) {
        const r = seededRandom(x * 37 + y * 23);
        ctx.fillStyle = r > 0.5 ? '#5c9e31' : '#518f29';
        ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
      }
    }

    // 4. STONE
    pos = this.getCellPos(AtlasFace.STONE);
    fillNoise(ctx, pos.x, pos.y, '#7d8084', ['#6c6f73', '#8b8e93', '#606266', '#95989e'], 30);

    // 5. COBBLESTONE
    pos = this.getCellPos(AtlasFace.COBBLESTONE);
    ctx.fillStyle = '#4f5255';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    for (let x = 0; x < 16; x += 4) {
      for (let y = 0; y < 16; y += 4) {
        const ox = (y % 8 === 0) ? 0 : 2;
        const px = (x + ox) % 16;
        ctx.fillStyle = seededRandom(px * 13 + y * 7) > 0.5 ? '#797c80' : '#888b90';
        ctx.fillRect(pos.x + px, pos.y + y, 3, 3);
        ctx.fillStyle = '#65686b';
        ctx.fillRect(pos.x + px + 1, pos.y + y + 1, 2, 2);
      }
    }

    // 6. SAND
    pos = this.getCellPos(AtlasFace.SAND);
    fillNoise(ctx, pos.x, pos.y, '#dfd193', ['#d5c584', '#e8dba3', '#c9b875', '#eedfae'], 40);

    // 7. WOOD SIDE
    pos = this.getCellPos(AtlasFace.WOOD_SIDE);
    ctx.fillStyle = '#573d23';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    for (let x = 0; x < 16; x++) {
      const isDarkStreak = x % 4 === 1 || x % 7 === 2;
      ctx.fillStyle = isDarkStreak ? '#452f19' : '#694a2b';
      ctx.fillRect(pos.x + x, pos.y, 1, 16);
      for (let y = 0; y < 16; y++) {
        if (seededRandom(x * 11 + y * 53) > 0.6) {
          ctx.fillStyle = '#3c2916';
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
    }

    // 8. WOOD TOP
    pos = this.getCellPos(AtlasFace.WOOD_TOP);
    ctx.fillStyle = '#9b764b';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    ctx.strokeStyle = '#4e351d';
    ctx.strokeRect(pos.x + 0.5, pos.y + 0.5, 15, 15);
    ctx.strokeStyle = '#85633c';
    ctx.strokeRect(pos.x + 3.5, pos.y + 3.5, 9, 9);
    ctx.strokeRect(pos.x + 6.5, pos.y + 6.5, 3, 3);
    ctx.fillStyle = '#6e502e';
    ctx.fillRect(pos.x + 7, pos.y + 7, 2, 2);

    // 9. PLANKS
    pos = this.getCellPos(AtlasFace.PLANKS);
    ctx.fillStyle = '#9b7444';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    for (let i = 0; i < 4; i++) {
      const y = i * 4;
      ctx.fillStyle = '#5c4120';
      ctx.fillRect(pos.x, pos.y + y, 16, 1);
      ctx.fillStyle = '#a8814f';
      ctx.fillRect(pos.x, pos.y + y + 1, 16, 1);
    }
    ctx.fillStyle = '#3a2710';
    ctx.fillRect(pos.x + 2, pos.y + 2, 1, 1);
    ctx.fillRect(pos.x + 13, pos.y + 6, 1, 1);
    ctx.fillRect(pos.x + 3, pos.y + 10, 1, 1);
    ctx.fillRect(pos.x + 12, pos.y + 14, 1, 1);

    // 10. LEAVES
    pos = this.getCellPos(AtlasFace.LEAVES);
    for (let x = 0; x < 16; x++) {
      for (let y = 0; y < 16; y++) {
        const r = seededRandom(x * 29 + y * 41);
        if (r > 0.25) {
          ctx.fillStyle = r > 0.7 ? '#2a6a21' : r > 0.45 ? '#36852a' : '#1f5217';
          ctx.fillRect(pos.x + x, pos.y + y, 1, 1);
        }
      }
    }

    // 11. WATER
    pos = this.getCellPos(AtlasFace.WATER);
    fillNoise(ctx, pos.x, pos.y, '#2c7fd4', ['#236bb8', '#388fe3', '#489ef0', '#1f60a6'], 50);

    // 12. GLASS
    pos = this.getCellPos(AtlasFace.GLASS);
    ctx.fillStyle = 'rgba(215, 240, 255, 0.7)';
    ctx.fillRect(pos.x, pos.y, 16, 1);
    ctx.fillRect(pos.x, pos.y + 15, 16, 1);
    ctx.fillRect(pos.x, pos.y, 1, 16);
    ctx.fillRect(pos.x + 15, pos.y, 1, 16);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(pos.x + 3, pos.y + 3, 2, 2);
    ctx.fillRect(pos.x + 5, pos.y + 5, 2, 2);
    ctx.fillRect(pos.x + 11, pos.y + 11, 2, 2);
    ctx.fillStyle = 'rgba(180, 220, 245, 0.25)';
    ctx.fillRect(pos.x + 1, pos.y + 1, 14, 14);

    // 13. BRICKS
    pos = this.getCellPos(AtlasFace.BRICKS);
    ctx.fillStyle = '#b7b4a7';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    for (let r = 0; r < 4; r++) {
      const y = r * 4 + 1;
      const offset = r % 2 === 0 ? 0 : 4;
      for (let b = -4; b < 16 + 4; b += 8) {
        ctx.fillStyle = seededRandom(r * 17 + b * 5) > 0.5 ? '#9e4635' : '#8c3b2c';
        ctx.fillRect(pos.x + Math.max(0, b + offset), pos.y + y, 7, 3);
        ctx.fillStyle = '#b35341';
        ctx.fillRect(pos.x + Math.max(0, b + offset), pos.y + y, 7, 1);
      }
    }

    // 14. STONE BRICKS
    pos = this.getCellPos(AtlasFace.STONE_BRICKS);
    ctx.fillStyle = '#4e5052';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    for (let r = 0; r < 2; r++) {
      const y = r * 8 + 1;
      const offset = r % 2 === 0 ? 0 : 8;
      for (let b = -8; b < 16 + 8; b += 16) {
        ctx.fillStyle = '#7a7d82';
        ctx.fillRect(pos.x + Math.max(0, b + offset), pos.y + y, 15, 7);
        ctx.fillStyle = '#8f9297';
        ctx.fillRect(pos.x + Math.max(0, b + offset), pos.y + y, 15, 1);
        ctx.fillRect(pos.x + Math.max(0, b + offset), pos.y + y, 1, 7);
      }
    }

    // 15. BENCH TOP
    pos = this.getCellPos(AtlasFace.BENCH_TOP);
    ctx.fillStyle = '#946a3b';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    ctx.strokeStyle = '#573a1b';
    ctx.strokeRect(pos.x + 1.5, pos.y + 1.5, 13, 13);
    for (let i = 1; i <= 2; i++) {
      ctx.fillStyle = '#493014';
      ctx.fillRect(pos.x + 3 + i * 3, pos.y + 3, 1, 10);
      ctx.fillRect(pos.x + 3, pos.y + 3 + i * 3, 10, 1);
    }
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(pos.x + 11, pos.y + 4, 3, 2);
    ctx.fillStyle = '#4a2f16';
    ctx.fillRect(pos.x + 12, pos.y + 6, 1, 3);

    // 16. BENCH SIDE
    pos = this.getCellPos(AtlasFace.BENCH_SIDE);
    ctx.fillStyle = '#845e34';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    ctx.strokeStyle = '#4e3317';
    ctx.strokeRect(pos.x + 1.5, pos.y + 1.5, 13, 13);
    ctx.fillStyle = '#654420';
    ctx.fillRect(pos.x + 3, pos.y + 6, 10, 7);
    ctx.fillStyle = '#9e9fa3';
    ctx.fillRect(pos.x + 4, pos.y + 4, 2, 2);
    ctx.fillRect(pos.x + 7, pos.y + 3, 2, 3);

    // 17-20: ORES (Coal, Iron, Gold, Diamond)
    const drawOreAtlas = (face: AtlasFace, fleckColor: string, fleckHighlight: string, seed: number) => {
      const p = this.getCellPos(face);
      fillNoise(ctx, p.x, p.y, '#7d8084', ['#6c6f73', '#8b8e93', '#606266'], seed);
      for (let i = 0; i < 6; i++) {
        const ox = 2 + Math.floor(seededRandom(seed * 7 + i * 19) * 11);
        const oy = 2 + Math.floor(seededRandom(seed * 13 + i * 31) * 11);
        ctx.fillStyle = fleckColor;
        ctx.fillRect(p.x + ox, p.y + oy, 2, 2);
        ctx.fillStyle = fleckHighlight;
        ctx.fillRect(p.x + ox, p.y + oy, 1, 1);
      }
    };

    drawOreAtlas(AtlasFace.COAL_ORE, '#222222', '#3d3d3d', 101);
    drawOreAtlas(AtlasFace.IRON_ORE, '#c2a27f', '#e6cbac', 202);
    drawOreAtlas(AtlasFace.GOLD_ORE, '#e0b326', '#fff176', 303);
    drawOreAtlas(AtlasFace.DIAMOND_ORE, '#1adcd0', '#9efaf6', 404);

    // 21. TORCH
    pos = this.getCellPos(AtlasFace.TORCH);
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(pos.x, pos.y, 16, 16);
    ctx.fillStyle = '#7a5127';
    ctx.fillRect(pos.x + 6, pos.y + 4, 4, 12);
    ctx.fillStyle = '#ff5100';
    ctx.fillRect(pos.x + 5, pos.y + 1, 6, 4);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(pos.x + 6, pos.y + 2, 4, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(pos.x + 7, pos.y + 3, 2, 1);

    // Create three.js Texture
    this.atlasTexture = new THREE.CanvasTexture(canvas);
    this.atlasTexture.magFilter = THREE.NearestFilter;
    this.atlasTexture.minFilter = THREE.NearestFilter;
    this.atlasTexture.colorSpace = THREE.SRGBColorSpace;

    // Materials
    this.opaqueMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: false,
      side: THREE.DoubleSide,
    });

    this.transparentMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide,
    });

    this.waterMaterial = new THREE.MeshLambertMaterial({
      map: this.atlasTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  public getFaceUV(face: AtlasFace): { uMin: number; uMax: number; vMin: number; vMax: number } {
    const col = face % ATLAS_GRID_SIZE;
    const row = Math.floor(face / ATLAS_GRID_SIZE);

    const step = 1.0 / ATLAS_GRID_SIZE;
    const uMin = col * step;
    const uMax = (col + 1) * step;

    // Canvas Y=0 is top, WebGL V=0 is bottom
    const vMax = 1.0 - row * step;
    const vMin = 1.0 - (row + 1) * step;

    return { uMin, uMax, vMin, vMax };
  }

  public getBlockFaces(block: BlockType): { top: AtlasFace; bottom: AtlasFace; side: AtlasFace } {
    switch (block) {
      case BlockType.GRASS:
        return { top: AtlasFace.GRASS_TOP, bottom: AtlasFace.DIRT, side: AtlasFace.GRASS_SIDE };
      case BlockType.DIRT:
        return { top: AtlasFace.DIRT, bottom: AtlasFace.DIRT, side: AtlasFace.DIRT };
      case BlockType.STONE:
        return { top: AtlasFace.STONE, bottom: AtlasFace.STONE, side: AtlasFace.STONE };
      case BlockType.COBBLESTONE:
        return { top: AtlasFace.COBBLESTONE, bottom: AtlasFace.COBBLESTONE, side: AtlasFace.COBBLESTONE };
      case BlockType.SAND:
        return { top: AtlasFace.SAND, bottom: AtlasFace.SAND, side: AtlasFace.SAND };
      case BlockType.WOOD:
        return { top: AtlasFace.WOOD_TOP, bottom: AtlasFace.WOOD_TOP, side: AtlasFace.WOOD_SIDE };
      case BlockType.PLANKS:
        return { top: AtlasFace.PLANKS, bottom: AtlasFace.PLANKS, side: AtlasFace.PLANKS };
      case BlockType.LEAVES:
        return { top: AtlasFace.LEAVES, bottom: AtlasFace.LEAVES, side: AtlasFace.LEAVES };
      case BlockType.WATER:
        return { top: AtlasFace.WATER, bottom: AtlasFace.WATER, side: AtlasFace.WATER };
      case BlockType.GLASS:
        return { top: AtlasFace.GLASS, bottom: AtlasFace.GLASS, side: AtlasFace.GLASS };
      case BlockType.BRICKS:
        return { top: AtlasFace.BRICKS, bottom: AtlasFace.BRICKS, side: AtlasFace.BRICKS };
      case BlockType.STONE_BRICKS:
        return { top: AtlasFace.STONE_BRICKS, bottom: AtlasFace.STONE_BRICKS, side: AtlasFace.STONE_BRICKS };
      case BlockType.CRAFTING_BENCH:
        return { top: AtlasFace.BENCH_TOP, bottom: AtlasFace.PLANKS, side: AtlasFace.BENCH_SIDE };
      case BlockType.COAL_ORE:
        return { top: AtlasFace.COAL_ORE, bottom: AtlasFace.COAL_ORE, side: AtlasFace.COAL_ORE };
      case BlockType.IRON_ORE:
        return { top: AtlasFace.IRON_ORE, bottom: AtlasFace.IRON_ORE, side: AtlasFace.IRON_ORE };
      case BlockType.GOLD_ORE:
        return { top: AtlasFace.GOLD_ORE, bottom: AtlasFace.GOLD_ORE, side: AtlasFace.GOLD_ORE };
      case BlockType.DIAMOND_ORE:
        return { top: AtlasFace.DIAMOND_ORE, bottom: AtlasFace.DIAMOND_ORE, side: AtlasFace.DIAMOND_ORE };
      case BlockType.TORCH:
        return { top: AtlasFace.TORCH, bottom: AtlasFace.TORCH, side: AtlasFace.TORCH };
      default:
        return { top: AtlasFace.STONE, bottom: AtlasFace.STONE, side: AtlasFace.STONE };
    }
  }
}

export const atlasManager = new AtlasManager();
