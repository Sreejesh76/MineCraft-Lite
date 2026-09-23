import * as THREE from 'three';
import { BlockType } from '../types/game';

// Helper to create a 16x16 canvas texture
function createPixelTexture(
  paintFn: (ctx: CanvasRenderingContext2D, size: number) => void,
  size: number = 16
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  paintFn(ctx, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Pseudo random for deterministic noise in textures
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Draw noise dots
function fillNoise(
  ctx: CanvasRenderingContext2D,
  size: number,
  baseColor: string,
  varianceColors: string[],
  seedOffset: number = 0
) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const r = seededRandom(x * 17 + y * 31 + seedOffset);
      if (r > 0.45) {
        const colorIdx = Math.floor(seededRandom(x * 43 + y * 7 + seedOffset) * varianceColors.length);
        ctx.fillStyle = varianceColors[colorIdx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
}

export interface BlockMaterials {
  top: THREE.Material;
  bottom: THREE.Material;
  side: THREE.Material;
}

export class TextureManager {
  private materials: Map<BlockType, BlockMaterials> = new Map();
  public defaultMaterial!: THREE.Material;
  public waterMaterial!: THREE.Material;
  public glassMaterial!: THREE.Material;

  constructor() {
    this.initTextures();
  }

  private initTextures() {
    // Dirt Texture
    const dirtTex = createPixelTexture((ctx, size) => {
      fillNoise(ctx, size, '#614126', ['#533720', '#6e492b', '#482f1b', '#7b5433'], 10);
    });

    // Grass Top Texture
    const grassTopTex = createPixelTexture((ctx, size) => {
      fillNoise(ctx, size, '#5b9e31', ['#4f8c28', '#68b139', '#447a22', '#72be3f'], 20);
    });

    // Grass Side Texture (dirt with green top fringe)
    const grassSideTex = createPixelTexture((ctx, size) => {
      fillNoise(ctx, size, '#614126', ['#533720', '#6e492b', '#482f1b'], 10);
      // Top 3-4 pixels wavy grass
      for (let x = 0; x < size; x++) {
        const grassH = 3 + Math.floor(seededRandom(x * 19) * 2.5);
        for (let y = 0; y < grassH; y++) {
          const r = seededRandom(x * 37 + y * 23);
          ctx.fillStyle = r > 0.5 ? '#5b9e31' : '#4f8c28';
          ctx.fillRect(x, y, 1, 1);
        }
      }
    });

    // Stone Texture
    const stoneTex = createPixelTexture((ctx, size) => {
      fillNoise(ctx, size, '#7d8084', ['#6c6f73', '#8b8e93', '#606266', '#95989e'], 30);
    });

    // Cobblestone Texture
    const cobblestoneTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#4f5255';
      ctx.fillRect(0, 0, size, size);
      // Irregular stone stones
      for (let x = 0; x < size; x += 4) {
        for (let y = 0; y < size; y += 4) {
          const ox = (y % 8 === 0) ? 0 : 2;
          const px = (x + ox) % size;
          ctx.fillStyle = seededRandom(px * 13 + y * 7) > 0.5 ? '#797c80' : '#888b90';
          ctx.fillRect(px, y, 3, 3);
          ctx.fillStyle = '#65686b';
          ctx.fillRect(px + 1, y + 1, 2, 2);
        }
      }
    });

    // Sand Texture
    const sandTex = createPixelTexture((ctx, size) => {
      fillNoise(ctx, size, '#dfd193', ['#d5c584', '#e8dba3', '#c9b875', '#eedfae'], 40);
    });

    // Wood Log Side Texture (Bark)
    const woodSideTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#573d23';
      ctx.fillRect(0, 0, size, size);
      for (let x = 0; x < size; x++) {
        const isDarkStreak = x % 4 === 1 || x % 7 === 2;
        ctx.fillStyle = isDarkStreak ? '#452f19' : '#694a2b';
        ctx.fillRect(x, 0, 1, size);
        for (let y = 0; y < size; y++) {
          if (seededRandom(x * 11 + y * 53) > 0.6) {
            ctx.fillStyle = '#3c2916';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // Wood Log Top/Bottom Texture (Rings)
    const woodTopTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#9b764b';
      ctx.fillRect(0, 0, size, size);
      // Outer bark ring
      ctx.strokeStyle = '#4e351d';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, size, size);
      // Inner growth rings
      ctx.strokeStyle = '#85633c';
      ctx.strokeRect(3, 3, 10, 10);
      ctx.strokeRect(6, 6, 4, 4);
      ctx.fillStyle = '#6e502e';
      ctx.fillRect(7, 7, 2, 2);
    });

    // Wood Planks Texture
    const planksTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#9b7444';
      ctx.fillRect(0, 0, size, size);
      // 4 horizontal boards
      for (let i = 0; i < 4; i++) {
        const y = i * 4;
        ctx.fillStyle = '#5c4120';
        ctx.fillRect(0, y, size, 1);
        ctx.fillStyle = '#a8814f';
        ctx.fillRect(0, y + 1, size, 1);
      }
      // Nail specks
      ctx.fillStyle = '#3a2710';
      ctx.fillRect(2, 2, 1, 1);
      ctx.fillRect(13, 6, 1, 1);
      ctx.fillRect(3, 10, 1, 1);
      ctx.fillRect(12, 14, 1, 1);
    });

    // Leaves Texture (Semi-translucent foliage)
    const leavesTex = createPixelTexture((ctx, size) => {
      ctx.clearRect(0, 0, size, size);
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const r = seededRandom(x * 29 + y * 41);
          if (r > 0.25) {
            ctx.fillStyle = r > 0.7 ? '#2a6a21' : r > 0.45 ? '#36852a' : '#1f5217';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });

    // Water Texture
    const waterTex = createPixelTexture((ctx, size) => {
      fillNoise(ctx, size, '#2c7fd4', ['#236bb8', '#388fe3', '#489ef0'], 50);
    });

    // Glass Texture
    const glassTex = createPixelTexture((ctx, size) => {
      ctx.clearRect(0, 0, size, size);
      // Border
      ctx.fillStyle = 'rgba(215, 240, 255, 0.7)';
      ctx.fillRect(0, 0, size, 1);
      ctx.fillRect(0, size - 1, size, 1);
      ctx.fillRect(0, 0, 1, size);
      ctx.fillRect(size - 1, 0, 1, size);
      // Center reflection diagonal streak
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillRect(5, 5, 2, 2);
      ctx.fillRect(11, 11, 2, 2);
      ctx.fillStyle = 'rgba(180, 220, 245, 0.25)';
      ctx.fillRect(1, 1, size - 2, size - 2);
    });

    // Clay Bricks Texture
    const bricksTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#b7b4a7'; // mortar
      ctx.fillRect(0, 0, size, size);
      // 4 rows of offset bricks
      for (let r = 0; r < 4; r++) {
        const y = r * 4 + 1;
        const offset = r % 2 === 0 ? 0 : 4;
        for (let b = -4; b < size + 4; b += 8) {
          ctx.fillStyle = seededRandom(r * 17 + b * 5) > 0.5 ? '#9e4635' : '#8c3b2c';
          ctx.fillRect(b + offset, y, 7, 3);
          ctx.fillStyle = '#b35341';
          ctx.fillRect(b + offset, y, 7, 1);
        }
      }
    });

    // Stone Bricks
    const stoneBricksTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#4e5052';
      ctx.fillRect(0, 0, size, size);
      for (let r = 0; r < 2; r++) {
        const y = r * 8 + 1;
        const offset = r % 2 === 0 ? 0 : 8;
        for (let b = -8; b < size + 8; b += 16) {
          ctx.fillStyle = '#7a7d82';
          ctx.fillRect(b + offset, y, 15, 7);
          ctx.fillStyle = '#8f9297';
          ctx.fillRect(b + offset, y, 15, 1);
          ctx.fillRect(b + offset, y, 1, 7);
        }
      }
    });

    // Crafting Bench Textures
    const benchTopTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#946a3b';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#573a1b';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 14, 14);
      // 3x3 small grid in center
      for (let i = 1; i <= 2; i++) {
        ctx.fillStyle = '#493014';
        ctx.fillRect(3 + i * 3, 3, 1, 10);
        ctx.fillRect(3, 3 + i * 3, 10, 1);
      }
      // Mini hammer icon in corner
      ctx.fillStyle = '#888888';
      ctx.fillRect(11, 4, 3, 2);
      ctx.fillStyle = '#4a2f16';
      ctx.fillRect(12, 6, 1, 3);
    });

    const benchSideTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#845e34';
      ctx.fillRect(0, 0, size, size);
      ctx.strokeStyle = '#4e3317';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, 14, 14);
      // Draw saw & tool pocket silhouette
      ctx.fillStyle = '#654420';
      ctx.fillRect(3, 6, 10, 7);
      ctx.fillStyle = '#9e9fa3';
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(7, 3, 2, 3);
    });

    // Ore Generator
    const createOreTexture = (fleckColor: string, fleckHighlight: string, seed: number) => {
      return createPixelTexture((ctx, size) => {
        fillNoise(ctx, size, '#7d8084', ['#6c6f73', '#8b8e93', '#606266'], seed);
        // Ore fleck clusters
        for (let i = 0; i < 6; i++) {
          const ox = 2 + Math.floor(seededRandom(seed * 7 + i * 19) * 11);
          const oy = 2 + Math.floor(seededRandom(seed * 13 + i * 31) * 11);
          ctx.fillStyle = fleckColor;
          ctx.fillRect(ox, oy, 2, 2);
          ctx.fillStyle = fleckHighlight;
          ctx.fillRect(ox, oy, 1, 1);
        }
      });
    };

    const coalOreTex = createOreTexture('#222222', '#3d3d3d', 101);
    const ironOreTex = createOreTexture('#c2a27f', '#e6cbac', 202);
    const goldOreTex = createOreTexture('#e0b326', '#fff176', 303);
    const diamondOreTex = createOreTexture('#1adcd0', '#9efaf6', 404);

    // Torch Texture
    const torchTex = createPixelTexture((ctx, size) => {
      ctx.fillStyle = '#1c1c1c';
      ctx.fillRect(0, 0, size, size);
      // Center torch post
      ctx.fillStyle = '#7a5127';
      ctx.fillRect(6, 4, 4, 12);
      // Flame
      ctx.fillStyle = '#ff5100';
      ctx.fillRect(5, 1, 6, 4);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(6, 2, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, 3, 2, 1);
    });

    // Common Material Factory
    const makeMat = (tex: THREE.Texture, transparent: boolean = false, opacity: number = 1.0) => {
      return new THREE.MeshLambertMaterial({
        map: tex,
        transparent,
        opacity,
        alphaTest: transparent && opacity === 1.0 ? 0.3 : 0,
      });
    };

    const dirtMat = makeMat(dirtTex);
    const grassTopMat = makeMat(grassTopTex);
    const grassSideMat = makeMat(grassSideTex);
    const stoneMat = makeMat(stoneTex);
    const cobbleMat = makeMat(cobblestoneTex);
    const sandMat = makeMat(sandTex);
    const woodSideMat = makeMat(woodSideTex);
    const woodTopMat = makeMat(woodTopTex);
    const planksMat = makeMat(planksTex);
    const leavesMat = makeMat(leavesTex, true, 0.95);
    const bricksMat = makeMat(bricksTex);
    const stoneBricksMat = makeMat(stoneBricksTex);
    const benchTopMat = makeMat(benchTopTex);
    const benchSideMat = makeMat(benchSideTex);
    const coalMat = makeMat(coalOreTex);
    const ironMat = makeMat(ironOreTex);
    const goldMat = makeMat(goldOreTex);
    const diamondMat = makeMat(diamondOreTex);
    const torchMat = makeMat(torchTex);

    this.waterMaterial = new THREE.MeshLambertMaterial({
      map: waterTex,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
    });

    this.glassMaterial = new THREE.MeshLambertMaterial({
      map: glassTex,
      transparent: true,
      opacity: 0.5,
    });

    this.defaultMaterial = stoneMat;

    // Register into map
    this.materials.set(BlockType.DIRT, { top: dirtMat, bottom: dirtMat, side: dirtMat });
    this.materials.set(BlockType.GRASS, { top: grassTopMat, bottom: dirtMat, side: grassSideMat });
    this.materials.set(BlockType.STONE, { top: stoneMat, bottom: stoneMat, side: stoneMat });
    this.materials.set(BlockType.COBBLESTONE, { top: cobbleMat, bottom: cobbleMat, side: cobbleMat });
    this.materials.set(BlockType.SAND, { top: sandMat, bottom: sandMat, side: sandMat });
    this.materials.set(BlockType.WOOD, { top: woodTopMat, bottom: woodTopMat, side: woodSideMat });
    this.materials.set(BlockType.PLANKS, { top: planksMat, bottom: planksMat, side: planksMat });
    this.materials.set(BlockType.LEAVES, { top: leavesMat, bottom: leavesMat, side: leavesMat });
    this.materials.set(BlockType.WATER, { top: this.waterMaterial, bottom: this.waterMaterial, side: this.waterMaterial });
    this.materials.set(BlockType.GLASS, { top: this.glassMaterial, bottom: this.glassMaterial, side: this.glassMaterial });
    this.materials.set(BlockType.BRICKS, { top: bricksMat, bottom: bricksMat, side: bricksMat });
    this.materials.set(BlockType.STONE_BRICKS, { top: stoneBricksMat, bottom: stoneBricksMat, side: stoneBricksMat });
    this.materials.set(BlockType.CRAFTING_BENCH, { top: makeMat(benchTopTex), bottom: planksMat, side: benchSideMat });
    this.materials.set(BlockType.COAL_ORE, { top: coalMat, bottom: coalMat, side: coalMat });
    this.materials.set(BlockType.IRON_ORE, { top: ironMat, bottom: ironMat, side: ironMat });
    this.materials.set(BlockType.GOLD_ORE, { top: goldMat, bottom: goldMat, side: goldMat });
    this.materials.set(BlockType.DIAMOND_ORE, { top: diamondMat, bottom: diamondMat, side: diamondMat });
    this.materials.set(BlockType.TORCH, { top: torchMat, bottom: torchMat, side: torchMat });
  }

  public getMaterial(block: BlockType, face: 'top' | 'bottom' | 'side'): THREE.Material {
    const entry = this.materials.get(block);
    if (!entry) return this.defaultMaterial;
    return entry[face];
  }
}

export const textureManager = new TextureManager();
