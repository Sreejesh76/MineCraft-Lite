import * as THREE from 'three';
import { BlockType, InventorySlot, PlayerStats } from '../types/game';
import { isBlockSolid, SEA_LEVEL, WorldManager } from './world';
import { sound } from '../utils/audio';

export interface PlayerInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sneak: boolean;
  sprint: boolean;
}

export class Player {
  public position: THREE.Vector3 = new THREE.Vector3(0, 32, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public camera: THREE.PerspectiveCamera;

  // Rotation angles
  public yaw: number = 0;
  public pitch: number = 0;

  // Collision box
  public width: number = 0.55;
  public height: number = 1.75;
  public eyeHeight: number = 1.58;

  // State flags
  public onGround: boolean = false;
  public inWater: boolean = false;
  public isUnderwater: boolean = false;
  public isSprinting: boolean = false;
  public isFlying: boolean = false;

  // Survival stats
  public stats: PlayerStats = {
    health: 20,
    maxHealth: 20,
    hunger: 20,
    maxHunger: 20,
    air: 20,
    maxAir: 20,
    isDead: false,
    score: 0,
    gameMode: 'survival',
  };

  // Timers
  private regenTimer: number = 0;
  private starveTimer: number = 0;
  private drownTimer: number = 0;
  private footstepTimer: number = 0;
  private lastJumpTapTime: number = 0;
  private previousFallVelocity: number = 0;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.camera.position.copy(this.position);
    this.camera.position.y += this.eyeHeight;
  }

  public setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.updateCamera();
  }

  public updateRotation(deltaX: number, deltaY: number, sensitivity: number = 0.0022) {
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;

    // Clamp pitch
    const maxPitch = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

    this.updateCamera();
  }

  public updateCamera() {
    this.camera.position.x = this.position.x;
    this.camera.position.y = this.position.y + this.eyeHeight;
    this.camera.position.z = this.position.z;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  public getForwardVector(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
  }

  public getRightVector(): THREE.Vector3 {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }

  public getLookDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }

  public toggleFlight() {
    this.isFlying = !this.isFlying;
    this.velocity.set(0, 0, 0);
  }

  public handleJumpTap() {
    const now = performance.now();
    if (now - this.lastJumpTapTime < 300) {
      // Double tap jump
      this.toggleFlight();
    }
    this.lastJumpTapTime = now;
  }

  public takeDamage(amount: number, sourceName: string = 'damage') {
    if (this.stats.gameMode === 'creative' || this.stats.isDead) return;

    this.stats.health = Math.max(0, this.stats.health - amount);
    sound.playHit();

    if (this.stats.health <= 0) {
      this.stats.isDead = true;
    }
  }

  public heal(amount: number) {
    if (this.stats.isDead) return;
    this.stats.health = Math.min(this.stats.maxHealth, this.stats.health + amount);
  }

  public feed(amount: number) {
    this.stats.hunger = Math.min(this.stats.maxHunger, this.stats.hunger + amount);
  }

  public respawn(spawnX: number, spawnY: number, spawnZ: number) {
    this.stats.health = this.stats.maxHealth;
    this.stats.hunger = this.stats.maxHunger;
    this.stats.air = this.stats.maxAir;
    this.stats.isDead = false;
    this.setPosition(spawnX, spawnY, spawnZ);
  }

  // Update physics, collision, and survival stats
  public update(dt: number, input: PlayerInput, world: WorldManager) {
    if (this.stats.isDead) return;

    const clampedDt = Math.min(0.08, Math.max(0.001, dt));

    // Check water environment
    const feetBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + 0.1), Math.floor(this.position.z));
    const headBlock = world.getBlock(Math.floor(this.position.x), Math.floor(this.position.y + this.eyeHeight), Math.floor(this.position.z));

    this.inWater = feetBlock === BlockType.WATER || headBlock === BlockType.WATER;
    this.isUnderwater = headBlock === BlockType.WATER;

    // Flight mode movement
    if (this.isFlying) {
      const flySpeed = input.sprint ? 24 : 12;
      const fwd = this.getForwardVector();
      const right = this.getRightVector();

      const moveDir = new THREE.Vector3();
      if (input.forward) moveDir.add(fwd);
      if (input.backward) moveDir.sub(fwd);
      if (input.right) moveDir.add(right);
      if (input.left) moveDir.sub(right);

      if (moveDir.lengthSq() > 0) moveDir.normalize().multiplyScalar(flySpeed);

      let flyY = 0;
      if (input.jump) flyY += flySpeed;
      if (input.sneak) flyY -= flySpeed;

      this.position.x += moveDir.x * clampedDt;
      this.position.y += flyY * clampedDt;
      this.position.z += moveDir.z * clampedDt;
      this.velocity.set(0, 0, 0);
      this.updateCamera();
      return;
    }

    // Directional vectors
    const fwd = this.getForwardVector();
    const right = this.getRightVector();

    let moveX = 0;
    let moveZ = 0;
    if (input.forward) { moveX += fwd.x; moveZ += fwd.z; }
    if (input.backward) { moveX -= fwd.x; moveZ -= fwd.z; }
    if (input.right) { moveX += right.x; moveZ += right.z; }
    if (input.left) { moveX -= right.x; moveZ -= right.z; }

    const inputLen = Math.hypot(moveX, moveZ);
    if (inputLen > 0) {
      moveX /= inputLen;
      moveZ /= inputLen;
    }

    // Determine target speed
    this.isSprinting = input.sprint && input.forward && this.stats.hunger > 6;
    let targetSpeed = 4.3;
    if (this.isSprinting) targetSpeed = 6.8;
    if (input.sneak) targetSpeed = 2.2;
    if (this.inWater) targetSpeed = 2.8;

    const accel = this.onGround ? 65 : 18;

    // Apply horizontal acceleration
    if (inputLen > 0) {
      this.velocity.x += (moveX * targetSpeed - this.velocity.x) * Math.min(1.0, accel * clampedDt);
      this.velocity.z += (moveZ * targetSpeed - this.velocity.z) * Math.min(1.0, accel * clampedDt);
    } else {
      // Crisp stopping when keys are released
      const stopFactor = Math.min(1.0, (this.onGround ? 32.0 : 16.0) * clampedDt);
      this.velocity.x += (0 - this.velocity.x) * stopFactor;
      this.velocity.z += (0 - this.velocity.z) * stopFactor;
      if (Math.abs(this.velocity.x) < 0.02) this.velocity.x = 0;
      if (Math.abs(this.velocity.z) < 0.02) this.velocity.z = 0;
    }

    // Vertical physics & Gravity
    if (this.inWater) {
      // Water buoyancy & swim
      this.velocity.y -= 7.0 * clampedDt;
      this.velocity.y *= Math.max(0, 1 - 4.5 * clampedDt);
      if (input.jump) {
        this.velocity.y = 3.5;
      }
    } else {
      // Normal air gravity
      this.velocity.y -= 28.0 * clampedDt;
      // Jump
      if (input.jump && this.onGround) {
        this.velocity.y = 8.5;
        this.onGround = false;
      }
    }

    // Store vertical velocity before collision for fall damage calculation
    this.previousFallVelocity = this.velocity.y;

    // Collision Detection and Resolution (AABB vs Voxel Grid)
    this.moveWithCollision(clampedDt, world);

    // Fall damage calculation on landing (no movement sounds per user instruction)
    if (this.onGround && this.previousFallVelocity < -13.0 && !this.inWater) {
      const damage = Math.floor((Math.abs(this.previousFallVelocity) - 12.0) * 1.6);
      if (damage > 0) {
        this.takeDamage(damage, 'fall');
      }
    }

    // Footsteps are disabled (creature sounds only, no movement sounds)

    // Underwater Air Drowning Mechanics
    if (this.isUnderwater) {
      this.stats.air = Math.max(0, this.stats.air - clampedDt * 3.5);
      if (this.stats.air <= 0) {
        this.drownTimer += clampedDt;
        if (this.drownTimer > 1.4) {
          this.drownTimer = 0;
          this.takeDamage(2, 'drowning');
        }
      }
    } else {
      this.stats.air = Math.min(this.stats.maxAir, this.stats.air + clampedDt * 10);
      this.drownTimer = 0;
    }

    // Hunger and Natural Regeneration Mechanics
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.stats.gameMode === 'survival') {
      if (this.isSprinting) {
        this.stats.hunger = Math.max(0, this.stats.hunger - clampedDt * 0.15);
      } else if (horizSpeed > 0.5) {
        this.stats.hunger = Math.max(0, this.stats.hunger - clampedDt * 0.03);
      }

      // Regeneration if hunger is high
      if (this.stats.hunger >= 17 && this.stats.health < this.stats.maxHealth) {
        this.regenTimer += clampedDt;
        if (this.regenTimer > 4.0) {
          this.regenTimer = 0;
          this.heal(1);
          this.stats.hunger = Math.max(0, this.stats.hunger - 0.5);
        }
      } else {
        this.regenTimer = 0;
      }

      // Starvation damage if hunger reaches zero
      if (this.stats.hunger <= 0) {
        this.starveTimer += clampedDt;
        if (this.starveTimer > 3.0) {
          this.starveTimer = 0;
          this.takeDamage(1, 'starvation');
        }
      } else {
        this.starveTimer = 0;
      }
    }

    // World Void Kill
    if (this.position.y < -15) {
      this.takeDamage(20, 'void');
    }

    this.updateCamera();
  }

  // Helper to check if an axis-aligned bounding box intersects any solid block in the world
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

  // 3-axis AABB collision resolution with step-up assist and unstuck safety
  private moveWithCollision(dt: number, world: WorldManager) {
    const hw = 0.28; // Half-width
    const h = 1.76;  // Height
    const eps = 0.001;

    // 0. Unstuck recovery: if player is trapped inside a solid block, nudge upward if clearance exists
    if (this.isBoxColliding(this.position.x - 0.18, this.position.y + 0.15, this.position.z - 0.18, this.position.x + 0.18, this.position.y + 0.8, this.position.z + 0.18, world)) {
      const candY = Math.ceil(this.position.y) + 0.02;
      if (!this.isBoxColliding(this.position.x - 0.2, candY + 0.2, this.position.z - 0.2, this.position.x + 0.2, candY + h, this.position.z + 0.2, world)) {
        this.position.y = candY;
        this.velocity.y = 0;
      }
    }

    // 1. Move X
    if (Math.abs(this.velocity.x) > 0.0001) {
      const dx = this.velocity.x * dt;
      const targetX = this.position.x + dx;
      const footY = this.position.y + 0.12;
      const headY = this.position.y + h - 0.05;

      const collidesAtCurrentY = this.isBoxColliding(
        targetX - hw, footY, this.position.z - hw,
        targetX + hw, headY, this.position.z + hw,
        world
      );

      if (!collidesAtCurrentY) {
        this.position.x = targetX;
      } else {
        // Step-assist: check if stepping up 1 block lets us walk forward
        let stepped = false;
        if (this.onGround) {
          const stepY = Math.floor(this.position.y) + 1.0;
          const clearAboveHead = !this.isBoxColliding(
            this.position.x - hw, this.position.y + 0.5, this.position.z - hw,
            this.position.x + hw, stepY + h, this.position.z + hw,
            world
          );
          const clearAtStepTarget = !this.isBoxColliding(
            targetX - hw, stepY + 0.05, this.position.z - hw,
            targetX + hw, stepY + h, this.position.z + hw,
            world
          );

          if (clearAboveHead && clearAtStepTarget) {
            this.position.y = stepY;
            this.position.x = targetX;
            stepped = true;
          }
        }

        if (!stepped) {
          if (dx > 0) {
            const wallX = Math.floor(targetX + hw);
            this.position.x = wallX - hw - eps;
          } else {
            const wallX = Math.floor(targetX - hw);
            this.position.x = wallX + 1 + hw + eps;
          }
          this.velocity.x = 0;
        }
      }
    }

    // 2. Move Z
    if (Math.abs(this.velocity.z) > 0.0001) {
      const dz = this.velocity.z * dt;
      const targetZ = this.position.z + dz;
      const footY = this.position.y + 0.12;
      const headY = this.position.y + h - 0.05;

      const collidesAtCurrentY = this.isBoxColliding(
        this.position.x - hw, footY, targetZ - hw,
        this.position.x + hw, headY, targetZ + hw,
        world
      );

      if (!collidesAtCurrentY) {
        this.position.z = targetZ;
      } else {
        // Step-assist: check if stepping up 1 block lets us walk forward
        let stepped = false;
        if (this.onGround) {
          const stepY = Math.floor(this.position.y) + 1.0;
          const clearAboveHead = !this.isBoxColliding(
            this.position.x - hw, this.position.y + 0.5, this.position.z - hw,
            this.position.x + hw, stepY + h, this.position.z + hw,
            world
          );
          const clearAtStepTarget = !this.isBoxColliding(
            this.position.x - hw, stepY + 0.05, targetZ - hw,
            this.position.x + hw, stepY + h, targetZ + hw,
            world
          );

          if (clearAboveHead && clearAtStepTarget) {
            this.position.y = stepY;
            this.position.z = targetZ;
            stepped = true;
          }
        }

        if (!stepped) {
          if (dz > 0) {
            const wallZ = Math.floor(targetZ + hw);
            this.position.z = wallZ - hw - eps;
          } else {
            const wallZ = Math.floor(targetZ - hw);
            this.position.z = wallZ + 1 + hw + eps;
          }
          this.velocity.z = 0;
        }
      }
    }

    // 3. Move Y (Vertical & Gravity)
    this.onGround = false;
    const dy = this.velocity.y * dt;
    const targetY = this.position.y + dy;

    if (dy < 0) {
      // Falling: check feet collision
      const feetMinX = this.position.x - hw + 0.04;
      const feetMaxX = this.position.x + hw - 0.04;
      const feetMinZ = this.position.z - hw + 0.04;
      const feetMaxZ = this.position.z + hw - 0.04;

      if (this.isBoxColliding(feetMinX, targetY, feetMinZ, feetMaxX, targetY + 0.15, feetMaxZ, world)) {
        const floorBlockY = Math.floor(targetY);
        this.position.y = floorBlockY + 1.0;
        this.velocity.y = 0;
        this.onGround = true;
      } else {
        this.position.y = targetY;
      }
    } else if (dy > 0) {
      // Jumping / moving up: check ceiling collision
      const headMinX = this.position.x - hw + 0.04;
      const headMaxX = this.position.x + hw - 0.04;
      const headMinZ = this.position.z - hw + 0.04;
      const headMaxZ = this.position.z + hw - 0.04;

      if (this.isBoxColliding(headMinX, targetY + h - 0.15, headMinZ, headMaxX, targetY + h, headMaxZ, world)) {
        const ceilBlockY = Math.floor(targetY + h);
        this.position.y = ceilBlockY - h - eps;
        this.velocity.y = 0;
      } else {
        this.position.y = targetY;
      }
    }
  }
}
