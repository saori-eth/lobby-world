import { createNPC } from "@shared/humanoidNPC/index.js";

const NPC_MESHES = {
  chest: {
    size: [0.5, 0.6, 0.3],
    color: "#4488cc",
    physics: "kinematic",
    children: [
      { size: [0.44, 0.08, 0.28], position: [0, 0.27, 0], color: "#3377bb" },
      { size: [0.5, 0.06, 0.31], position: [0, -0.28, 0], color: "#664422" },
    ],
  },
  head: {
    size: [0.4, 0.4, 0.4],
    position: [0, 0.25, 0],
    color: "#f0c8a0",
    physics: "kinematic",
    children: [
      {
        size: [0.08, 0.08, 0.05],
        position: [-0.1, 0.05, -0.2],
        color: "#222222",
      },
      {
        size: [0.08, 0.08, 0.05],
        position: [0.1, 0.05, -0.2],
        color: "#222222",
      },
      { size: [0.42, 0.14, 0.42], position: [0, 0.24, 0], color: "#111111" },
      { size: [0.38, 0.04, 0.2], position: [0, 0.19, -0.24], color: "#111111" },
    ],
  },
  upperArm_L: {
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#4488cc",
  },
  lowerArm_L: {
    size: [0.18, 0.26, 0.18],
    position: [0, -0.13, 0],
    color: "#f0c8a0",
  },
  upperArm_R: {
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#4488cc",
  },
  lowerArm_R: {
    size: [0.18, 0.26, 0.18],
    position: [0, -0.13, 0],
    color: "#f0c8a0",
    children: [
      // Sword grip
      {
        size: [0.06, 0.22, 0.06],
        position: [0, -0.24, 0],
        color: "#553311",
      },
      // Sword guard
      {
        size: [0.18, 0.03, 0.06],
        position: [0, -0.14, 0],
        color: "#888888",
      },
      // Sword blade
      {
        size: [0.06, 0.45, 0.02],
        position: [0, -0.5, 0],
        color: "#cccccc",
        emissive: "#cccccc",
        emissiveIntensity: 1,
      },
      // Sword tip
      {
        size: [0.06, 0.06, 0.02],
        position: [0, -0.74, 0],
        color: "#dddddd",
        emissive: "#dddddd",
        emissiveIntensity: 1,
      },
    ],
  },
  upperLeg_L: {
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#555555",
  },
  lowerLeg_L: {
    size: [0.2, 0.27, 0.2],
    position: [0, -0.135, 0],
    color: "#555555",
  },
  foot_L: {
    size: [0.22, 0.08, 0.26],
    position: [0, -0.04, -0.02],
    color: "#332211",
  },
  upperLeg_R: {
    size: [0.2, 0.28, 0.2],
    position: [0, -0.14, 0],
    color: "#555555",
  },
  lowerLeg_R: {
    size: [0.2, 0.27, 0.2],
    position: [0, -0.135, 0],
    color: "#555555",
  },
  foot_R: {
    size: [0.22, 0.08, 0.26],
    position: [0, -0.04, -0.02],
    color: "#332211",
  },
};

export default (world, app, fetch, props, setTimeout) => {
  app.configure([
    { key: "name", type: "text", label: "Name", initial: "NPC" },
    { key: "aggro", type: "switch", label: "Aggro", initial: true },
  ]);

  const block = app.get("Block");
  if (block) block.active = false;

  createNPC(world, app, props, setTimeout, {
    meshes: NPC_MESHES,
    name: app.config.name || "NPC",
    hp: 100,
    maxHp: 100,
    respawnTime: 20,
    damageEvent: "sword-attack",
    attackRange: 2,
    damage: 25,
    maxDistance: 10,
    sendRate: 0.33,
    seed: 1,
    aggro: app.config.aggro !== false,
    attackDamage: 10,
    attackCooldown: 1.5,
    chaseSpeed: 3.5,
    aggroRange: 15,
    aggroAttackRange: 1.8,
  });
};
