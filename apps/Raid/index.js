import { EVENTS } from "@shared/gametype/raid.js";
import { createPlayerHUD } from "@shared/ui/playerHUD.js";

export default (world, app, fetch, props, setTimeout) => {
  if (world.isServer) {
    const maxHp = 100;
    app.state.stats = {};
    app.state.maxHp = maxHp;
    app.state.players = {};
    app.state.ready = true;

    // Respond to pings so NPC bridges know we're active
    world.on(EVENTS.PING, () => {
      console.log("[Raid] received PING, sending PONG");
      app.emit(EVENTS.PONG, {});
    });

    // Announce presence for any NPCs that initialized before us
    console.log("[Raid] announcing PONG on init");
    app.emit(EVENTS.PONG, {});

    // Track player HP on enter/leave
    world.on("enter", (player) => {
      app.state.players[player.id] = { hp: maxHp };
    });

    world.on("leave", (player) => {
      delete app.state.players[player.id];
    });

    // Broker NPC → Player damage
    world.on(EVENTS.NPC_ATTACK, (data) => {
      console.log("[Raid] received NPC_ATTACK", JSON.stringify(data));
      const { npcId, targetPlayerId, damage } = data;
      const player = world.getPlayer(targetPlayerId);
      if (!player) return;

      // Track HP
      if (!app.state.players[targetPlayerId]) {
        app.state.players[targetPlayerId] = { hp: maxHp };
      }
      const pState = app.state.players[targetPlayerId];
      pState.hp = Math.max(0, pState.hp - damage);

      console.log("[Raid] sending player-damaged hp=" + pState.hp);
      app.send("player-damaged", {
        playerId: targetPlayerId,
        hp: pState.hp,
        maxHp,
        damage,
      });

      app.emit(EVENTS.PLAYER_DAMAGED, {
        playerId: targetPlayerId,
        damage,
        sourceId: npcId,
      });

      if (pState.hp <= 0) {
        app.emit("raid:player-died", { playerId: targetPlayerId });
        // Reset HP after death
        pState.hp = maxHp;
      }
    });

    // Track NPC hit stats
    world.on(EVENTS.NPC_HIT, (data) => {
      const { attackerId, damage, dead } = data;
      if (!attackerId) return;

      if (!app.state.stats[attackerId]) {
        app.state.stats[attackerId] = { damageDealt: 0, kills: 0 };
      }
      const stat = app.state.stats[attackerId];
      stat.damageDealt += damage;
      if (dead) {
        stat.kills += 1;
      }
    });

    // Health recovery: +5 HP per second for all players not at full HP
    const regenRate = 5;
    const regenInterval = 1;
    let regenTimer = 0;
    app.on("fixedUpdate", (delta) => {
      regenTimer += delta;
      if (regenTimer < regenInterval) return;
      regenTimer -= regenInterval;
      for (const id in app.state.players) {
        const pState = app.state.players[id];
        if (pState.hp > 0 && pState.hp < maxHp) {
          pState.hp = Math.min(maxHp, pState.hp + regenRate);
          app.send("player-damaged", {
            playerId: id,
            hp: pState.hp,
            maxHp,
            damage: 0,
          });
        }
      }
    });

    app.send("init", app.state);
  }

  if (world.isClient) {
    if (app.state.ready) {
      init(app.state);
    } else {
      app.on("init", init);
    }

    function init(state) {
      const hud = createPlayerHUD(app, {
        hp: state.maxHp,
        maxHp: state.maxHp,
      });

      app.on("player-damaged", (data) => {
        console.log("[Raid][client] player-damaged", JSON.stringify(data));
        const localPlayer = world.getPlayer();
        if (!localPlayer || data.playerId !== localPlayer.id) return;
        hud.update(data.hp, data.maxHp);
      });

      app.on("destroy", () => {
        hud.destroy();
      });
    }
  }
};
