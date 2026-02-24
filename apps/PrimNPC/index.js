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
  ]);

  const block = app.get("Block");
  if (block) block.active = false;

  const seed = hashString(app.instanceId || "default");
  const rng = prng(seed);
  const meshes = generateStyle(rng);

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
