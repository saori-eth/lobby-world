# Cross-App Event Protocol

Apps communicate via `app.emit()` (fire) and `world.on()` (listen). Events are fire-and-forget — if no listener exists, the event is silently ignored.

## Weapon → Game Type → NPC

All damage flows through the game type. If no game type is active, NPCs do not take damage.

| Event | Emitter | Listener | Payload |
|---|---|---|---|
| `"weapon:attack"` | `meleeWeapon` (server) | Game type e.g. `raid.js` (server) | `{ position: [x,y,z], playerId: string }` |
| `"npc:damage"` | Game type (server) | `createNPC` (server) | `{ position: [x,y,z], playerId: string }` |

The NPC does a distance check against the hit position to decide if it was actually hit.

Client-side prediction: NPC clients listen for `"weapon:attack"` directly for optimistic UI (blood, combat text, health bar). The server is authoritative.

## NPC → Game Type

| Event | Emitter | Listener | Payload |
|---|---|---|---|
| `"npc:attack-player"` | `createNPC` (server) | Game type e.g. `raid.js` (server) | `{ npcId: string, targetPlayerId: string, damage: number }` |
| `"npc:hit"` | `createNPC` (server) | Game type e.g. `raid.js` (server) | `{ npcId: string, attackerId: string, damage: number, dead: boolean }` |

These are generic — the NPC has no knowledge of which game type (if any) is listening.

## Game Type → World

Emitted by Raid for other apps that may want to react to player damage/death:

| Event | Emitter | Listener | Payload |
|---|---|---|---|
| `"raid:player-damaged"` | `raid.js` (server) | Any app (server) | `{ playerId: string, damage: number, sourceId: string }` |
| `"raid:player-died"` | `raid.js` (server) | Any app (server) | `{ playerId: string }` |

## Flow

```
Player swings sword
  → meleeWeapon emits "weapon:attack" { position, playerId }
  → Game type hears "weapon:attack", re-emits as "npc:damage"
  → NPC hears "npc:damage", does distance check, takes damage
    → NPC emits "npc:hit" { npcId, attackerId, damage, dead }
    → Game type hears "npc:hit", tracks stats

NPC attacks player
  → NPC emits "npc:attack-player" { npcId, targetPlayerId, damage }
  → Game type hears "npc:attack-player", deducts player HP
    → Game type emits "raid:player-damaged" / "raid:player-died"
    → Game type sends "player-damaged" to clients for HUD update
```
