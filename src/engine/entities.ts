import * as THREE from 'three';
import { DroppedItem, MobEntity } from '../types/game';
import { isBlockSolid, WorldManager } from './world';
import { sound } from '../utils/audio';

export class EntityManager {
  public mobs: MobEntity[] = [];
  public mobMeshes: Map<string, THREE.Group> = new Map();
  public droppedItems: DroppedItem[] = [];
  public dropMeshes: Map<string, THREE.Mesh> = new Map();
  public scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  // Spawn friendly Meadow Boar
  public spawnBoar(x: number, y: number, z: number): MobEntity {
    const id = 'boar_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'piglet',
      name: 'Meadow Boar',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.random() * Math.PI * 2,
      health: 10,
      maxHealth: 10,
      isHostile: false,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: false,
    };

    const group = this.createBoarMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Spawn Mountain Ram
  public spawnRam(x: number, y: number, z: number): MobEntity {
    const id = 'ram_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'sheep',
      name: 'Mountain Ram',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.random() * Math.PI * 2,
      health: 10,
      maxHealth: 10,
      isHostile: false,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: false,
    };

    const group = this.createRamMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Spawn Shadow Crawler (Hostile Night Mob)
  public spawnShadowCrawler(x: number, y: number, z: number): MobEntity {
    const id = 'shadow_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'shadow_crawler',
      name: 'Shadow Crawler',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.random() * Math.PI * 2,
      health: 16,
      maxHealth: 16,
      isHostile: true,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: true,
    };

    const group = this.createShadowCrawlerMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Spawn Prehistoric Dinosaur
  public spawnDino(x: number, y: number, z: number): MobEntity {
    const id = 'dino_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'dino',
      name: 'Voxel Raptor Dino',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.random() * Math.PI * 2,
      health: 35,
      maxHealth: 35,
      isHostile: false,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: false,
    };

    const group = this.createDinoMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Spawn Giant Cave Spider (Hostile)
  public spawnSpider(x: number, y: number, z: number): MobEntity {
    const id = 'spider_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'spider',
      name: 'Voxel Arachnid',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.random() * Math.PI * 2,
      health: 14,
      maxHealth: 14,
      isHostile: true,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: true,
    };

    const group = this.createSpiderMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Spawn Undead Zombie (Hostile)
  public spawnZombie(x: number, y: number, z: number): MobEntity {
    const id = 'zombie_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'zombie',
      name: 'Undead Walker',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: Math.random() * Math.PI * 2,
      health: 20,
      maxHealth: 20,
      isHostile: true,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: true,
    };

    const group = this.createZombieMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Spawn In-built Loyal Pet Companion
  public spawnPet(x: number, y: number, z: number): MobEntity {
    const id = 'pet_' + Math.random().toString(36).substring(2, 9);
    const mob: MobEntity = {
      id,
      type: 'pet',
      name: '🐾 Buddy (Pet)',
      x,
      y,
      z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: 0,
      health: 40,
      maxHealth: 40,
      isHostile: false,
      attackCooldown: 0,
      walkCycle: 0,
      targetPlayer: false,
      isPet: true,
      isPetSitting: false,
    };

    const group = this.createPetMesh();
    group.position.set(x, y, z);
    this.scene.add(group);
    this.mobMeshes.set(id, group);
    this.mobs.push(mob);
    return mob;
  }

  // Bounding box collision checker against solid voxel world blocks
  private isBoxColliding(
    minX: number,
    minY: number,
    minZ: number,
    maxX: number,
    maxY: number,
    maxZ: number,
    world: WorldManager
  ): boolean {
    const startX = Math.floor(minX);
    const endX = Math.floor(maxX);
    const startY = Math.floor(minY);
    const endY = Math.floor(maxY);
    const startZ = Math.floor(minZ);
    const endZ = Math.floor(maxZ);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        for (let z = startZ; z <= endZ; z++) {
          if (isBlockSolid(world.getBlock(x, y, z))) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Entity Bounding Box Dimensions
  private getMobDimensions(type: string): { hw: number; h: number } {
    switch (type) {
      case 'dino':
        return { hw: 0.65, h: 2.3 };
      case 'golem':
        return { hw: 0.55, h: 2.1 };
      case 'zombie':
      case 'shadow_crawler':
        return { hw: 0.32, h: 1.8 };
      case 'spider':
        return { hw: 0.45, h: 0.65 };
      case 'pet':
        return { hw: 0.28, h: 0.8 };
      case 'boar':
      case 'piglet':
      case 'ram':
      case 'sheep':
      default:
        return { hw: 0.35, h: 0.85 };
    }
  }

  // 3D Voxel Models
  private createBoarMesh(): THREE.Group {
    const group = new THREE.Group();
    const pinkMat = new THREE.MeshLambertMaterial({ color: 0xee9ca7 });
    const snoutMat = new THREE.MeshLambertMaterial({ color: 0xe07b8b });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const hoofMat = new THREE.MeshLambertMaterial({ color: 0x5a3d31 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.7, 1.2), pinkMat);
    body.position.y = 0.65;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), pinkMat);
    head.name = 'head';
    head.position.set(0, 0.85, 0.75);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.25), snoutMat);
    snout.position.set(0, -0.1, 0.4);
    head.add(snout);

    // Eyes
    const eyeLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeLeft.position.set(0.33, 0.1, 0.25);
    head.add(eyeLeft);
    const eyeRight = eyeLeft.clone();
    eyeRight.position.x = -0.33;
    head.add(eyeRight);

    // 4 Legs
    const legGeom = new THREE.BoxGeometry(0.24, 0.45, 0.24);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeom, hoofMat);
      leg.name = `leg_${i}`;
      const lx = (i % 2 === 0 ? 1 : -1) * 0.3;
      const lz = (i < 2 ? 1 : -1) * 0.42;
      leg.position.set(lx, 0.22, lz);
      group.add(leg);
    }

    return group;
  }

  private createRamMesh(): THREE.Group {
    const group = new THREE.Group();
    const woolMat = new THREE.MeshLambertMaterial({ color: 0xefede6 });
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xcca88d });
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x7a6552 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Wool Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 1.3), woolMat);
    body.position.y = 0.75;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.6), skinMat);
    head.name = 'head';
    head.position.set(0, 0.95, 0.8);
    group.add(head);

    // Horns
    const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.25), hornMat);
    hornL.position.set(0.32, 0.25, -0.05);
    head.add(hornL);
    const hornR = hornL.clone();
    hornR.position.x = -0.32;
    head.add(hornR);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeL.position.set(0.28, 0.05, 0.25);
    head.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.28;
    head.add(eyeR);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.22, 0.5, 0.22);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeom, skinMat);
      leg.name = `leg_${i}`;
      const lx = (i % 2 === 0 ? 1 : -1) * 0.32;
      const lz = (i < 2 ? 1 : -1) * 0.45;
      leg.position.set(lx, 0.25, lz);
      group.add(leg);
    }

    return group;
  }

  private createShadowCrawlerMesh(): THREE.Group {
    const group = new THREE.Group();
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x15161c });
    const spineMat = new THREE.MeshLambertMaterial({ color: 0x281938 });
    const glowEyeMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 1.1), darkMat);
    body.position.y = 0.65;
    group.add(body);

    // Spines on back
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.35, 0.8), spineMat);
    spine.position.set(0, 0.45, 0);
    body.add(spine);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.6), darkMat);
    head.name = 'head';
    head.position.set(0, 0.85, 0.7);
    group.add(head);

    // Glowing Red Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.09), glowEyeMat);
    eyeL.position.set(0.2, 0.1, 0.28);
    head.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.2;
    head.add(eyeR);

    // 4 Insectoid Spider-like legs
    const legGeom = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeom, darkMat);
      leg.name = `leg_${i}`;
      const lx = (i % 2 === 0 ? 1 : -1) * 0.42;
      const lz = (i < 2 ? 1 : -1) * 0.4;
      leg.position.set(lx, 0.32, lz);
      leg.rotation.z = (i % 2 === 0 ? -1 : 1) * 0.2;
      group.add(leg);
    }

    return group;
  }

  private createDinoMesh(): THREE.Group {
    const group = new THREE.Group();
    const dinoGreen = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
    const dinoBelly = new THREE.MeshLambertMaterial({ color: 0x81c784 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
    const teethMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const clawMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });

    // Torso
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.85, 1.4), dinoGreen);
    body.position.y = 0.9;
    group.add(body);

    // Belly plate
    const belly = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 1.2), dinoBelly);
    belly.position.set(0, -0.22, 0);
    body.add(belly);

    // Neck & Head
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), dinoGreen);
    neck.position.set(0, 0.45, 0.7);
    neck.rotation.x = -0.3;
    body.add(neck);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.55, 0.85), dinoGreen);
    head.name = 'head';
    head.position.set(0, 0.35, 0.3);
    neck.add(head);

    // Snout / Jaws
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.35, 0.5), dinoBelly);
    snout.position.set(0, -0.1, 0.45);
    head.add(snout);

    // Teeth
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.45), teethMat);
    teeth.position.set(0, -0.06, 0.46);
    head.add(teeth);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), eyeMat);
    eyeL.position.set(0.31, 0.12, 0.15);
    head.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.31;
    head.add(eyeR);

    // Tail (animated segment)
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    tailGroup.position.set(0, 0.1, -0.7);
    const tailSeg1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.7), dinoGreen);
    tailSeg1.position.z = -0.35;
    tailGroup.add(tailSeg1);
    const tailSeg2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.6), dinoBelly);
    tailSeg2.position.z = -0.95;
    tailGroup.add(tailSeg2);
    body.add(tailGroup);

    // Strong Hind Legs (leg_0, leg_1)
    const legGeom = new THREE.BoxGeometry(0.28, 0.65, 0.35);
    const legL = new THREE.Mesh(legGeom, clawMat);
    legL.name = 'leg_0';
    legL.position.set(0.48, 0.35, -0.1);
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, clawMat);
    legR.name = 'leg_1';
    legR.position.set(-0.48, 0.35, -0.1);
    group.add(legR);

    // Small Forearms (arm_l, arm_r)
    const armGeom = new THREE.BoxGeometry(0.12, 0.32, 0.12);
    const armL = new THREE.Mesh(armGeom, dinoGreen);
    armL.position.set(0.42, 0.1, 0.5);
    armL.rotation.x = -0.5;
    body.add(armL);
    const armR = armL.clone();
    armR.position.x = -0.42;
    body.add(armR);

    return group;
  }

  private createSpiderMesh(): THREE.Group {
    const group = new THREE.Group();
    const spiderMat = new THREE.MeshLambertMaterial({ color: 0x1b1c1e });
    const redGlow = new THREE.MeshBasicMaterial({ color: 0xff1744 });

    // Abdomen (back)
    const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.55, 0.95), spiderMat);
    abdomen.position.set(0, 0.4, -0.45);
    group.add(abdomen);

    // Cephalothorax (head/front)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.45, 0.55), spiderMat);
    head.name = 'head';
    head.position.set(0, 0.35, 0.25);
    group.add(head);

    // Multiple glowing red eyes
    const eyeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    for (let e = 0; e < 4; e++) {
      const eyeL = new THREE.Mesh(eyeGeom, redGlow);
      eyeL.position.set(0.12 + (e % 2) * 0.14, 0.05 + Math.floor(e / 2) * 0.1, 0.28);
      head.add(eyeL);
      const eyeR = eyeL.clone();
      eyeR.position.x = -eyeL.position.x;
      head.add(eyeR);
    }

    // 8 Articulated Sprawled Spider Legs
    const legGeom = new THREE.BoxGeometry(0.1, 0.55, 0.1);
    for (let i = 0; i < 8; i++) {
      const isLeft = i % 2 === 0;
      const legPair = Math.floor(i / 2);
      const leg = new THREE.Mesh(legGeom, spiderMat);
      leg.name = `spider_leg_${i}`;
      const side = isLeft ? 1 : -1;
      const lz = 0.3 - legPair * 0.25;
      leg.position.set(side * 0.5, 0.25, lz);
      leg.rotation.z = side * 0.45;
      leg.rotation.y = (legPair - 1.5) * 0.25 * side;
      group.add(leg);
    }

    return group;
  }

  private createZombieMesh(): THREE.Group {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: 0x5b8a54 });
    const shirtMat = new THREE.MeshLambertMaterial({ color: 0x1976d2 });
    const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2c3456 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.75, 0.35), shirtMat);
    torso.position.y = 1.05;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
    head.name = 'head';
    head.position.set(0, 0.62, 0);
    torso.add(head);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), eyeMat);
    eyeL.position.set(0.14, 0.05, 0.25);
    head.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.14;
    head.add(eyeR);

    // Outstretched Forward Arms
    const armGeom = new THREE.BoxGeometry(0.2, 0.7, 0.2);
    const armL = new THREE.Mesh(armGeom, skinMat);
    armL.name = 'arm_l';
    armL.position.set(0.42, 0.22, 0.35);
    armL.rotation.x = -Math.PI / 2 + 0.1;
    torso.add(armL);

    const armR = new THREE.Mesh(armGeom, skinMat);
    armR.name = 'arm_r';
    armR.position.set(-0.42, 0.22, 0.35);
    armR.rotation.x = -Math.PI / 2 + 0.1;
    torso.add(armR);

    // Legs
    const legGeom = new THREE.BoxGeometry(0.25, 0.7, 0.25);
    const legL = new THREE.Mesh(legGeom, pantsMat);
    legL.name = 'leg_0';
    legL.position.set(0.18, 0.35, 0);
    group.add(legL);

    const legR = new THREE.Mesh(legGeom, pantsMat);
    legR.name = 'leg_1';
    legR.position.set(-0.18, 0.35, 0);
    group.add(legR);

    return group;
  }

  private createPetMesh(): THREE.Group {
    const group = new THREE.Group();
    const furMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });
    const whiteFurMat = new THREE.MeshLambertMaterial({ color: 0xfaf0e6 });
    const collarMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f });
    const noseMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.52, 0.9), furMat);
    body.name = 'body';
    body.position.y = 0.52;
    group.add(body);

    // White chest fur
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.38, 0.3), whiteFurMat);
    chest.position.set(0, -0.06, 0.35);
    body.add(chest);

    // Red Collar
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.1, 0.48), collarMat);
    collar.position.set(0, 0.25, 0.42);
    body.add(collar);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.42, 0.45), furMat);
    head.name = 'head';
    head.position.set(0, 0.48, 0.55);
    body.add(head);

    // Floppy Ears
    const earGeom = new THREE.BoxGeometry(0.12, 0.22, 0.12);
    const earL = new THREE.Mesh(earGeom, furMat);
    earL.position.set(0.24, 0.15, -0.05);
    earL.rotation.z = -0.2;
    head.add(earL);
    const earR = new THREE.Mesh(earGeom, furMat);
    earR.position.set(-0.24, 0.15, -0.05);
    earR.rotation.z = 0.2;
    head.add(earR);

    // Snout & Cute Nose
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.18, 0.25), whiteFurMat);
    snout.position.set(0, -0.08, 0.3);
    head.add(snout);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.08), noseMat);
    nose.position.set(0, 0.05, 0.14);
    snout.add(nose);

    // Eyes
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeL.position.set(0.14, 0.06, 0.23);
    head.add(eyeL);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.14;
    head.add(eyeR);

    // Wagging Tail
    const tailGroup = new THREE.Group();
    tailGroup.name = 'tail';
    tailGroup.position.set(0, 0.18, -0.45);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), furMat);
    tail.position.set(0, 0.16, -0.1);
    tail.rotation.x = -0.7;
    tailGroup.add(tail);
    body.add(tailGroup);

    // 4 Paws
    const legGeom = new THREE.BoxGeometry(0.18, 0.35, 0.18);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(legGeom, whiteFurMat);
      leg.name = `leg_${i}`;
      const lx = (i % 2 === 0 ? 1 : -1) * 0.22;
      const lz = (i < 2 ? 1 : -1) * 0.3;
      leg.position.set(lx, 0.18, lz);
      group.add(leg);
    }

    return group;
  }

  // Spawn Dropped Item Pickup Entity
  public spawnDroppedItem(itemId: string, count: number, x: number, y: number, z: number) {
    const id = 'drop_' + Math.random().toString(36).substring(2, 9);
    const drop: DroppedItem = {
      id,
      itemId,
      count,
      x,
      y,
      z,
      vx: (Math.random() - 0.5) * 2.5,
      vy: 3.5 + Math.random() * 1.5,
      vz: (Math.random() - 0.5) * 2.5,
      rotationY: Math.random() * Math.PI * 2,
      lifetime: 0,
    };

    // Tiny 3D floating voxel box representation
    const geom = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const mat = new THREE.MeshLambertMaterial({
      color: itemId.includes('diamond') ? 0x00e5ff :
             itemId.includes('gold') ? 0xffd700 :
             itemId.includes('iron') ? 0xd0d5dd :
             itemId.includes('wood') || itemId.includes('planks') ? 0x9b764b :
             itemId.includes('meat') || itemId.includes('apple') ? 0xe74c3c :
             itemId.includes('dirt') ? 0x6f4e37 : 0x7a7a7a
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.dropMeshes.set(id, mesh);
    this.droppedItems.push(drop);
  }

  // Hurt Mob
  public damageMob(mobId: string, damage: number, knockbackDir?: THREE.Vector3): boolean {
    const mob = this.mobs.find(m => m.id === mobId);
    if (!mob) return false;

    mob.health -= damage;
    sound.playMobHurt(mob.type);

    // Apply knockback
    if (knockbackDir) {
      mob.vx += knockbackDir.x * 4.5;
      mob.vy += 3.5;
      mob.vz += knockbackDir.z * 4.5;
    }

    // Flash mesh red
    const mesh = this.mobMeshes.get(mobId);
    if (mesh) {
      mesh.traverse(child => {
        if (child instanceof THREE.Mesh && child.material && 'color' in child.material) {
          const originalColor = (child.material as THREE.MeshLambertMaterial).color.getHex();
          (child.material as THREE.MeshLambertMaterial).color.setHex(0xff3333);
          setTimeout(() => {
            if (child.material) {
              (child.material as THREE.MeshLambertMaterial).color.setHex(originalColor);
            }
          }, 150);
        }
      });
    }

    // If mob dies
    if (mob.health <= 0) {
      this.killMob(mobId);
      return true;
    }
    return false;
  }

  public killMob(mobId: string) {
    const mobIdx = this.mobs.findIndex(m => m.id === mobId);
    if (mobIdx === -1) return;
    const mob = this.mobs[mobIdx];

    sound.playMobDeath(mob.type);

    // Drops based on mob type
    if (mob.type === 'piglet') {
      this.spawnDroppedItem('cooked_meat', 1 + Math.floor(Math.random() * 2), mob.x, mob.y + 0.5, mob.z);
    } else if (mob.type === 'sheep') {
      this.spawnDroppedItem('apple', 1 + Math.floor(Math.random() * 2), mob.x, mob.y + 0.5, mob.z);
    } else if (mob.type === 'shadow_crawler') {
      this.spawnDroppedItem('coal', 1 + Math.floor(Math.random() * 3), mob.x, mob.y + 0.5, mob.z);
      if (Math.random() > 0.4) {
        this.spawnDroppedItem('iron_ingot', 1, mob.x, mob.y + 0.5, mob.z);
      }
    } else if (mob.type === 'dino') {
      this.spawnDroppedItem('cooked_meat', 3, mob.x, mob.y + 0.5, mob.z);
      this.spawnDroppedItem('diamond', 1, mob.x, mob.y + 0.8, mob.z);
    } else if (mob.type === 'spider') {
      this.spawnDroppedItem('stick', 2, mob.x, mob.y + 0.5, mob.z);
      this.spawnDroppedItem('coal', 1, mob.x, mob.y + 0.5, mob.z);
    } else if (mob.type === 'zombie') {
      this.spawnDroppedItem('cooked_meat', 1, mob.x, mob.y + 0.5, mob.z);
      if (Math.random() > 0.5) {
        this.spawnDroppedItem('iron_ore', 1, mob.x, mob.y + 0.5, mob.z);
      }
    }

    // Remove mesh
    const mesh = this.mobMeshes.get(mobId);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
      this.mobMeshes.delete(mobId);
    }

    this.mobs.splice(mobIdx, 1);
  }

  // Update Entities & AI
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    world: WorldManager,
    onPlayerHit: (damage: number) => void,
    onCollectItem: (itemId: string, count: number) => void
  ) {
    const clampedDt = Math.min(0.08, dt);

    // 1. Update Mobs
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];
      const mesh = this.mobMeshes.get(mob.id);
      if (!mesh) continue;

      const distToPlayer = Math.hypot(playerPos.x - mob.x, playerPos.z - mob.z);

      // AI Logic by Mob Type
      if (mob.type === 'pet') {
        // PET AI: Loyal companion Buddy
        if (mob.isPetSitting) {
          mob.vx *= 0.5;
          mob.vz *= 0.5;
          if (Math.random() < 0.0015) {
            sound.playPetWhine();
          }
        } else {
          if (Math.random() < 0.0015) {
            sound.playPetBark();
          }
          // Check if any hostile monster is nearby to defend player!
          let closestHostile: MobEntity | null = null;
          let minHostileDist = 12.0;
          for (const m of this.mobs) {
            if (m.isHostile && m.health > 0) {
              const d = Math.hypot(m.x - mob.x, m.z - mob.z);
              if (d < minHostileDist) {
                minHostileDist = d;
                closestHostile = m;
              }
            }
          }

          if (closestHostile) {
            // Rush to attack hostile monster!
            mob.yaw = Math.atan2(closestHostile.x - mob.x, closestHostile.z - mob.z);
            mob.vx = Math.sin(mob.yaw) * 4.5;
            mob.vz = Math.cos(mob.yaw) * 4.5;

            if (minHostileDist < 1.4) {
              mob.attackCooldown -= clampedDt;
              if (mob.attackCooldown <= 0) {
                mob.attackCooldown = 0.8;
                sound.playPetBark();
                this.damageMob(closestHostile.id, 6, new THREE.Vector3(Math.sin(mob.yaw), 0.5, Math.cos(mob.yaw)));
              }
            }
          } else {
            // Follow player
            if (distToPlayer > 22.0) {
              // Teleport near player if stuck or left behind (find clear ground)
              const candX = Math.floor(playerPos.x + 1.2);
              const candZ = Math.floor(playerPos.z + 1.2);
              let foundY = Math.floor(playerPos.y);
              for (let dy = 2; dy >= -3; dy--) {
                const testY = Math.floor(playerPos.y) + dy;
                if (isBlockSolid(world.getBlock(candX, testY, candZ)) && !isBlockSolid(world.getBlock(candX, testY + 1, candZ))) {
                  foundY = testY + 1;
                  break;
                }
              }
              mob.x = candX + 0.5;
              mob.y = foundY + 0.05;
              mob.z = candZ + 0.5;
              mob.vx = 0;
              mob.vy = 0;
              mob.vz = 0;
            } else if (distToPlayer > 3.2) {
              mob.yaw = Math.atan2(playerPos.x - mob.x, playerPos.z - mob.z);
              const speed = distToPlayer > 8.0 ? 4.8 : 3.4;
              mob.vx = Math.sin(mob.yaw) * speed;
              mob.vz = Math.cos(mob.yaw) * speed;
            } else {
              mob.vx *= 0.75;
              mob.vz *= 0.75;
              mob.yaw = Math.atan2(playerPos.x - mob.x, playerPos.z - mob.z);
            }
          }
        }

        // Tail wag animation
        const tail = mesh.getObjectByName('tail');
        if (tail) {
          tail.rotation.y = Math.sin(performance.now() * 0.012) * 0.45;
        }

      } else if (mob.type === 'zombie') {
        // ZOMBIE AI: Shambles toward player
        if (distToPlayer < 18.0) {
          mob.yaw = Math.atan2(playerPos.x - mob.x, playerPos.z - mob.z);
          const speed = 2.4;
          mob.vx = Math.sin(mob.yaw) * speed;
          mob.vz = Math.cos(mob.yaw) * speed;

          if (Math.random() < 0.003) {
            sound.playZombieGroan();
          }

          if (distToPlayer < 1.4 && Math.abs(playerPos.y - mob.y) < 1.6) {
            mob.attackCooldown -= clampedDt;
            if (mob.attackCooldown <= 0) {
              mob.attackCooldown = 1.2;
              onPlayerHit(3);
              sound.playZombieGroan();
            }
          }
        } else {
          mob.vx *= 0.8;
          mob.vz *= 0.8;
        }

        // Zombie arm swaying
        const armL = mesh.getObjectByName('arm_l');
        const armR = mesh.getObjectByName('arm_r');
        if (armL && armR) {
          armL.rotation.x = -Math.PI / 2 + Math.sin(performance.now() * 0.004) * 0.15;
          armR.rotation.x = -Math.PI / 2 - Math.sin(performance.now() * 0.004) * 0.15;
        }

      } else if (mob.type === 'spider') {
        // SPIDER AI: Fast scuttling arachnid
        if (distToPlayer < 16.0) {
          mob.yaw = Math.atan2(playerPos.x - mob.x, playerPos.z - mob.z);
          const speed = 3.8;
          mob.vx = Math.sin(mob.yaw) * speed;
          mob.vz = Math.cos(mob.yaw) * speed;

          // Occasional leap
          if (distToPlayer < 4.0 && Math.random() < 0.02 && Math.abs(mob.vy) < 0.2) {
            mob.vy = 5.0;
            sound.playSpiderHiss();
          }

          if (Math.random() < 0.004) {
            sound.playSpiderHiss();
          }

          if (distToPlayer < 1.3 && Math.abs(playerPos.y - mob.y) < 1.4) {
            mob.attackCooldown -= clampedDt;
            if (mob.attackCooldown <= 0) {
              mob.attackCooldown = 0.9;
              onPlayerHit(3);
              sound.playSpiderHiss();
            }
          }
        } else {
          mob.vx *= 0.8;
          mob.vz *= 0.8;
        }

        // Spider 8 legs scurry
        const moveSpeed = Math.hypot(mob.vx, mob.vz);
        if (moveSpeed > 0.1) {
          if (Math.random() < 0.003) {
            sound.playSpiderChitter();
          }
          const scurry = Math.sin(performance.now() * 0.02) * 0.3;
          for (let l = 0; l < 8; l++) {
            const leg = mesh.getObjectByName(`spider_leg_${l}`);
            if (leg) {
              leg.rotation.x = (l % 2 === 0 ? scurry : -scurry);
            }
          }
        }

      } else if (mob.type === 'dino') {
        // DINO AI: Majestic prehistoric creature
        if (Math.random() < 0.003) {
          sound.playDinoRoar();
        }
        if (Math.random() < 0.01) {
          mob.yaw += (Math.random() - 0.5) * 1.2;
        }
        if (Math.random() < 0.02) {
          const wanderSpeed = Math.random() > 0.3 ? 2.2 : 0;
          mob.vx = Math.sin(mob.yaw) * wanderSpeed;
          mob.vz = Math.cos(mob.yaw) * wanderSpeed;
          if (wanderSpeed > 0 && Math.random() < 0.005) {
            sound.playDinoStomp();
          }
        }

        // Dino tail sway
        const tail = mesh.getObjectByName('tail');
        if (tail) {
          tail.rotation.y = Math.sin(performance.now() * 0.005) * 0.3;
        }

      } else if (mob.isHostile) {
        // Shadow Crawler pursues player if close
        if (distToPlayer < 16.0) {
          mob.yaw = Math.atan2(playerPos.x - mob.x, playerPos.z - mob.z);
          const speed = 3.6;
          mob.vx = Math.sin(mob.yaw) * speed;
          mob.vz = Math.cos(mob.yaw) * speed;

          if (Math.random() < 0.003) {
            sound.playCrawlerShriek();
          }

          if (distToPlayer < 1.4 && Math.abs(playerPos.y - mob.y) < 1.6) {
            mob.attackCooldown -= clampedDt;
            if (mob.attackCooldown <= 0) {
              mob.attackCooldown = 1.2;
              onPlayerHit(4);
              sound.playCrawlerShriek();
            }
          }
        } else {
          mob.vx *= 0.8;
          mob.vz *= 0.8;
        }
      } else {
        // Friendly mob wandering AI (boar, ram, golem)
        if (Math.random() < 0.0025) {
          if (mob.type === 'piglet') {
            sound.playBoarGrunt();
          } else if (mob.type === 'sheep') {
            sound.playRamBleat();
          } else if (mob.type === 'golem') {
            sound.playGolemClank();
          }
        }

        if (Math.random() < 0.015) {
          mob.yaw += (Math.random() - 0.5) * 1.5;
        }
        if (Math.random() < 0.02) {
          const wanderSpeed = Math.random() > 0.4 ? 1.5 : 0;
          mob.vx = Math.sin(mob.yaw) * wanderSpeed;
          mob.vz = Math.cos(mob.yaw) * wanderSpeed;
        }
      }

      // Physics, Bounding Box & Solid Block Collision Resolution
      const { hw, h } = this.getMobDimensions(mob.type);
      const eps = 0.002;

      // 0. Unstuck safety: If mob is trapped inside a solid block, nudge upward to open space
      if (this.isBoxColliding(mob.x - 0.2, mob.y + 0.15, mob.z - 0.2, mob.x + 0.2, mob.y + Math.min(1.2, h), mob.z + 0.2, world)) {
        mob.y = Math.ceil(mob.y) + 0.05;
        mob.vy = 0;
      }

      // 1. Move X with Solid Block Collision & Step Assist
      if (Math.abs(mob.vx) > 0.001) {
        const dx = mob.vx * clampedDt;
        const targetX = mob.x + dx;
        const footY = mob.y + 0.12;
        const headY = mob.y + h - 0.05;

        const collidesX = this.isBoxColliding(
          targetX - hw, footY, mob.z - hw,
          targetX + hw, headY, mob.z + hw,
          world
        );

        if (!collidesX) {
          mob.x = targetX;
        } else {
          // Check step-up: can it walk up a 1-block step?
          let stepped = false;
          if (Math.abs(mob.vy) < 0.2) {
            const stepY = Math.floor(mob.y) + 1.0;
            const clearAboveHead = !this.isBoxColliding(
              mob.x - hw, mob.y + 0.4, mob.z - hw,
              mob.x + hw, stepY + h, mob.z + hw,
              world
            );
            const clearAtStepTarget = !this.isBoxColliding(
              targetX - hw, stepY + 0.05, mob.z - hw,
              targetX + hw, stepY + h, mob.z + hw,
              world
            );

            if (clearAboveHead && clearAtStepTarget) {
              mob.y = stepY;
              mob.x = targetX;
              stepped = true;
            }
          }

          if (!stepped) {
            // Firm stop against solid block wall (cannot pass through blocks)
            if (dx > 0) {
              const wallX = Math.floor(targetX + hw);
              mob.x = wallX - hw - eps;
            } else {
              const wallX = Math.floor(targetX - hw);
              mob.x = wallX + 1 + hw + eps;
            }
            mob.vx = 0;
            // Wandering mobs turn when hitting solid obstacles
            if (!mob.isHostile && mob.type !== 'pet') {
              mob.yaw += Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
            }
          }
        }
      }

      // 2. Move Z with Solid Block Collision & Step Assist
      if (Math.abs(mob.vz) > 0.001) {
        const dz = mob.vz * clampedDt;
        const targetZ = mob.z + dz;
        const footY = mob.y + 0.12;
        const headY = mob.y + h - 0.05;

        const collidesZ = this.isBoxColliding(
          mob.x - hw, footY, targetZ - hw,
          mob.x + hw, headY, targetZ + hw,
          world
        );

        if (!collidesZ) {
          mob.z = targetZ;
        } else {
          // Check step-up: can it walk up a 1-block step?
          let stepped = false;
          if (Math.abs(mob.vy) < 0.2) {
            const stepY = Math.floor(mob.y) + 1.0;
            const clearAboveHead = !this.isBoxColliding(
              mob.x - hw, mob.y + 0.4, mob.z - hw,
              mob.x + hw, stepY + h, mob.z + hw,
              world
            );
            const clearAtStepTarget = !this.isBoxColliding(
              mob.x - hw, stepY + 0.05, targetZ - hw,
              mob.x + hw, stepY + h, targetZ + hw,
              world
            );

            if (clearAboveHead && clearAtStepTarget) {
              mob.y = stepY;
              mob.z = targetZ;
              stepped = true;
            }
          }

          if (!stepped) {
            // Firm stop against solid block wall (cannot pass through blocks)
            if (dz > 0) {
              const wallZ = Math.floor(targetZ + hw);
              mob.z = wallZ - hw - eps;
            } else {
              const wallZ = Math.floor(targetZ - hw);
              mob.z = wallZ + 1 + hw + eps;
            }
            mob.vz = 0;
            if (!mob.isHostile && mob.type !== 'pet') {
              mob.yaw += Math.PI * 0.5 + (Math.random() - 0.5) * 0.5;
            }
          }
        }
      }

      // 3. Vertical Gravity & Ground/Ceiling Collision
      mob.vy -= 22 * clampedDt;
      if (mob.vy < -35) mob.vy = -35;

      const dy = mob.vy * clampedDt;
      const targetY = mob.y + dy;

      if (dy < 0) {
        // Falling: Check feet contact against solid blocks across mob's footprint
        const feetMinX = mob.x - hw + 0.04;
        const feetMaxX = mob.x + hw - 0.04;
        const feetMinZ = mob.z - hw + 0.04;
        const feetMaxZ = mob.z + hw - 0.04;

        if (this.isBoxColliding(feetMinX, targetY, feetMinZ, feetMaxX, targetY + 0.15, feetMaxZ, world)) {
          const floorBlockY = Math.floor(targetY);
          mob.y = floorBlockY + 1.0;
          mob.vy = 0;
        } else {
          mob.y = targetY;
        }
      } else if (dy > 0) {
        // Moving up / Jumping: Check head collision against solid blocks above
        const headMinX = mob.x - hw + 0.04;
        const headMaxX = mob.x + hw - 0.04;
        const headMinZ = mob.z - hw + 0.04;
        const headMaxZ = mob.z + hw - 0.04;

        if (this.isBoxColliding(headMinX, targetY + h - 0.15, headMinZ, headMaxX, targetY + h, headMaxZ, world)) {
          const ceilBlockY = Math.floor(targetY + h);
          mob.y = ceilBlockY - h - eps;
          mob.vy = 0;
        } else {
          mob.y = targetY;
        }
      }

      // Void despawn
      if (mob.y < -10) {
        this.killMob(mob.id);
        continue;
      }

      // Sync 3D Mesh
      mesh.position.set(mob.x, mob.y, mob.z);
      mesh.rotation.y = mob.yaw;

      // Walk cycle leg swinging animation
      const moveSpeed = Math.hypot(mob.vx, mob.vz);
      if (moveSpeed > 0.1) {
        mob.walkCycle += clampedDt * moveSpeed * 5.0;
        const swing = Math.sin(mob.walkCycle) * 0.4;
        mesh.traverse(child => {
          if (child.name === 'leg_0' || child.name === 'leg_3') {
            child.rotation.x = swing;
          } else if (child.name === 'leg_1' || child.name === 'leg_2') {
            child.rotation.x = -swing;
          }
        });
      }
    }

    // 2. Update Dropped Item Pickups
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.droppedItems[i];
      const mesh = this.dropMeshes.get(drop.id);
      if (!mesh) continue;

      drop.lifetime += clampedDt;

      // Magnet attraction towards player if within 2.5 blocks
      const distToPlayer = Math.hypot(playerPos.x - drop.x, playerPos.y - drop.y, playerPos.z - drop.z);
      if (distToPlayer < 2.2 && !drop.itemId.startsWith('void')) {
        const pullSpeed = 6.0;
        drop.vx = ((playerPos.x - drop.x) / distToPlayer) * pullSpeed;
        drop.vy = ((playerPos.y + 0.5 - drop.y) / distToPlayer) * pullSpeed;
        drop.vz = ((playerPos.z - drop.z) / distToPlayer) * pullSpeed;

        if (distToPlayer < 0.8) {
          // Collected!
          onCollectItem(drop.itemId, drop.count);
          sound.playPickup();

          // Remove dropped item
          this.scene.remove(mesh);
          mesh.geometry.dispose();
          this.dropMeshes.delete(drop.id);
          this.droppedItems.splice(i, 1);
          continue;
        }
      } else {
        // Gravity & ground collision
        drop.vy -= 18 * clampedDt;
        drop.vx *= 0.92;
        drop.vz *= 0.92;

        const groundY = Math.floor(drop.y);
        const blockUnder = world.getBlock(Math.floor(drop.x), groundY, Math.floor(drop.z));
        if (isBlockSolid(blockUnder)) {
          drop.y = groundY + 1.15;
          drop.vy = 0;
        }
      }

      drop.x += drop.vx * clampedDt;
      drop.y += drop.vy * clampedDt;
      drop.z += drop.vz * clampedDt;
      drop.rotationY += clampedDt * 2.5;

      mesh.position.set(drop.x, drop.y + Math.sin(drop.lifetime * 4) * 0.06, drop.z);
      mesh.rotation.y = drop.rotationY;

      // Despawn after 5 minutes
      if (drop.lifetime > 300) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        this.dropMeshes.delete(drop.id);
        this.droppedItems.splice(i, 1);
      }
    }
  }

  // Clear all entities (for world reset)
  public clearAll() {
    for (const [, mesh] of this.mobMeshes.entries()) {
      this.scene.remove(mesh);
    }
    this.mobMeshes.clear();
    this.mobs = [];

    for (const [, mesh] of this.dropMeshes.entries()) {
      this.scene.remove(mesh);
    }
    this.dropMeshes.clear();
    this.droppedItems = [];
  }
}
