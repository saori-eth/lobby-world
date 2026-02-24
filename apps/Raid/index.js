import { EVENTS } from "@shared/gametype/raid.js";

export default (world, app, fetch, props, setTimeout) => {
  if (world.isServer) {
    app.state.stats = {};
    app.state.ready = true;

    // Respond to pings so NPC bridges know we're active
    world.on(EVENTS.PING, () => {
      world.emit(EVENTS.PONG, {});
    });

    // Announce presence for any NPCs that initialized before us
    world.emit(EVENTS.PONG, {});

    // Broker NPC → Player damage
    world.on(EVENTS.NPC_ATTACK, (data) => {
      const { npcId, targetPlayerId, damage } = data;
      const player = world.getPlayer(targetPlayerId);
      if (!player) return;

      player.damage(damage);

      world.emit(EVENTS.PLAYER_DAMAGED, {
        playerId: targetPlayerId,
        damage,
        sourceId: npcId,
      });
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
  }
};
