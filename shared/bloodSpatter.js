export function spawnBlood(app, world, position, setTimeout) {
  const blood = app.create("particles", {
    shape: ["sphere", 0.3, 1],
    rate: 0,
    bursts: [{ time: 0, count: 12 }],
    duration: 0.1,
    loop: false,
    life: "0.3~0.6",
    speed: "1~3",
    size: "0.04~0.08",
    color: "#8b0000",
    force: new Vector3(0, -6, 0),
    direction: 1,
    blending: "normal",
    max: 20,
  });
  blood.position.set(position.x, position.y + 1, position.z);
  world.add(blood);
  setTimeout(() => {
    world.remove(blood);
  }, 1000);
}
