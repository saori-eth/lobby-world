export default (world, app, fetch, props, setTimeout) => {
  const block = app.get("Block");
  if (block) block.active = false;
  console.log("kart");

  app.configure([
    { key: "sit", type: "file", kind: "emote", label: "Sit Emote" },
  ]);
  const sitEmote = props.sit?.url;

  // Palette
  const C = {
    frame: "#1c1c1c",
    body: "#cc2222",
    seat: "#0a0a0a",
    tire: "#181818",
    rim: "#999999",
    axle: "#2e2e2e",
    steering: "#1a1a1a",
    pedal: "#3a3a3a",
    floor: "#222222",
    bumper: "#1e1e1e",
    engine: "#353535",
    exhaust: "#4a4a4a",
    chain: "#2a2a2a",
    metal: "#444444",
    darkMetal: "#404040",
  };
  const S = { metalness: 0.85, roughness: 0.25 };
  const R = { metalness: 0.05, roughness: 0.95 };
  const P = { metalness: 0.15, roughness: 0.6 };
  const CB = { metalness: 0.3, roughness: 0.4 };

  const GND = 0.03;
  const HR = 0.016;
  const kart = app.create("group");

  // Helper: tube between two points
  const tube = (a, b, r, col, mat) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      dz = b[2] - a[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const mx = (a[0] + b[0]) / 2,
      my = (a[1] + b[1]) / 2,
      mz = (a[2] + b[2]) / 2;
    const p = app.create("prim", {
      type: "cylinder",
      size: [r, r, len],
      color: col,
      metalness: mat.metalness,
      roughness: mat.roughness,
      position: [mx, my, mz],
    });
    const up = new Vector3(0, 1, 0);
    const dir = new Vector3(dx, dy, dz).normalize();
    const q = new Quaternion().setFromUnitVectors(up, dir);
    p.quaternion.copy(q);
    kart.add(p);
  };

  const FY = GND + HR;
  const RW = 0.18;

  // Main frame rails
  for (let side = -1; side <= 1; side += 2) {
    tube([side * RW, FY, 0.82], [side * RW, FY, -0.82], HR, C.frame, S);
  }

  // Cross members
  for (const z of [0.7, 0.35, 0.0, -0.35, -0.7]) {
    tube([-RW, FY, z], [RW, FY, z], HR, C.frame, S);
  }

  // Nose converging tubes
  for (let side = -1; side <= 1; side += 2) {
    tube(
      [side * RW, FY, 0.82],
      [side * 0.04, FY, 0.93],
      HR - 0.002,
      C.frame,
      S,
    );
  }
  tube([-0.04, FY, 0.93], [0.04, FY, 0.93], HR - 0.002, C.frame, S);

  // Rear frame uprights
  for (let side = -1; side <= 1; side += 2) {
    tube([side * RW, FY, -0.78], [side * RW, GND + 0.1, -0.78], HR, C.frame, S);
  }
  for (let side = -1; side <= 1; side += 2) {
    tube(
      [side * RW, GND + 0.1, -0.78],
      [side * 0.41, GND + 0.1, -0.82],
      HR,
      C.frame,
      S,
    );
  }

  // Floor pan
  kart.add(
    app.create("prim", {
      type: "box",
      size: [RW * 2 + 0.04, 0.015, 1.2],
      color: C.floor,
      metalness: CB.metalness,
      roughness: CB.roughness,
      position: [0, GND + 0.007, -0.02],
    }),
  );

  // Side pods
  for (let side = -1; side <= 1; side += 2) {
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.035, 0.12, 0.65],
        color: C.body,
        metalness: P.metalness,
        roughness: P.roughness,
        position: [side * 0.33, GND + 0.075, 0.0],
      }),
    );
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.13, 0.015, 0.65],
        color: C.body,
        metalness: P.metalness,
        roughness: P.roughness,
        position: [side * 0.28, GND + 0.14, 0.0],
      }),
    );
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.035, 0.08, 0.06],
        color: C.body,
        metalness: P.metalness,
        roughness: P.roughness,
        position: [side * 0.33, GND + 0.055, 0.35],
        rotation: [20 * DEG2RAD, 0, 0],
      }),
    );
    tube(
      [side * RW, FY, 0.1],
      [side * 0.31, GND + 0.075, 0.1],
      HR - 0.004,
      C.frame,
      S,
    );
    tube(
      [side * RW, FY, -0.2],
      [side * 0.31, GND + 0.075, -0.2],
      HR - 0.004,
      C.frame,
      S,
    );
  }

  // Nose fairing
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.46, 0.08, 0.18],
      color: C.body,
      metalness: P.metalness,
      roughness: P.roughness,
      position: [0, GND + 0.055, 0.75],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.36, 0.06, 0.08],
      color: C.body,
      metalness: P.metalness,
      roughness: P.roughness,
      position: [0, GND + 0.045, 0.87],
    }),
  );

  // Front bumper
  tube([-0.36, GND + 0.06, 0.93], [0.36, GND + 0.06, 0.93], 0.018, C.bumper, S);
  for (let side = -1; side <= 1; side += 2) {
    tube(
      [side * 0.36, GND + 0.06, 0.93],
      [side * 0.36, GND + 0.06, 0.84],
      0.018,
      C.bumper,
      S,
    );
    tube(
      [side * 0.36, GND + 0.06, 0.84],
      [side * RW, FY, 0.75],
      HR - 0.004,
      C.frame,
      S,
    );
  }
  // Rear bumper
  tube([-0.41, GND + 0.1, -0.9], [0.41, GND + 0.1, -0.9], 0.018, C.bumper, S);
  for (let side = -1; side <= 1; side += 2) {
    tube(
      [side * 0.41, GND + 0.1, -0.9],
      [side * 0.41, GND + 0.1, -0.82],
      0.018,
      C.bumper,
      S,
    );
  }

  // Number plates
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.2, 0.15, 0.005],
      color: "#ffffff",
      metalness: 0.1,
      roughness: 0.8,
      position: [0, GND + 0.06, 0.935],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.18, 0.11, 0.005],
      color: "#ffdd00",
      metalness: 0.1,
      roughness: 0.8,
      position: [0, GND + 0.14, -0.905],
    }),
  );

  // Seat
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.34, 0.03, 0.36],
      color: C.seat,
      metalness: R.metalness,
      roughness: 0.85,
      position: [0, GND + 0.12, -0.2],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.34, 0.32, 0.03],
      color: C.seat,
      metalness: R.metalness,
      roughness: 0.85,
      position: [0, GND + 0.31, -0.4],
      rotation: [8 * DEG2RAD, 0, 0],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.18, 0.1, 0.035],
      color: C.seat,
      metalness: R.metalness,
      roughness: 0.85,
      position: [0, GND + 0.5, -0.43],
    }),
  );
  for (let side = -1; side <= 1; side += 2) {
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.025, 0.1, 0.36],
        color: C.seat,
        metalness: R.metalness,
        roughness: 0.85,
        position: [side * 0.19, GND + 0.17, -0.2],
      }),
    );
  }
  for (let side = -1; side <= 1; side += 2) {
    tube(
      [side * 0.14, GND + 0.01, -0.1],
      [side * 0.14, GND + 0.11, -0.1],
      HR,
      C.frame,
      S,
    );
    tube(
      [side * 0.14, GND + 0.01, -0.35],
      [side * 0.14, GND + 0.11, -0.35],
      HR,
      C.frame,
      S,
    );
  }

  // Steering column
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.04, 0.03, 0.04],
      color: C.axle,
      metalness: S.metalness,
      roughness: S.roughness,
      position: [0, FY + 0.015, 0.35],
    }),
  );
  tube([0, FY + 0.03, 0.35], [0, GND + 0.36, 0.44], 0.012, C.steering, S);
  const sw = app.create("group");
  sw.position.set(0, GND + 0.36, 0.44);
  sw.rotation.set(25 * DEG2RAD, 0, 0);
  for (const y of [0.055, -0.055]) {
    sw.add(
      app.create("prim", {
        type: "box",
        size: [0.2, 0.018, 0.018],
        color: C.steering,
        metalness: CB.metalness,
        roughness: CB.roughness,
        position: [0, y, 0],
      }),
    );
  }
  for (let side = -1; side <= 1; side += 2) {
    sw.add(
      app.create("prim", {
        type: "box",
        size: [0.018, 0.13, 0.022],
        color: C.steering,
        metalness: CB.metalness,
        roughness: CB.roughness,
        position: [side * 0.1, 0, 0],
      }),
    );
  }
  sw.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.025, 0.025, 0.015],
      color: C.metal,
      metalness: S.metalness,
      roughness: S.roughness,
      rotation: [90 * DEG2RAD, 0, 0],
    }),
  );
  kart.add(sw);

  // Pedals
  tube([-0.12, FY, 0.52], [0.12, FY, 0.52], HR - 0.004, C.frame, S);
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.055, 0.09, 0.015],
      color: C.pedal,
      metalness: S.metalness,
      roughness: S.roughness,
      position: [0.07, GND + 0.05, 0.54],
      rotation: [18 * DEG2RAD, 0, 0],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.065, 0.09, 0.015],
      color: C.pedal,
      metalness: S.metalness,
      roughness: S.roughness,
      position: [-0.07, GND + 0.05, 0.54],
      rotation: [18 * DEG2RAD, 0, 0],
    }),
  );

  // Wheels
  const wheels = {};
  const buildWheel = (key, x, z, rear) => {
    const wg = app.create("group");
    wg.position.set(x, 0, z);
    const tr = rear ? 0.14 : 0.12;
    const tw = rear ? 0.17 : 0.11;
    const rr = rear ? 0.085 : 0.07;
    const rot = [0, 0, 90 * DEG2RAD];
    const pos = [0, tr, 0];
    const tire = app.create("prim", {
      type: "cylinder",
      size: [tr, tr, tw],
      color: C.tire,
      metalness: R.metalness,
      roughness: R.roughness,
      rotation: rot,
      position: pos,
    });
    wg.add(tire);
    wg.add(
      app.create("prim", {
        type: "cylinder",
        size: [rr, rr, tw + 0.004],
        color: C.rim,
        metalness: S.metalness,
        roughness: 0.15,
        rotation: rot,
        position: pos,
      }),
    );
    wg.add(
      app.create("prim", {
        type: "cylinder",
        size: [0.02, 0.02, tw + 0.012],
        color: "#555555",
        metalness: 0.9,
        roughness: 0.15,
        rotation: rot,
        position: pos,
      }),
    );
    wheels[key] = { group: wg, tire };
    kart.add(wg);
  };
  buildWheel("fl", -0.52, 0.65, false);
  buildWheel("fr", 0.52, 0.65, false);
  buildWheel("rl", -0.5, -0.68, true);
  buildWheel("rr", 0.5, -0.68, true);

  // Front stub axles
  for (let side = -1; side <= 1; side += 2) {
    tube([side * RW, 0.12, 0.65], [side * 0.52, 0.12, 0.65], 0.012, C.axle, S);
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.025, 0.065, 0.035],
        color: C.axle,
        metalness: S.metalness,
        roughness: S.roughness,
        position: [side * 0.36, 0.12, 0.65],
      }),
    );
  }
  tube([-0.3, 0.09, 0.69], [0.3, 0.09, 0.69], 0.008, C.axle, S);

  // Rear axle
  tube([-0.5, 0.14, -0.68], [0.5, 0.14, -0.68], 0.018, C.axle, S);
  for (let side = -1; side <= 1; side += 2) {
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.04, 0.05, 0.04],
        color: C.axle,
        metalness: S.metalness,
        roughness: S.roughness,
        position: [side * 0.22, 0.14, -0.68],
      }),
    );
    tube([side * RW, FY, -0.68], [side * 0.22, 0.14, -0.68], HR, C.frame, S);
  }

  // Engine
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.2, 0.15, 0.2],
      color: C.engine,
      metalness: 0.65,
      roughness: 0.35,
      position: [0.14, GND + 0.12, -0.65],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.18, 0.05, 0.16],
      color: "#484848",
      metalness: 0.6,
      roughness: 0.4,
      position: [0.14, GND + 0.225, -0.65],
    }),
  );
  for (let i = 0; i < 3; i++) {
    kart.add(
      app.create("prim", {
        type: "box",
        size: [0.22, 0.004, 0.19],
        color: C.darkMetal,
        metalness: 0.6,
        roughness: 0.35,
        position: [0.14, GND + 0.16 + i * 0.025, -0.65],
      }),
    );
  }
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.055, 0.055, 0.075],
      color: C.chain,
      metalness: 0.2,
      roughness: 0.7,
      position: [0.14, GND + 0.29, -0.62],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.05, 0.05, 0.04],
      color: "#3d3d3d",
      metalness: 0.7,
      roughness: 0.3,
      position: [0.14, GND + 0.25, -0.58],
    }),
  );
  tube([0.25, GND + 0.12, -0.65], [0.3, GND + 0.08, -0.8], 0.018, C.exhaust, {
    metalness: 0.8,
    roughness: 0.25,
  });
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.035, 0.035, 0.12],
      color: "#505050",
      metalness: 0.75,
      roughness: 0.3,
      position: [0.3, GND + 0.04, -0.9],
      rotation: [70 * DEG2RAD, 0, 0],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.06, 0.06, 0.012],
      color: C.chain,
      metalness: 0.8,
      roughness: 0.3,
      position: [0.14, 0.14, -0.68],
      rotation: [0, 0, 90 * DEG2RAD],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.03, 0.03, 0.012],
      color: C.chain,
      metalness: 0.8,
      roughness: 0.3,
      position: [0.14, GND + 0.07, -0.65],
      rotation: [0, 0, 90 * DEG2RAD],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.005, 0.06, 0.12],
      color: C.chain,
      metalness: 0.5,
      roughness: 0.5,
      position: [0.17, GND + 0.1, -0.67],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.045, 0.045, 0.03],
      color: C.engine,
      metalness: 0.7,
      roughness: 0.3,
      position: [0.06, GND + 0.1, -0.65],
      rotation: [0, 0, 90 * DEG2RAD],
    }),
  );
  tube([RW, FY, -0.58], [0.14, GND + 0.05, -0.58], HR, C.frame, S);
  tube([RW, FY, -0.72], [0.14, GND + 0.05, -0.72], HR, C.frame, S);

  // Fuel tank
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.14, 0.1, 0.12],
      color: C.floor,
      metalness: P.metalness,
      roughness: P.roughness,
      position: [-0.14, GND + 0.15, -0.62],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.02, 0.02, 0.015],
      color: "#666666",
      metalness: 0.8,
      roughness: 0.2,
      position: [-0.14, GND + 0.21, -0.62],
    }),
  );

  // Rear brake
  kart.add(
    app.create("prim", {
      type: "cylinder",
      size: [0.065, 0.065, 0.006],
      color: "#606060",
      metalness: S.metalness,
      roughness: 0.2,
      position: [0.0, 0.14, -0.68],
      rotation: [0, 0, 90 * DEG2RAD],
    }),
  );
  kart.add(
    app.create("prim", {
      type: "box",
      size: [0.03, 0.04, 0.03],
      color: C.body,
      metalness: 0.6,
      roughness: 0.4,
      position: [0.0, 0.09, -0.68],
    }),
  );

  // Seat anchor
  const seatAnchor = app.create("anchor", { id: "gokart-seat" });
  seatAnchor.position.set(0, GND + 0.17, -0.12);
  seatAnchor.rotation.set(0, 180 * DEG2RAD, 0);
  kart.add(seatAnchor);

  // Exhaust smoke particles (child of kart, moves with it automatically)
  const exhaustSmoke = app.create("particles", {
    shape: ["cone", 0.03, 0, 25],
    rate: 15,
    life: "0.8~1.5",
    speed: "0.5~1.2",
    size: "0.06~0.12",
    color: "#888888",
    sizeOverLife: "0,1|0.5,3|1,5",
    alphaOverLife: "0,0.6|0.4,0.4|1,0",
    colorOverLife: "0,#666666|1,#aaaaaa",
    force: new Vector3(0, 0.4, 0),
    position: [0.3, 0.09, -0.97],
  });
  exhaustSmoke.emitting = false;
  kart.add(exhaustSmoke);

  // Attach kart to world
  app.add(kart);
  world.attach(kart);

  // Driving parameters
  let ACCEL = 18;
  const BASE_ACCEL = 18;
  const BRAKE_FORCE = 22;
  let MAX_SPEED = 22;
  const BASE_MAX_SPEED = 22;
  const BOOST_MAX_SPEED = 35;
  const BOOST_ACCEL = 30;
  const REVERSE_MAX = 6;
  const DRAG = 0.985;
  const STEER_MAX = 38 * DEG2RAD;
  const STEER_LERP = 8;
  const WHEELBASE = 1.33;
  const GRAVITY = 18;
  const SEND_RATE = 1 / 30;

  // Pre-allocated math
  const _v1 = new Vector3();
  const _e1 = new Euler(0, 0, 0, "YXZ");
  const _e2 = new Euler(0, 0, 0, "YXZ");
  const _q1 = new Quaternion();
  const _down = new Vector3(0, -1, 0);
  const _envMask = world.createLayerMask("environment");

  // State
  let velocity = 0;
  let steerAngle = 0;
  let verticalVel = 0;
  let grounded = true;
  let control = null;
  let isSeated = false;
  let sendTimer = 0;

  // Speed boost
  let boostTimeRemaining = 0;

  world.on("speed-boost", (data) => {
    if (!isSeated) return;
    if (!world.isClient) return;
    if (data.playerId !== world.getPlayer().id) return;
    boostTimeRemaining = data.duration;
    MAX_SPEED = BOOST_MAX_SPEED;
    ACCEL = BOOST_ACCEL;
  });

  // Network interpolation targets
  const netPos = new Vector3();
  const netQuat = new Quaternion();
  let hasNetData = false;

  // ---- SERVER ----
  if (world.isServer) {
    app.state.driver = null;
    app.state.sync = null;
    app.state.ready = true;

    app.on("mount", (_, playerId) => {
      if (app.state.driver) return;
      app.state.driver = playerId;
      app.send("mounted", playerId);
      app.emit("gokart-mounted", {
        instanceId: app.instanceId,
        driver: playerId,
      });
    });

    app.on("unmount", (_, playerId) => {
      if (app.state.driver !== playerId) return;
      app.state.driver = null;
      app.send("unmounted", playerId);
      app.emit("gokart-unmounted", { instanceId: app.instanceId, playerId });
    });

    world.on("leave", ({ playerId }) => {
      if (app.state.driver !== playerId) return;
      app.state.driver = null;
      app.send("unmounted", playerId);
      app.emit("gokart-unmounted", { instanceId: app.instanceId, playerId });
    });

    app.on("sync", (data, playerId) => {
      app.state.sync = data;
      app.send("sync", data, playerId);
      app.emit("gokart-update", {
        instanceId: app.instanceId,
        driver: app.state.driver,
        pos: [data[0], data[1], data[2]],
        quat: [data[3], data[4], data[5], data[6]],
      });
    });

    app.send("init", app.state);
  }

  // ---- CLIENT ----
  if (world.isClient) {
    world.remove(kart);
    const player = world.getPlayer();

    if (app.state.ready) {
      init(app.state);
    } else {
      app.on("init", init);
    }

    function init(state) {
      if (state.sync && state.sync.length >= 7) {
        kart.position.set(state.sync[0], state.sync[1], state.sync[2]);
        kart.quaternion.set(
          state.sync[3],
          state.sync[4],
          state.sync[5],
          state.sync[6],
        );
      }
      world.add(kart);

      const action = app.create("action", {
        label: "Drive",
        position: [0, 0.5, 0],
        distance: 3,
        duration: 0,
        onTrigger: () => app.send("mount"),
      });
      kart.add(action);

      if (state.driver) {
        action.active = false;
        exhaustSmoke.emitting = true;
      }

      app.on("mounted", (playerId) => {
        action.active = false;
        exhaustSmoke.emitting = true;
        if (playerId === player.id) {
          isSeated = true;
          control = app.control();
          control.camera.write = true;
          player.applyEffect({
            anchor: seatAnchor,
            emote: sitEmote,
            freeze: true,
          });
        }
      });

      app.on("unmounted", () => {
        action.active = true;
        exhaustSmoke.emitting = false;
        exhaustSmoke.rate = 15;
        if (isSeated) {
          isSeated = false;
          velocity = 0;
          steerAngle = 0;
          verticalVel = 0;
          grounded = true;
          boostTimeRemaining = 0;
          MAX_SPEED = BASE_MAX_SPEED;
          ACCEL = BASE_ACCEL;
          player.cancelEffect();
          _v1
            .set(-1.2, 0, 0)
            .applyQuaternion(kart.quaternion)
            .add(kart.position);
          _v1.y = kart.position.y + 0.1;
          player.teleport(_v1);
          if (control) {
            control.release();
            control = null;
          }
        }
      });

      app.on("sync", (data) => {
        if (isSeated) return;
        if (data && data.length >= 7) {
          netPos.set(data[0], data[1], data[2]);
          netQuat.set(data[3], data[4], data[5], data[6]);
          hasNetData = true;
        }
      });

      app.on("update", (delta) => {
        if (isSeated) {
          drive(delta);
          updateCamera(delta);
          syncOut(delta);
        } else if (hasNetData) {
          kart.position.lerp(netPos, 8 * delta);
          kart.quaternion.slerp(netQuat, 8 * delta);
        }
        animateWheels(delta);
        app.emit("gokart-update", {
          instanceId: app.instanceId,
          driver: isSeated ? player.id : null,
          pos: [kart.position.x, kart.position.y, kart.position.z],
          quat: [
            kart.quaternion.x,
            kart.quaternion.y,
            kart.quaternion.z,
            kart.quaternion.w,
          ],
        });
      });

      app.on("destroy", () => {
        if (control) control.release();
      });
    }

    function drive(delta) {
      // Tick down speed boost
      if (boostTimeRemaining > 0) {
        boostTimeRemaining -= delta;
        if (boostTimeRemaining <= 0) {
          boostTimeRemaining = 0;
          MAX_SPEED = BASE_MAX_SPEED;
          ACCEL = BASE_ACCEL;
        }
      }

      let accelIn = 0;
      let steerIn = 0;
      if (control.keyW.down) accelIn = 1;
      if (control.keyS.down) accelIn = -1;
      if (control.keyA.down) steerIn = 1;
      if (control.keyD.down) steerIn = -1;

      exhaustSmoke.rate = accelIn > 0 ? 30 : 15;

      if (control.keyX.pressed || control.escape.pressed) {
        app.send("unmount");
        return;
      }

      if (accelIn > 0) {
        velocity += ACCEL * delta;
      } else if (accelIn < 0) {
        if (velocity > 0.5) {
          velocity -= BRAKE_FORCE * delta;
          if (velocity < 0) velocity = 0;
        } else {
          velocity -= ACCEL * 0.5 * delta;
        }
      }

      velocity *= Math.pow(DRAG, delta * 60);

      if (velocity > MAX_SPEED) velocity = MAX_SPEED;
      if (velocity < -REVERSE_MAX) velocity = -REVERSE_MAX;
      if (Math.abs(velocity) < 0.05 && accelIn === 0) velocity = 0;

      const speedRatio = Math.min(Math.abs(velocity) / MAX_SPEED, 1);
      const turnReduction = 1 - speedRatio * 0.3;
      const targetSteer = steerIn * STEER_MAX * turnReduction;
      steerAngle +=
        (targetSteer - steerAngle) * Math.min(STEER_LERP * delta, 1);

      if (Math.abs(velocity) > 0.1) {
        const turnRate = (velocity / WHEELBASE) * Math.tan(steerAngle);
        kart.rotation.y += turnRate * delta;
      }

      if (Math.abs(velocity) > 0.01) {
        _v1.set(0, 0, 1).applyQuaternion(kart.quaternion);
        kart.position.addScaledVector(_v1, velocity * delta);
      }

      _v1.copy(kart.position);
      _v1.y += 3;
      const hit = world.raycast(_v1, _down, 10, _envMask);
      const groundY = hit ? hit.point.y : -Infinity;
      const distToGround = kart.position.y - groundY;

      if (grounded && control.space.pressed) {
        grounded = false;
        verticalVel = 7;
      }

      if (grounded) {
        if (distToGround > 0.3) {
          grounded = false;
          const slopeVel =
            Math.abs(velocity) * (distToGround > 0.5 ? 0.35 : 0.15);
          verticalVel = slopeVel;
        } else {
          kart.position.y = groundY;
          verticalVel = 0;
        }
      } else {
        verticalVel -= GRAVITY * delta;
        kart.position.y += verticalVel * delta;
        if (kart.position.y <= groundY && hit) {
          kart.position.y = groundY;
          verticalVel = 0;
          grounded = true;
        }
      }
    }

    function updateCamera(delta) {
      control.camera.position.copy(kart.position);
      control.camera.position.y += 1.6;

      _e1.setFromQuaternion(kart.quaternion);
      _e2.set(-8 * DEG2RAD, _e1.y + Math.PI, 0, "YXZ");
      _q1.setFromEuler(_e2);
      control.camera.quaternion.slerp(_q1, 6 * delta);

      const speedZoom = 4 + (Math.abs(velocity) / MAX_SPEED) * 1.5;
      control.camera.zoom = speedZoom;
    }

    function syncOut(delta) {
      sendTimer += delta;
      if (sendTimer < SEND_RATE) return;
      sendTimer = 0;
      app.send("sync", [
        kart.position.x,
        kart.position.y,
        kart.position.z,
        kart.quaternion.x,
        kart.quaternion.y,
        kart.quaternion.z,
        kart.quaternion.w,
      ]);
    }

    function animateWheels(delta) {
      if (wheels.fl) wheels.fl.group.rotation.y = steerAngle;
      if (wheels.fr) wheels.fr.group.rotation.y = steerAngle;
      if (Math.abs(velocity) > 0.05) {
        const rollSpeed = velocity / 0.13;
        for (const key of ["fl", "fr", "rl", "rr"]) {
          if (wheels[key]) wheels[key].tire.rotation.x += rollSpeed * delta;
        }
      }
    }
  }
};
