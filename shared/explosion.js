export function spawnExplosion(app, world, position, setTimeout) {
  const explosion = app.create("particles", {
    shape: ["sphere", 0.5, 1],
    rate: 0,
    bursts: [{ time: 0, count: 30 }],
    duration: 0.1,
    loop: false,
    life: "0.4~0.8",
    speed: "2~5",
    size: "0.1~0.3",
    color: "#ff8800",
    force: new Vector3(0, -4, 0),
    direction: 1,
    blending: "additive",
    max: 40,
  });
  explosion.position.set(position.x, position.y + 1, position.z);
  world.add(explosion);
  setTimeout(() => {
    world.remove(explosion);
  }, 1500);
}
