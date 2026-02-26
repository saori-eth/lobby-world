import { createNPC } from "@shared/humanoidNPC/index.js";
import { generateStyle } from "@shared/humanoidNPC/styles.js";

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export default (world, app, fetch, props, setTimeout) => {
  app.configure([
    { key: "name", type: "text", label: "Name", initial: "NPC" },
    { key: "aggro", type: "switch", label: "Aggro", initial: true },
    { key: "emissiveColor", type: "color", label: "Neon Color", initial: "#00e5ff" },
    {
      key: "emissiveIntensity",
      type: "number",
      label: "Weapon Glow",
      dp: 2,
      min: 0,
      max: 20,
      step: 0.1,
      initial: 2.8,
    },
    {
      key: "eyeEmissiveIntensity",
      type: "number",
      label: "Eye Glow",
      dp: 2,
      min: 0,
      max: 20,
      step: 0.1,
      initial: 4.5,
    },
    {
      key: "trimEmissiveIntensity",
      type: "number",
      label: "Trim Glow",
      dp: 2,
      min: 0,
      max: 20,
      step: 0.1,
      initial: 1.8,
    },
  ]);

  const block = app.get("Block");
  if (block) block.active = false;

  const seed = hashString(app.instanceId || "default");
  const rng = prng(seed);
  const meshes = generateStyle(rng, {
    emissiveColor: app.config.emissiveColor,
    emissiveIntensity: app.config.emissiveIntensity,
    eyeEmissiveIntensity: app.config.eyeEmissiveIntensity,
    trimEmissiveIntensity: app.config.trimEmissiveIntensity,
  });

  createNPC(world, app, props, setTimeout, {
    meshes,
    name: app.config.name || "NPC",
    hp: 100,
    maxHp: 100,
    respawnTime: 20,
    attackRange: 2,
    damage: 25,
    maxDistance: 10,
    sendRate: 0.33,
    seed,
    aggro: app.config.aggro !== false,
    attackDamage: 10,
    attackCooldown: 1.5,
    chaseSpeed: 3.5,
    aggroRange: 15,
    aggroAttackRange: 1.8,
    hitbox: "box",
  });
};
