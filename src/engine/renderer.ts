import * as THREE from 'three';
import { BlockType } from '../types/game';
import { atlasManager } from './atlas';
import { ITEM_REGISTRY } from './items';

export class GameRenderer {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  // Lighting & Day/Night
  public sunLight: THREE.DirectionalLight;
  public moonLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public sunMesh: THREE.Mesh;
  public moonMesh: THREE.Mesh;
  public skyColor: THREE.Color = new THREE.Color(0x78b5e8);
  public fog: THREE.Fog;

  // Day/Night time (0 to 1, where 0.25 = noon, 0.75 = midnight)
  public timeOfDay: number = 0.2; // starts in bright morning
  public dayLengthSeconds: number = 600; // 10 minutes per full day

  // Target Highlight Wireframe Box
  public targetBox: THREE.LineSegments;

  // First-person held item rig
  public heldItemAnchor: THREE.Group;
  public heldItemMesh: THREE.Mesh | null = null;
  public swingProgress: number = 1.0; // 1.0 = idle, 0.0 to 1.0 = swinging

  // Particle debris system
  public particleGroup: THREE.Group;
  private particles: {
    mesh: THREE.Mesh;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }[] = [];

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // Fog
    this.fog = new THREE.Fog(0x7ec0ee, 40, 160);
    this.scene.fog = this.fog;

    // Ambient light (warm and bright)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    // Directional Sun light
    this.sunLight = new THREE.DirectionalLight(0xfff6e6, 1.3);
    this.sunLight.position.set(50, 100, 50);
    this.scene.add(this.sunLight);

    // Celestial Sun mesh
    const sunGeom = new THREE.BoxGeometry(14, 14, 14);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.sunMesh = new THREE.Mesh(sunGeom, sunMat);
    this.scene.add(this.sunMesh);

    // Celestial Moon
    this.moonLight = new THREE.DirectionalLight(0x5c7cb0, 0.2);
    this.scene.add(this.moonLight);

    const moonGeom = new THREE.BoxGeometry(10, 10, 10);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe6e6f5 });
    this.moonMesh = new THREE.Mesh(moonGeom, moonMat);
    this.scene.add(this.moonMesh);

    // Target Selection Outline Box
    const boxGeom = new THREE.BoxGeometry(1.005, 1.005, 1.005);
    const edges = new THREE.EdgesGeometry(boxGeom);
    this.targetBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x111111, linewidth: 2 })
    );
    this.targetBox.visible = false;
    this.scene.add(this.targetBox);

    // First person held item attached to camera
    this.heldItemAnchor = new THREE.Group();
    this.heldItemAnchor.position.set(0.38, -0.32, -0.6);
    this.camera.add(this.heldItemAnchor);
    this.scene.add(this.camera);

    // Particles group
    this.particleGroup = new THREE.Group();
    this.scene.add(this.particleGroup);

    // Window resize handler
    window.addEventListener('resize', this.onWindowResize);
  }

  private onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  public setFov(fov: number) {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  public triggerSwing() {
    this.swingProgress = 0.0;
  }

  // Update held item 3D visual in hand
  public updateHeldItem(itemId: string | null) {
    // Clear old held item
    while (this.heldItemAnchor.children.length > 0) {
      const child = this.heldItemAnchor.children[0];
      this.heldItemAnchor.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    if (!itemId) {
      // Default: Bare fist / hand
      const armGeom = new THREE.BoxGeometry(0.18, 0.45, 0.18);
      const armMat = new THREE.MeshLambertMaterial({ color: 0xd4a373 });
      const fist = new THREE.Mesh(armGeom, armMat);
      fist.rotation.set(-0.3, 0.4, -0.2);
      this.heldItemAnchor.add(fist);
      return;
    }

    const itemDef = ITEM_REGISTRY[itemId];
    if (!itemDef) return;

    if (itemDef.type === 'block' && itemDef.blockId) {
      // Small 3D Voxel Block held in hand
      const blockGeom = new THREE.BoxGeometry(0.24, 0.24, 0.24);
      const blockMat = atlasManager.opaqueMaterial;
      const blockMesh = new THREE.Mesh(blockGeom, blockMat);
      blockMesh.rotation.set(0.2, 0.5, 0.1);
      this.heldItemAnchor.add(blockMesh);
    } else if (itemDef.type.startsWith('tool_')) {
      // Tool model (Handle + Head)
      const toolGroup = new THREE.Group();

      // Handle stick
      const handleGeom = new THREE.BoxGeometry(0.04, 0.5, 0.04);
      const handleMat = new THREE.MeshLambertMaterial({ color: 0x825a33 });
      const handle = new THREE.Mesh(handleGeom, handleMat);
      toolGroup.add(handle);

      // Head color based on tier
      let headColor = 0x8a6538;
      if (itemDef.tier === 'stone') headColor = 0x808080;
      if (itemDef.tier === 'iron') headColor = 0xd4d8dc;
      if (itemDef.tier === 'diamond') headColor = 0x00e5ff;

      const headMat = new THREE.MeshLambertMaterial({ color: headColor });

      if (itemDef.type === 'tool_pickaxe') {
        const headGeom = new THREE.BoxGeometry(0.3, 0.08, 0.08);
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 0.24;
        toolGroup.add(head);
      } else if (itemDef.type === 'tool_sword') {
        const bladeGeom = new THREE.BoxGeometry(0.08, 0.45, 0.03);
        const blade = new THREE.Mesh(bladeGeom, headMat);
        blade.position.y = 0.35;
        toolGroup.add(blade);
        // Guard
        const guardGeom = new THREE.BoxGeometry(0.18, 0.04, 0.05);
        const guard = new THREE.Mesh(guardGeom, handleMat);
        guard.position.y = 0.12;
        toolGroup.add(guard);
      } else if (itemDef.type === 'tool_axe') {
        const axeGeom = new THREE.BoxGeometry(0.18, 0.18, 0.06);
        const axe = new THREE.Mesh(axeGeom, headMat);
        axe.position.set(0.07, 0.2, 0);
        toolGroup.add(axe);
      } else {
        // Shovel
        const shovelGeom = new THREE.BoxGeometry(0.12, 0.16, 0.03);
        const shovel = new THREE.Mesh(shovelGeom, headMat);
        shovel.position.y = 0.28;
        toolGroup.add(shovel);
      }

      toolGroup.rotation.set(-0.4, 0.3, -0.3);
      this.heldItemAnchor.add(toolGroup);
    } else {
      // General item / food
      const itemGeom = new THREE.BoxGeometry(0.16, 0.16, 0.16);
      const itemMat = new THREE.MeshLambertMaterial({
        color: itemDef.iconColor ? parseInt(itemDef.iconColor.replace('#', '0x'), 16) : 0xffffff,
      });
      const mesh = new THREE.Mesh(itemGeom, itemMat);
      mesh.rotation.set(0.2, 0.4, 0.1);
      this.heldItemAnchor.add(mesh);
    }
  }

  // Spawn Block Break Debris
  public spawnBreakParticles(worldX: number, worldY: number, worldZ: number, block: BlockType) {
    let color = 0x7a7a7a;
    if (block === BlockType.GRASS) color = 0x5b9e31;
    else if (block === BlockType.DIRT) color = 0x614126;
    else if (block === BlockType.WOOD) color = 0x573d23;
    else if (block === BlockType.LEAVES) color = 0x2a6a21;
    else if (block === BlockType.SAND) color = 0xdfd193;
    else if (block === BlockType.COAL_ORE) color = 0x222222;
    else if (block === BlockType.DIAMOND_ORE) color = 0x1adcd0;

    const particleGeom = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const particleMat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(particleGeom, particleMat);
      mesh.position.set(
        worldX + 0.5 + (Math.random() - 0.5) * 0.6,
        worldY + 0.5 + (Math.random() - 0.5) * 0.6,
        worldZ + 0.5 + (Math.random() - 0.5) * 0.6
      );

      this.particleGroup.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4.5,
        vy: 2.0 + Math.random() * 3.5,
        vz: (Math.random() - 0.5) * 4.5,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
      });
    }
  }

  // Update loop
  public update(dt: number, playerPos: THREE.Vector3, isUnderwater: boolean, speedMultiplier: number = 1.0) {
    const clampedDt = Math.min(0.08, dt);

    // 1. Day / Night Cycle progression
    if (speedMultiplier > 0) {
      this.timeOfDay = (this.timeOfDay + (clampedDt / this.dayLengthSeconds) * speedMultiplier) % 1.0;
    }

    const angle = this.timeOfDay * Math.PI * 2;
    const sunDist = 180;
    const sunX = Math.cos(angle) * sunDist + playerPos.x;
    const sunY = Math.sin(angle) * sunDist;
    const sunZ = Math.sin(angle * 0.5) * 40 + playerPos.z;

    this.sunMesh.position.set(sunX, sunY, sunZ);
    this.sunLight.position.set(sunX, sunY, sunZ);

    this.moonMesh.position.set(-sunX + 2 * playerPos.x, -sunY, -sunZ + 2 * playerPos.z);
    this.moonLight.position.set(-sunX + 2 * playerPos.x, -sunY, -sunZ + 2 * playerPos.z);

    // Sky colors interpolation based on sun elevation (sin(angle))
    const sunHeight = Math.sin(angle); // 1 = noon, -1 = midnight

    if (isUnderwater) {
      // Underwater murky azure fog
      this.renderer.setClearColor(0x133857);
      this.fog.color.setHex(0x133857);
      this.fog.near = 1;
      this.fog.far = 16;
      this.ambientLight.intensity = 0.4;
      this.sunLight.intensity = 0.3;
    } else {
      this.fog.near = 40;
      this.fog.far = 130;

      if (sunHeight > 0.2) {
        // Full Day
        this.skyColor.setHex(0x7ec0ee);
        this.renderer.setClearColor(this.skyColor);
        this.fog.color.copy(this.skyColor);
        this.ambientLight.intensity = 0.65;
        this.sunLight.intensity = 1.25;
        this.sunLight.color.setHex(0xfff6de);
      } else if (sunHeight > -0.15) {
        // Sunrise / Sunset transition
        this.skyColor.setHex(0xd47348);
        this.renderer.setClearColor(this.skyColor);
        this.fog.color.copy(this.skyColor);
        this.ambientLight.intensity = 0.4;
        this.sunLight.intensity = 0.7;
        this.sunLight.color.setHex(0xff8c42);
      } else {
        // Night
        this.skyColor.setHex(0x0c1022);
        this.renderer.setClearColor(this.skyColor);
        this.fog.color.copy(this.skyColor);
        this.ambientLight.intensity = 0.18;
        this.sunLight.intensity = 0.05;
        this.moonLight.intensity = 0.35;
      }
    }

    // 2. Held Item Swing Animation
    if (this.swingProgress < 1.0) {
      this.swingProgress += clampedDt * 5.5;
      const t = Math.min(1.0, this.swingProgress);
      // Sine swing arc
      const swingArc = Math.sin(t * Math.PI);
      this.heldItemAnchor.position.set(
        0.38 - swingArc * 0.15,
        -0.32 - swingArc * 0.1,
        -0.6 - swingArc * 0.12
      );
      this.heldItemAnchor.rotation.x = -swingArc * 0.9;
      this.heldItemAnchor.rotation.y = swingArc * 0.6;
    } else {
      // Idle gentle bobbing
      const idleBob = Math.sin(performance.now() * 0.003) * 0.012;
      this.heldItemAnchor.position.set(0.38, -0.32 + idleBob, -0.6);
      this.heldItemAnchor.rotation.set(0, 0, 0);
    }

    // 3. Debris Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += clampedDt;
      p.vy -= 18 * clampedDt;

      p.mesh.position.x += p.vx * clampedDt;
      p.mesh.position.y += p.vy * clampedDt;
      p.mesh.position.z += p.vz * clampedDt;

      const scale = Math.max(0.01, 1 - p.life / p.maxLife);
      p.mesh.scale.set(scale, scale, scale);

      if (p.life >= p.maxLife) {
        this.particleGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      }
    }

    // 4. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
