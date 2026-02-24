// Reusable bone explosion — explodes armature meshes outward on death,
// then reattaches them on respawn.

const GRAVITY = 9.81;
const HORIZ_MIN = 2;
const HORIZ_MAX = 4;
const UP_MIN = 3;
const UP_MAX = 5;
const SPIN_MAX = 6;

export function createBoneExplosion(app, world) {
  let debris = null;
  let pieces = [];
  let originals = []; // saved local transforms for reset
  let allGrounded = false;

  const tick = (delta) => {
    if (allGrounded) return;
    let landed = 0;
    for (const p of pieces) {
      if (p.done) {
        landed++;
        continue;
      }
      p.vy -= GRAVITY * delta;
      p.mesh.position.x += p.vx * delta;
      p.mesh.position.y += p.vy * delta;
      p.mesh.position.z += p.vz * delta;
      p.mesh.rotation.x += p.spinX * delta;
      p.mesh.rotation.z += p.spinZ * delta;

      if (p.mesh.position.y <= p.groundY) {
        p.mesh.position.y = p.groundY;
        p.vx = 0;
        p.vy = 0;
        p.vz = 0;
        p.spinX = 0;
        p.spinZ = 0;
        p.done = true;
      }
      landed += p.done ? 1 : 0;
    }
    if (landed >= pieces.length) {
      allGrounded = true;
      app.off("update", tick);
    }
  };

  function explode(rootPos, meshes) {
    // Clean up any previous explosion
    if (debris) {
      app.off("update", tick);
      world.remove(debris);
    }

    debris = app.create("group");
    debris.position.set(rootPos.x, rootPos.y, rootPos.z);
    world.add(debris);

    pieces = [];
    originals = [];
    allGrounded = false;

    const rng = prng(Date.now() & 0xffff);

    for (const boneName in meshes) {
      const mesh = meshes[boneName];
      if (!mesh) continue;

      // Save original parent and local transform for reset
      const parent = mesh.parent;
      originals.push({
        boneName,
        mesh,
        parent,
        px: mesh.position.x,
        py: mesh.position.y,
        pz: mesh.position.z,
        rx: mesh.rotation.x,
        ry: mesh.rotation.y,
        rz: mesh.rotation.z,
        tag: mesh.tag,
        physics: mesh.physics,
      });

      // Get world position from matrixWorld
      const wx = mesh.matrixWorld.elements[12];
      const wy = mesh.matrixWorld.elements[13];
      const wz = mesh.matrixWorld.elements[14];

      // Compute local offset relative to debris group (which is at rootPos)
      const lx = wx - rootPos.x;
      const ly = wy - rootPos.y;
      const lz = wz - rootPos.z;

      // Remove from bone parent
      if (parent) parent.remove(mesh);

      // Remove physics and tag to avoid ghost colliders triggering hits
      mesh.physics = null;
      mesh.tag = null;

      // Place in debris group at local offset
      mesh.position.set(lx, ly, lz);
      mesh.rotation.set(0, 0, 0);
      debris.add(mesh);

      // Compute outward direction from body center (hips ~0.95m up)
      const dx = lx;
      const dy = ly - 0.95;
      const dz = lz;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const nx = dx / len;
      const nz = dz / len;

      const hSpeed = rng(HORIZ_MIN * 100, HORIZ_MAX * 100) / 100;
      const upSpeed = rng(UP_MIN * 100, UP_MAX * 100) / 100;

      pieces.push({
        mesh,
        vx: nx * hSpeed,
        vy: upSpeed,
        vz: nz * hSpeed,
        spinX: (rng(-100, 100) / 100) * SPIN_MAX,
        spinZ: (rng(-100, 100) / 100) * SPIN_MAX,
        groundY: 0, // ground is y=0 relative to debris (debris is at rootPos)
        done: false,
      });
    }

    app.on("update", tick);
  }

  function reset(armature, meshes) {
    app.off("update", tick);

    // Re-attach each mesh to its bone
    for (const orig of originals) {
      if (debris) debris.remove(orig.mesh);
      orig.mesh.position.set(orig.px, orig.py, orig.pz);
      orig.mesh.rotation.set(orig.rx, orig.ry, orig.rz);
      orig.mesh.tag = orig.tag;
      orig.mesh.physics = orig.physics;
      orig.parent.add(orig.mesh);
    }

    if (debris) {
      world.remove(debris);
      debris = null;
    }
    pieces = [];
    originals = [];
    allGrounded = false;

    // Reset bone rotations to rest pose
    armature.resetToRest();
  }

  return { explode, reset };
}
