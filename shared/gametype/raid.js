/**
 * Raid gametype — event constants and NPC bridge helper.
 */

export const EVENTS = {
  NPC_ATTACK: "raid:npc-attack",
  PLAYER_DAMAGED: "raid:player-damaged",
  NPC_HIT: "raid:npc-hit",
  PING: "raid:ping",
  PONG: "raid:pong",
};

/**
 * Creates a bridge for NPCs to communicate with the Raid app.
 * Uses app.emit for cross-app events and world.on to listen.
 */
export function createRaidBridge(world, app) {
  let connected = false;

  // Listen for pong from Raid app
  world.on(EVENTS.PONG, () => {
    console.log("[RaidBridge] received PONG — connected!");
    connected = true;
  });

  // Ping to see if Raid app is present
  console.log("[RaidBridge] sending PING");
  app.emit(EVENTS.PING, {});

  return {
    /**
     * Request damage on a player. If Raid app is active, emits intent event.
     * Otherwise falls back to direct damage.
     */
    attackPlayer(npcId, targetPlayer, damage) {
      console.log("[RaidBridge] attackPlayer connected=" + connected, npcId, targetPlayer.id, damage);
      if (connected) {
        app.emit(EVENTS.NPC_ATTACK, {
          npcId,
          targetPlayerId: targetPlayer.id,
          damage,
        });
      }
    },

    /**
     * Report that an NPC was hit by a player (for stat tracking).
     */
    reportHit(npcId, attackerId, damage, dead) {
      if (connected) {
        app.emit(EVENTS.NPC_HIT, {
          npcId,
          attackerId,
          damage,
          dead,
        });
      }
    },
  };
}
