const FALL_TARGET = 90 * DEG2RAD;
const FALL_SPEED = 3;
const FALL_LIFT = 0.3;

export function createDeathFall(app, bodyPivot) {
  let falling = false;

  const fallUpdate = (delta) => {
    if (!falling) return;
    bodyPivot.rotation.x += FALL_SPEED * delta;
    if (bodyPivot.rotation.x >= FALL_TARGET) {
      bodyPivot.rotation.x = FALL_TARGET;
      bodyPivot.position.y = FALL_LIFT;
      falling = false;
      app.off("update", fallUpdate);
    } else {
      const t = bodyPivot.rotation.x / FALL_TARGET;
      bodyPivot.position.y = t * FALL_LIFT;
    }
  };

  function start() {
    falling = true;
    app.on("update", fallUpdate);
  }

  function reset() {
    falling = false;
    app.off("update", fallUpdate);
    bodyPivot.rotation.x = 0;
    bodyPivot.position.y = 0;
  }

  return { start, reset };
}
