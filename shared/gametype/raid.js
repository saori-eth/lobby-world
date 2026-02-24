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
 * If no Raid app responds to a ping, falls back to direct player.damage().
 */
export function createRaidBridge(world) {
  let connected = false;

  // Listen for pong from Raid app
  world.on(EVENTS.PONG, () => {
    connected = true;
  });

  // Ping to see if Raid app is present
  world.emit(EVENTS.PING, {});

  return {
    /**
     * Request damage on a player. If Raid app is active, emits intent event.
     * Otherwise falls back to direct damage.
     */
    attackPlayer(npcId, targetPlayer, damage) {
      if (connected) {
        world.emit(EVENTS.NPC_ATTACK, {
          npcId,
          targetPlayerId: targetPlayer.id,
          damage,
        });
      } else {
        targetPlayer.damage(damage);
      }
    },

    /**
     * Report that an NPC was hit by a player (for stat tracking).
     */
    reportHit(npcId, attackerId, damage, dead) {
      if (connected) {
        world.emit(EVENTS.NPC_HIT, {
          npcId,
          attackerId,
          damage,
          dead,
        });
      }
    },
  };
}
