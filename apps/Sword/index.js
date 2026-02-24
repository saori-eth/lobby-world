import { createMeleeWeapon } from "@shared/meleeWeapon/index.js";

export default (world, app, fetch, props, setTimeout) => {
  app.configure([
    {
      key: "attackEmote",
      type: "file",
      kind: "emote",
      label: "Attack Emote",
    },
  ]);

  const block = app.get("Block");
  if (block) block.active = false;

  createMeleeWeapon(world, app, props, setTimeout, {
    buildWeapon: (app) => {
      const sword = app.create("group");

      const blade = app.create("prim", {
        type: "box",
        size: [0.06, 0.7, 0.04],
        position: [0, 0.55, 0],
        color: "#ccccdd",
      });

      const tip = app.create("prim", {
        type: "box",
        size: [0.04, 0.12, 0.03],
        position: [0, 0.96, 0],
        color: "#ccccdd",
      });

      const guard = app.create("prim", {
        type: "box",
        size: [0.22, 0.04, 0.06],
        position: [0, 0.2, 0],
        color: "#8B7333",
      });

      const grip = app.create("prim", {
        type: "box",
        size: [0.05, 0.2, 0.05],
        position: [0, 0.08, 0],
        color: "#442211",
      });

      const pommel = app.create("prim", {
        type: "box",
        size: [0.07, 0.05, 0.05],
        position: [0, -0.04, 0],
        color: "#8B7333",
      });

      sword.add(blade);
      sword.add(tip);
      sword.add(guard);
      sword.add(grip);
      sword.add(pommel);

      return sword;
    },

    reticle: {
      color: "#ccccdd",
      opacity: 0.85,
      layers: [
        { shape: "line", length: 5, gap: 3, angle: 0, thickness: 1.5 },
        { shape: "line", length: 5, gap: 3, angle: 180, thickness: 1.5 },
        {
          shape: "line",
          length: 5,
          gap: 2,
          angle: 90,
          thickness: 2,
          color: "#8B7333",
        },
        {
          shape: "line",
          length: 5,
          gap: 2,
          angle: 270,
          thickness: 2,
          color: "#8B7333",
        },
        { shape: "dot", radius: 1.5, color: "#8B7333" },
      ],
    },

    attack: {
      button: "mouseLeft",
      eventName: "sword-attack",
      networkEvent: "attack",
      emoteKey: "attackEmote",
      duration: 1,
      cancellable: false,
      turn: true,
      spreadKick: 16,
      spreadDecayRate: 30,
    },

    bone: "rightHand",
    offsetRotation: [-90, 0, 0],
    offsetPosition: [0.1, 0, 0],
  });
};
