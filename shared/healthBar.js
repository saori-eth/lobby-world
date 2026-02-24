export function createHealthBar(app, parent, { hp = 100, maxHp = 100, y = 2.1 } = {}) {
  const healthUI = app.create("ui", {
    space: "world",
    billboard: "y",
    width: 60,
    height: 8,
    size: 0.01,
    pointerEvents: false,
  });
  healthUI.position.y = y;

  const bgBar = app.create("uiview", {
    width: 60,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    flexDirection: "row",
  });

  const fillBar = app.create("uiview", {
    width: 60,
    height: 8,
    backgroundColor: "#00d26a",
    borderRadius: 4,
  });

  bgBar.add(fillBar);
  healthUI.add(bgBar);
  parent.add(healthUI);

  healthUI.active = hp < maxHp;

  function update(newHp, newMax) {
    const ratio = newHp / newMax;
    fillBar.width = Math.round(60 * ratio);
    if (ratio > 0.5) {
      fillBar.backgroundColor = "#00d26a";
    } else if (ratio > 0.25) {
      fillBar.backgroundColor = "#ffc048";
    } else {
      fillBar.backgroundColor = "#ff4757";
    }
    healthUI.active = newHp < newMax && newHp > 0;
  }

  return { ui: healthUI, update };
}
