import * as THREE from 'three';
import { BlockType } from '../types/game';
import { atlasManager, AtlasFace } from './atlas';
import { SimplexNoise } from '../utils/noise';

export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_HEIGHT = 48;
export const SEA_LEVEL = 23;

export function isBlockTransparent(block: BlockType): boolean {
  return (
    block === BlockType.AIR ||
    block === BlockType.WATER ||
    block === BlockType.GLASS ||
    block === BlockType.LEAVES ||
    block === BlockType.TORCH
  );
}

export function isBlockSolid(block: BlockType): boolean {
  return block !== BlockType.AIR && block !== BlockType.WATER && block !== BlockType.TORCH;
}

export class Chunk {
  public cx: number;
  public cz: number;
  public voxels: Uint8Array;
  public opaqueMesh: THREE.Mesh | null = null;
  public transparentMesh: THREE.Mesh | null = null;
  public waterMesh: THREE.Mesh | null = null;
  public group: THREE.Group;
  public dirty: boolean = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    this.voxels = new Uint8Array(CHUNK_SIZE_X * CHUNK_HEIGHT * CHUNK_SIZE_Z);
    this.group = new THREE.Group();
    this.group.position.set(cx * CHUNK_SIZE_X, 0, cz * CHUNK_SIZE_Z);
  }

  public getIndex(x: number, y: number, z: number): number {
    return y * (CHUNK_SIZE_X * CHUNK_SIZE_Z) + z * CHUNK_SIZE_X + x;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE_Z) {
      return BlockType.AIR;
    }
    return this.voxels[this.getIndex(x, y, z)];
  }

  public setBlock(x: number, y: number, z: number, block: BlockType) {
    if (x < 0 || x >= CHUNK_SIZE_X || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE_Z) {
      return;
    }
    this.voxels[this.getIndex(x, y, z)] = block;
    this.dirty = true;
  }

  public dispose() {
    if (this.opaqueMesh) {
      this.opaqueMesh.geometry.dispose();
      this.group.remove(this.opaqueMesh);
    }
    if (this.transparentMesh) {
      this.transparentMesh.geometry.dispose();
      this.group.remove(this.transparentMesh);
    }
    if (this.waterMesh) {
      this.waterMesh.geometry.dispose();
      this.group.remove(this.waterMesh);
    }
  }
}

export interface RaycastHit {
  blockX: number;
  blockY: number;
  blockZ: number;
  placeX: number;
  placeY: number;
  placeZ: number;
  blockType: BlockType;
  faceNormal: THREE.Vector3;
  distance: number;
}

export class WorldManager {
  public chunks: Map<string, Chunk> = new Map();
  public scene: THREE.Scene;
  public noise: SimplexNoise;
  public seed: number = 42819;
  public renderDistance: number = 4; // chunk radius (9x9 chunks)

  constructor(scene: THREE.Scene, seed: number = 42819) {
    this.scene = scene;
    this.seed = seed;
    this.noise = new SimplexNoise(seed);
  }

  public chunkKey(cx: number, cz: number): string {
    return `${cx},${cz}`;
  }

  public getChunk(cx: number, cz: number): Chunk | undefined {
    return this.chunks.get(this.chunkKey(cx, cz));
  }

  public getOrCreateChunk(cx: number, cz: number): Chunk {
    const key = this.chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cz);
      this.generateChunkTerrain(chunk);
      this.chunks.set(key, chunk);
      this.scene.add(chunk.group);
    }
    return chunk;
  }

  public getBlock(worldX: number, worldY: number, worldZ: number): BlockType {
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) return BlockType.AIR;

    const cx = Math.floor(worldX / CHUNK_SIZE_X);
    const cz = Math.floor(worldZ / CHUNK_SIZE_Z);
    const chunk = this.getChunk(cx, cz);
    if (!chunk) return BlockType.AIR;

    const lx = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;
    return chunk.getBlock(lx, worldY, lz);
  }

  public setBlock(worldX: number, worldY: number, worldZ: number, block: BlockType) {
    if (worldY < 0 || worldY >= CHUNK_HEIGHT) return;

    const cx = Math.floor(worldX / CHUNK_SIZE_X);
    const cz = Math.floor(worldZ / CHUNK_SIZE_Z);
    const chunk = this.getOrCreateChunk(cx, cz);

    const lx = ((worldX % CHUNK_SIZE_X) + CHUNK_SIZE_X) % CHUNK_SIZE_X;
    const lz = ((worldZ % CHUNK_SIZE_Z) + CHUNK_SIZE_Z) % CHUNK_SIZE_Z;

    chunk.setBlock(lx, worldY, lz, block);

    // If on boundary, mark neighbor dirty
    if (lx === 0) this.markChunkDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE_X - 1) this.markChunkDirty(cx + 1, cz);
    if (lz === 0) this.markChunkDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.markChunkDirty(cx, cz + 1);
  }

  private markChunkDirty(cx: number, cz: number) {
    const chunk = this.getChunk(cx, cz);
    if (chunk) chunk.dirty = true;
  }

  // Procedural terrain generation for a chunk
  private generateChunkTerrain(chunk: Chunk) {
    const { cx, cz } = chunk;
    const startX = cx * CHUNK_SIZE_X;
    const startZ = cz * CHUNK_SIZE_Z;

    const treesToPlace: { lx: number; y: number; lz: number; height: number }[] = [];

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wx = startX + lx;
        const wz = startZ + lz;

        // Base 2D elevation heightmap
        const continental = this.noise.noise2D(wx * 0.008, wz * 0.008);
        const hills = this.noise.fbm2D(wx * 0.025, wz * 0.025, 3, 0.45);
        const mountains = Math.pow(Math.max(0, this.noise.noise2D(wx * 0.015 + 100, wz * 0.015 + 100)), 2) * 12;

        let surfaceHeight = Math.floor(24 + continental * 4 + hills * 8 + mountains);
        surfaceHeight = Math.max(16, Math.min(CHUNK_HEIGHT - 8, surfaceHeight));

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          if (y === 0) {
            // Bedrock
            chunk.setBlock(lx, y, lz, BlockType.STONE);
            continue;
          }

          if (y <= surfaceHeight) {
            // Check for 3D cave tunnels
            const caveNoise = this.noise.noise3D(wx * 0.05, y * 0.08, wz * 0.05);
            const isCave = y < surfaceHeight - 2 && caveNoise > 0.42;

            if (isCave) {
              chunk.setBlock(lx, y, lz, BlockType.AIR);
              continue;
            }

            // Ore Veins
            if (y < 12) {
              const diamondCheck = this.noise.noise3D(wx * 0.15 + 50, y * 0.2, wz * 0.15 + 50);
              if (diamondCheck > 0.72) {
                chunk.setBlock(lx, y, lz, BlockType.DIAMOND_ORE);
                continue;
              }
            }

            if (y < 18) {
              const goldCheck = this.noise.noise3D(wx * 0.12 + 20, y * 0.15, wz * 0.12 + 20);
              if (goldCheck > 0.65) {
                chunk.setBlock(lx, y, lz, BlockType.GOLD_ORE);
                continue;
              }
            }

            if (y < 26) {
              const ironCheck = this.noise.noise3D(wx * 0.1 + 80, y * 0.12, wz * 0.1 + 80);
              if (ironCheck > 0.58) {
                chunk.setBlock(lx, y, lz, BlockType.IRON_ORE);
                continue;
              }
            }

            const coalCheck = this.noise.noise3D(wx * 0.08 + 10, y * 0.1, wz * 0.08 + 10);
            if (coalCheck > 0.55 && y < 34) {
              chunk.setBlock(lx, y, lz, BlockType.COAL_ORE);
              continue;
            }

            // Surface layers
            if (y === surfaceHeight) {
              if (surfaceHeight <= SEA_LEVEL + 1) {
                // Sand beach near water
                chunk.setBlock(lx, y, lz, BlockType.SAND);
              } else {
                chunk.setBlock(lx, y, lz, BlockType.GRASS);
                // Tree spawn probability
                const treeRand = Math.abs(this.noise.noise2D(wx * 0.8, wz * 0.8));
                if (
                  treeRand > 0.82 &&
                  lx > 2 &&
                  lx < CHUNK_SIZE_X - 3 &&
                  lz > 2 &&
                  lz < CHUNK_SIZE_Z - 3 &&
                  surfaceHeight < CHUNK_HEIGHT - 9
                ) {
                  treesToPlace.push({
                    lx,
                    y: surfaceHeight + 1,
                    lz,
                    height: 4 + Math.floor(treeRand * 10) % 3,
                  });
                }
              }
            } else if (y >= surfaceHeight - 3) {
              // Subsurface dirt or sand
              if (surfaceHeight <= SEA_LEVEL + 1) {
                chunk.setBlock(lx, y, lz, BlockType.SAND);
              } else {
                chunk.setBlock(lx, y, lz, BlockType.DIRT);
              }
            } else {
              chunk.setBlock(lx, y, lz, BlockType.STONE);
            }
          } else if (y <= SEA_LEVEL) {
            // Fill water up to sea level
            chunk.setBlock(lx, y, lz, BlockType.WATER);
          } else {
            chunk.setBlock(lx, y, lz, BlockType.AIR);
          }
        }
      }
    }

    // Place trees in chunk
    for (const tree of treesToPlace) {
      // Trunk
      for (let th = 0; th < tree.height; th++) {
        chunk.setBlock(tree.lx, tree.y + th, tree.lz, BlockType.WOOD);
      }
      // Leaves canopy
      const leafBase = tree.y + tree.height - 2;
      for (let ly = leafBase; ly <= tree.y + tree.height + 1; ly++) {
        const radius = ly >= tree.y + tree.height ? 1 : 2;
        for (let ox = -radius; ox <= radius; ox++) {
          for (let oz = -radius; oz <= radius; oz++) {
            if (ox === 0 && oz === 0 && ly < tree.y + tree.height) continue;
            // Rounded corners
            if (Math.abs(ox) === radius && Math.abs(oz) === radius && ly === tree.y + tree.height + 1) continue;

            const tlx = tree.lx + ox;
            const tlz = tree.lz + oz;
            if (tlx >= 0 && tlx < CHUNK_SIZE_X && tlz >= 0 && tlz < CHUNK_SIZE_Z && ly < CHUNK_HEIGHT) {
              if (chunk.getBlock(tlx, ly, tlz) === BlockType.AIR) {
                chunk.setBlock(tlx, ly, tlz, BlockType.LEAVES);
              }
            }
          }
        }
      }
    }
  }

  // Update dynamic chunks around player position
  public updatePlayerChunks(playerX: number, playerZ: number) {
    const pcx = Math.floor(playerX / CHUNK_SIZE_X);
    const pcz = Math.floor(playerZ / CHUNK_SIZE_Z);
    const rad = this.renderDistance;

    // Load chunks around player
    for (let cx = pcx - rad; cx <= pcx + rad; cx++) {
      for (let cz = pcz - rad; cz <= pcz + rad; cz++) {
        const chunk = this.getOrCreateChunk(cx, cz);
        if (chunk.dirty) {
          this.buildChunkMesh(chunk);
          chunk.dirty = false;
        }
      }
    }

    // Unload chunks far away to maintain top performance
    const unloadDist = rad + 2;
    for (const [key, chunk] of this.chunks.entries()) {
      if (Math.abs(chunk.cx - pcx) > unloadDist || Math.abs(chunk.cz - pcz) > unloadDist) {
        chunk.dispose();
        this.scene.remove(chunk.group);
        this.chunks.delete(key);
      }
    }
  }

  // Face Ambient Occlusion helper
  private computeVertexAO(side1: boolean, side2: boolean, corner: boolean): number {
    if (side1 && side2) return 0.52;
    const count = (side1 ? 1 : 0) + (side2 ? 1 : 0) + (corner ? 1 : 0);
    if (count === 3) return 0.58;
    if (count === 2) return 0.72;
    if (count === 1) return 0.86;
    return 1.0;
  }

  // Build optimized chunk mesh with face culling & directional AO
  public buildChunkMesh(chunk: Chunk) {
    const { cx, cz } = chunk;
    const wxBase = cx * CHUNK_SIZE_X;
    const wzBase = cz * CHUNK_SIZE_Z;

    // Opaque Geometry buffers
    const opPositions: number[] = [];
    const opNormals: number[] = [];
    const opUvs: number[] = [];
    const opColors: number[] = [];

    // Transparent Geometry buffers (Leaves, Glass)
    const trPositions: number[] = [];
    const trNormals: number[] = [];
    const trUvs: number[] = [];
    const trColors: number[] = [];

    // Water Geometry buffers
    const wtPositions: number[] = [];
    const wtNormals: number[] = [];
    const wtUvs: number[] = [];
    const wtColors: number[] = [];

    const addFace = (
      pBuf: number[],
      nBuf: number[],
      uvBuf: number[],
      cBuf: number[],
      p1: number[],
      p2: number[],
      p3: number[],
      p4: number[],
      normal: [number, number, number],
      faceAtlas: AtlasFace,
      lightLevel: number,
      ao: [number, number, number, number]
    ) => {
      const { uMin, uMax, vMin, vMax } = atlasManager.getFaceUV(faceAtlas);

      // Two triangles (p1, p2, p3) & (p1, p3, p4)
      pBuf.push(...p1, ...p2, ...p3, ...p1, ...p3, ...p4);
      for (let i = 0; i < 6; i++) {
        nBuf.push(normal[0], normal[1], normal[2]);
      }

      // UVs
      uvBuf.push(
        uMin, vMin,
        uMax, vMin,
        uMax, vMax,
        uMin, vMin,
        uMax, vMax,
        uMin, vMax
      );

      // Vertex Colors (directional light * AO)
      const c1 = lightLevel * ao[0];
      const c2 = lightLevel * ao[1];
      const c3 = lightLevel * ao[2];
      const c4 = lightLevel * ao[3];

      cBuf.push(
        c1, c1, c1,
        c2, c2, c2,
        c3, c3, c3,
        c1, c1, c1,
        c3, c3, c3,
        c4, c4, c4
      );
    };

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
          const block = chunk.getBlock(lx, y, lz);
          if (block === BlockType.AIR) continue;

          const isWater = block === BlockType.WATER;
          const isTranslucent = block === BlockType.GLASS || block === BlockType.LEAVES;

          let pBuf = opPositions;
          let nBuf = opNormals;
          let uvBuf = opUvs;
          let cBuf = opColors;

          if (isWater) {
            pBuf = wtPositions;
            nBuf = wtNormals;
            uvBuf = wtUvs;
            cBuf = wtColors;
          } else if (isTranslucent) {
            pBuf = trPositions;
            nBuf = trNormals;
            uvBuf = trUvs;
            cBuf = trColors;
          }

          const wx = wxBase + lx;
          const wz = wzBase + lz;

          const faces = atlasManager.getBlockFaces(block);

          // Neighbor checks
          const topBlock = this.getBlock(wx, y + 1, wz);
          const bottomBlock = this.getBlock(wx, y - 1, wz);
          const northBlock = this.getBlock(wx, y, wz + 1);
          const southBlock = this.getBlock(wx, y, wz - 1);
          const eastBlock = this.getBlock(wx + 1, y, wz);
          const westBlock = this.getBlock(wx - 1, y, wz);

          // Check if face should be rendered
          const renderTop = isWater ? topBlock !== BlockType.WATER : isBlockTransparent(topBlock) && topBlock !== block;
          const renderBottom = isWater ? false : y > 0 && isBlockTransparent(bottomBlock) && bottomBlock !== block;
          const renderNorth = isWater ? northBlock !== BlockType.WATER : isBlockTransparent(northBlock) && northBlock !== block;
          const renderSouth = isWater ? southBlock !== BlockType.WATER : isBlockTransparent(southBlock) && southBlock !== block;
          const renderEast = isWater ? eastBlock !== BlockType.WATER : isBlockTransparent(eastBlock) && eastBlock !== block;
          const renderWest = isWater ? westBlock !== BlockType.WATER : isBlockTransparent(westBlock) && westBlock !== block;

          const x0 = lx, x1 = lx + 1;
          const y0 = y, y1 = isWater ? y + 0.9 : y + 1;
          const z0 = lz, z1 = lz + 1;

          // +Y Top Face
          if (renderTop) {
            const ao0 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx - 1, y + 1, wz)),
              isBlockSolid(this.getBlock(wx, y + 1, wz - 1)),
              isBlockSolid(this.getBlock(wx - 1, y + 1, wz - 1))
            );
            const ao1 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx + 1, y + 1, wz)),
              isBlockSolid(this.getBlock(wx, y + 1, wz - 1)),
              isBlockSolid(this.getBlock(wx + 1, y + 1, wz - 1))
            );
            const ao2 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx + 1, y + 1, wz)),
              isBlockSolid(this.getBlock(wx, y + 1, wz + 1)),
              isBlockSolid(this.getBlock(wx + 1, y + 1, wz + 1))
            );
            const ao3 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx - 1, y + 1, wz)),
              isBlockSolid(this.getBlock(wx, y + 1, wz + 1)),
              isBlockSolid(this.getBlock(wx - 1, y + 1, wz + 1))
            );

            addFace(
              pBuf, nBuf, uvBuf, cBuf,
              [x0, y1, z0],
              [x1, y1, z0],
              [x1, y1, z1],
              [x0, y1, z1],
              [0, 1, 0],
              faces.top,
              1.0,
              [ao0, ao1, ao2, ao3]
            );
          }

          // -Y Bottom Face
          if (renderBottom) {
            addFace(
              pBuf, nBuf, uvBuf, cBuf,
              [x0, y0, z1],
              [x1, y0, z1],
              [x1, y0, z0],
              [x0, y0, z0],
              [0, -1, 0],
              faces.bottom,
              0.55,
              [1, 1, 1, 1]
            );
          }

          // +Z North Face
          if (renderNorth) {
            const ao0 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx - 1, y, wz + 1)),
              isBlockSolid(this.getBlock(wx, y - 1, wz + 1)),
              isBlockSolid(this.getBlock(wx - 1, y - 1, wz + 1))
            );
            const ao1 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx + 1, y, wz + 1)),
              isBlockSolid(this.getBlock(wx, y - 1, wz + 1)),
              isBlockSolid(this.getBlock(wx + 1, y - 1, wz + 1))
            );
            const ao2 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx + 1, y, wz + 1)),
              isBlockSolid(this.getBlock(wx, y + 1, wz + 1)),
              isBlockSolid(this.getBlock(wx + 1, y + 1, wz + 1))
            );
            const ao3 = this.computeVertexAO(
              isBlockSolid(this.getBlock(wx - 1, y, wz + 1)),
              isBlockSolid(this.getBlock(wx, y + 1, wz + 1)),
              isBlockSolid(this.getBlock(wx - 1, y + 1, wz + 1))
            );

            addFace(
              pBuf, nBuf, uvBuf, cBuf,
              [x0, y0, z1],
              [x1, y0, z1],
              [x1, y1, z1],
              [x0, y1, z1],
              [0, 0, 1],
              faces.side,
              0.8,
              [ao0, ao1, ao2, ao3]
            );
          }

          // -Z South Face
          if (renderSouth) {
            addFace(
              pBuf, nBuf, uvBuf, cBuf,
              [x1, y0, z0],
              [x0, y0, z0],
              [x0, y1, z0],
              [x1, y1, z0],
              [0, 0, -1],
              faces.side,
              0.8,
              [1, 1, 1, 1]
            );
          }

          // +X East Face
          if (renderEast) {
            addFace(
              pBuf, nBuf, uvBuf, cBuf,
              [x1, y0, z1],
              [x1, y0, z0],
              [x1, y1, z0],
              [x1, y1, z1],
              [1, 0, 0],
              faces.side,
              0.72,
              [1, 1, 1, 1]
            );
          }

          // -X West Face
          if (renderWest) {
            addFace(
              pBuf, nBuf, uvBuf, cBuf,
              [x0, y0, z0],
              [x0, y0, z1],
              [x0, y1, z1],
              [x0, y1, z0],
              [-1, 0, 0],
              faces.side,
              0.72,
              [1, 1, 1, 1]
            );
          }
        }
      }
    }

    // Helper to build/update Mesh from buffer
    const updateMesh = (
      existingMesh: THREE.Mesh | null,
      pos: number[],
      norm: number[],
      uvs: number[],
      colors: number[],
      material: THREE.Material
    ): THREE.Mesh | null => {
      if (existingMesh) {
        existingMesh.geometry.dispose();
        chunk.group.remove(existingMesh);
      }
      if (pos.length === 0) return null;

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

      const mesh = new THREE.Mesh(geom, material);
      chunk.group.add(mesh);
      return mesh;
    };

    chunk.opaqueMesh = updateMesh(
      chunk.opaqueMesh,
      opPositions,
      opNormals,
      opUvs,
      opColors,
      atlasManager.opaqueMaterial
    );

    chunk.transparentMesh = updateMesh(
      chunk.transparentMesh,
      trPositions,
      trNormals,
      trUvs,
      trColors,
      atlasManager.transparentMaterial
    );

    chunk.waterMesh = updateMesh(
      chunk.waterMesh,
      wtPositions,
      wtNormals,
      wtUvs,
      wtColors,
      atlasManager.waterMaterial
    );
  }

  // Fast Voxel Raycaster (Amanatides & Woo 3D DDA algorithm)
  public raycastVoxel(
    rayOrigin: THREE.Vector3,
    rayDir: THREE.Vector3,
    maxDistance: number = 6.0
  ): RaycastHit | null {
    const dir = rayDir.clone().normalize();

    let x = Math.floor(rayOrigin.x);
    let y = Math.floor(rayOrigin.y);
    let z = Math.floor(rayOrigin.z);

    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

    let tMaxX = stepX > 0 ? (x + 1 - rayOrigin.x) * tDeltaX : (rayOrigin.x - x) * tDeltaX;
    let tMaxY = stepY > 0 ? (y + 1 - rayOrigin.y) * tDeltaY : (rayOrigin.y - y) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (z + 1 - rayOrigin.z) * tDeltaZ : (rayOrigin.z - z) * tDeltaZ;

    let distance = 0;
    let faceNormal = new THREE.Vector3();

    while (distance <= maxDistance) {
      const block = this.getBlock(x, y, z);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        return {
          blockX: x,
          blockY: y,
          blockZ: z,
          placeX: x + faceNormal.x,
          placeY: y + faceNormal.y,
          placeZ: z + faceNormal.z,
          blockType: block,
          faceNormal: faceNormal.clone(),
          distance,
        };
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          faceNormal.set(-stepX, 0, 0);
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          faceNormal.set(0, 0, -stepZ);
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          faceNormal.set(0, -stepY, 0);
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          faceNormal.set(0, 0, -stepZ);
        }
      }
    }

    return null;
  }

  // Generate an in-built starter house with furniture, windows, torches, and roof
  public buildStarterHouse(hx: number, hy: number, hz: number) {
    const width = 6;
    const depth = 6;
    const height = 4;

    // 1. Foundation & Floor
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        for (let y = hy - 3; y < hy; y++) {
          this.setBlock(hx + x, y, hz + z, BlockType.COBBLESTONE);
        }
        this.setBlock(hx + x, hy, hz + z, BlockType.PLANKS);
      }
    }

    // 2. Clear interior air space
    for (let x = 1; x < width - 1; x++) {
      for (let z = 1; z < depth - 1; z++) {
        for (let y = hy + 1; y <= hy + height + 2; y++) {
          this.setBlock(hx + x, y, hz + z, BlockType.AIR);
        }
      }
    }

    // 3. Four Wooden Log Pillars on corners
    for (let y = hy + 1; y <= hy + height; y++) {
      this.setBlock(hx, y, hz, BlockType.WOOD);
      this.setBlock(hx + width - 1, y, hz, BlockType.WOOD);
      this.setBlock(hx, y, hz + depth - 1, BlockType.WOOD);
      this.setBlock(hx + width - 1, y, hz + depth - 1, BlockType.WOOD);
    }

    // 4. Plank Walls with Glass Windows
    for (let y = hy + 1; y <= hy + height; y++) {
      for (let x = 1; x < width - 1; x++) {
        // Front wall (z = 0) with open doorway at x = 2
        if (x === 2 && (y === hy + 1 || y === hy + 2)) {
          this.setBlock(hx + x, y, hz, BlockType.AIR);
        } else if (x === 4 && y === hy + 2) {
          this.setBlock(hx + x, y, hz, BlockType.GLASS);
        } else {
          this.setBlock(hx + x, y, hz, BlockType.PLANKS);
        }

        // Back wall (z = depth - 1) with window
        if ((x === 2 || x === 3) && y === hy + 2) {
          this.setBlock(hx + x, y, hz + depth - 1, BlockType.GLASS);
        } else {
          this.setBlock(hx + x, y, hz + depth - 1, BlockType.PLANKS);
        }
      }

      for (let z = 1; z < depth - 1; z++) {
        // Left wall
        if ((z === 2 || z === 3) && y === hy + 2) {
          this.setBlock(hx, y, hz + z, BlockType.GLASS);
        } else {
          this.setBlock(hx, y, hz + z, BlockType.PLANKS);
        }

        // Right wall
        if ((z === 2 || z === 3) && y === hy + 2) {
          this.setBlock(hx + width - 1, y, hz + z, BlockType.GLASS);
        } else {
          this.setBlock(hx + width - 1, y, hz + z, BlockType.PLANKS);
        }
      }
    }

    // 5. Roof with eaves
    const roofBaseY = hy + height + 1;
    for (let x = -1; x <= width; x++) {
      for (let z = -1; z <= depth; z++) {
        this.setBlock(hx + x, roofBaseY, hz + z, BlockType.STONE_BRICKS);
      }
    }
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        this.setBlock(hx + x, roofBaseY + 1, hz + z, BlockType.PLANKS);
      }
    }
    for (let z = 1; z < depth - 1; z++) {
      this.setBlock(hx + 2, roofBaseY + 2, hz + z, BlockType.STONE_BRICKS);
      this.setBlock(hx + 3, roofBaseY + 2, hz + z, BlockType.STONE_BRICKS);
    }

    // 6. Cozy Interior Furnishings
    // Crafting bench in back left corner
    this.setBlock(hx + 1, hy + 1, hz + depth - 2, BlockType.CRAFTING_BENCH);
    // Brick hearth / fireplace
    this.setBlock(hx + width - 2, hy + 1, hz + depth - 2, BlockType.BRICKS);
    this.setBlock(hx + width - 2, hy + 2, hz + depth - 2, BlockType.BRICKS);
    // Interior warm torches
    this.setBlock(hx + 1, hy + 3, hz + 2, BlockType.TORCH);
    this.setBlock(hx + width - 2, hy + 3, hz + 2, BlockType.TORCH);
    // Front door torch
    this.setBlock(hx + 1, hy + 3, hz - 1, BlockType.TORCH);
    this.setBlock(hx + 3, hy + 3, hz - 1, BlockType.TORCH);
  }
}
