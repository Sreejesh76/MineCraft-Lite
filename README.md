# ⛏️ Minecraft Lite

**Minecraft Lite** is a browser-based 3D voxel sandbox game inspired by block-building, exploration, survival, creatures, and pet interaction.

The project focuses on delivering a lightweight Minecraft-style experience directly in the browser, with procedural voxel terrain, custom player physics, creatures, combat, and controllable pets.

## 🎮 Features

### 🌍 3D Voxel World

* Procedurally generated voxel terrain
* Explore hills, caves, grasslands, and other environments
* Block-based world
* Interact with the environment
* First-person 3D gameplay

### 🧍 Player Controls

* WASD movement
* Arrow-key movement
* Mouse camera controls
* Jumping
* On-screen D-Pad
* Responsive movement
* Smooth collision detection
* Automatic one-block step assistance
* Anti-stuck protection

### 🐾 Creatures

The game features multiple creatures with unique behaviors and sounds:

* 🧟 Zombie
* 🕷️ Spider
* 🦖 Dinosaur / T-Rex
* 🐗 Boar
* 🐑 Sheep
* 🪨 Golem
* 👹 Shadow Crawler
* 🐕 Buddy — the pet dog

Creatures can wander, interact with the player, attack, receive damage, and react when defeated.

### 🐕 Pet System

**Buddy**, the friendly dog companion, can accompany the player through the world.

* Friendly companion behavior
* Following system
* Pet interaction
* Pet control using `Ctrl`
* Defensive behavior
* Unique dog sounds

### ⚔️ Combat

* Creature interaction and combat
* Creature damage detection
* Hurt reactions
* Death reactions
* Creature-specific combat behavior

### 🔊 Creature-Only Sound System

Minecraft Lite uses a dedicated **creature audio system**.

Creatures have their own procedural sounds, including:

* Idle sounds
* Attack sounds
* Hurt sounds
* Death sounds
* Creature-specific vocalizations

**No player movement sounds and no background music are included.**

This keeps the audio experience focused entirely on creatures.

### 🧱 Custom Physics

Minecraft Lite uses custom voxel collision and movement physics featuring:

* AABB collision detection
* Direction-aware collision resolution
* Terrain collision
* One-block step assistance
* Player unstuck protection
* Creature collision handling

## 🎛️ Controls

| Key / Input  | Action             |
| ------------ | ------------------ |
| `W`          | Move Forward       |
| `S`          | Move Backward      |
| `A`          | Move Left          |
| `D`          | Move Right         |
| `↑ ↓ ← →`    | Movement           |
| `Mouse`      | Look Around        |
| `Space`      | Jump               |
| `E`          | Inventory          |
| `Esc`        | Pause              |
| `Ctrl`       | Control Pet        |
| `D-Pad`      | On-screen Movement |
| `🔄 Unstick` | Recover if stuck   |

## 🛠️ Technology

Minecraft Lite is built using modern web technologies:

* **React**
* **TypeScript**
* **3D/WebGL rendering**
* **Procedural voxel generation**
* **Custom game physics**
* **Procedural audio generation**
* **Browser Pointer Lock API**

## 📂 Project Structure

```text
Minecraft-Lite/
├── src/
│   ├── engine/
│   │   ├── entities.ts
│   │   └── player.ts
│   │
│   ├── components/
│   │   └── PauseMenu.tsx
│   │
│   ├── utils/
│   │   └── audio.ts
│   │
│   └── App.tsx
│
├── public/
├── package.json
└── README.md
```

## 🚀 Getting Started

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/minecraft-lite.git
cd minecraft-lite
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal to start playing.

## 🗺️ Gameplay

In Minecraft Lite, players can:

1. Enter a procedurally generated voxel world.
2. Explore different environments.
3. Move around using keyboard or on-screen controls.
4. Discover different creatures.
5. Fight hostile creatures.
6. Hear unique creature sounds.
7. Find and interact with friendly pets.
8. Control Buddy using `Ctrl`.
9. Explore caves and terrain.
10. Recover from unexpected movement/collision issues using the Unstick button.

## 🔮 Future Plans

* 🌲 More biomes
* 🧱 More blocks
* 🐺 Additional pets
* 👾 More creatures
* ⚔️ Weapons and tools
* 🎒 Expanded inventory
* 🏠 Building system
* 🌊 Water mechanics
* 🌙 Day/night cycle
* 💾 World saving
* 🌐 Multiplayer
* 📱 Improved mobile controls
* 🧠 Advanced creature AI

## 📌 Project Status

**🚧 In Development**

Minecraft Lite is an experimental browser-based voxel sandbox project focused on exploration, creatures, custom physics, pet interaction, and lightweight gameplay.

## ⚠️ Disclaimer

Minecraft Lite is an independent fan-made project inspired by voxel sandbox games. It is not affiliated with or endorsed by Mojang Studios or Microsoft.

## 📄 License

Add your preferred open-source license before publishing the repository.

---

# ⛏️ Minecraft Lite

> **Explore. Build. Survive. Befriend.**

A lightweight browser-based voxel sandbox bringing exploration, creatures, combat, pets, and procedural gameplay together in one game.
