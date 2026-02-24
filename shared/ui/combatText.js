/**
 * Spawns a floating damage number that drifts upward and fades out.
 * World-space, billboard on Y axis.
 */
let _side = 1;

export function createCombatText(app, world, { position, value, color = "#ff4757" }) {
  const drift = _side;
  _side *= -1;
  const ui = app.create("ui", {
    space: "world",
    billboard: "y",
    width: 80,
    height: 30,
    size: 0.01,
    pointerEvents: false,
  });

  const isArray = Array.isArray(position);
  ui.position.set(
    isArray ? position[0] : position.x,
    isArray ? position[1] : position.y,
    isArray ? position[2] : position.z,
  );

  const text = app.create("uitext", {
    value: `-${value}`,
    fontSize: 22,
    fontWeight: "bold",
    color,
    textAlign: "center",
  });

  ui.add(text);
  world.add(ui);

  const duration = 0.8;
  const riseDistance = 1;
  const arcDistance = 0.6;
  let elapsed = 0;
  const startX = ui.position.x;
  const startY = ui.position.y;

  function animate(delta) {
    elapsed += delta;
    const t = Math.min(elapsed / duration, 1);

    ui.position.x = startX + arcDistance * drift * t;
    ui.position.y = startY + riseDistance * t;
    ui.opacity = 1 - t;

    if (t >= 1) {
      app.off("update", animate);
      world.remove(ui);
    }
  }

  app.on("update", animate);
}
