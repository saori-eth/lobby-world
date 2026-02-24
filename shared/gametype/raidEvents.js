// Canonical event names for the raid damage pipeline.
// Import these instead of hardcoding strings.

// Weapon → Game type (server)
export const WEAPON_ATTACK = "weapon:attack";

// Game type → NPC (server)
export const NPC_DAMAGE = "npc:damage";

// NPC → Game type (server)
export const NPC_HIT = "npc:hit";
export const NPC_ATTACK_PLAYER = "npc:attack-player";

// Game type → World (server)
export const RAID_PLAYER_DAMAGED = "raid:player-damaged";
export const RAID_PLAYER_DIED = "raid:player-died";
