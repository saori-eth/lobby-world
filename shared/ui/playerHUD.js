/**
 * Screen-space health bar HUD for the local player.
 * Returns { update(hp, maxHp), destroy() }
 */
export function createPlayerHUD(app, { hp, maxHp }) {
  const ui = app.create("ui", {
    space: "screen",
    width: 220,
    height: 28,
    pivot: "bottom-center",
    position: [0.5, 1, 0],
    offset: [0, -40, 0],
    pointerEvents: false,
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  });

  const barBg = app.create("uiview", {
    width: 200,
    height: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 4,
    flexDirection: "row",
  });

  const barFill = app.create("uiview", {
    width: 200,
    height: 16,
    backgroundColor: "#00d26a",
    borderRadius: 4,
  });

  const label = app.create("uitext", {
    value: `${hp} / ${maxHp}`,
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
  });

  barBg.add(barFill);
  ui.add(barBg);
  ui.add(label);
  app.add(ui);

  function setColor(ratio) {
    if (ratio > 0.5) {
      barFill.backgroundColor = "#00d26a";
    } else if (ratio > 0.25) {
      barFill.backgroundColor = "#ffc048";
    } else {
      barFill.backgroundColor = "#ff4757";
    }
  }

  function update(newHp, newMax) {
    const ratio = Math.max(0, newHp / newMax);
    barFill.width = Math.round(200 * ratio);
    setColor(ratio);
    label.value = `${newHp} / ${newMax}`;
  }

  function destroy() {
    app.remove(ui);
  }

  // Set initial state
  const ratio = hp / maxHp;
  barFill.width = Math.round(200 * ratio);
  setColor(ratio);

  return { update, destroy };
}
