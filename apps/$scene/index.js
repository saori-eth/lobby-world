export default (world, app, fetch, props, setTimeout) => {
  app.get('Block').active = false
  app.configure(() => {
    return [
      {
        key: 'sky',
        label: 'Sky',
        type: 'file',
        kind: 'texture',
        hint: 'The image to use as the background.',
      },
      {
        key: 'hdr',
        label: 'HDR',
        type: 'file',
        kind: 'hdr',
        hint: 'The HDRI to use for reflections and lighting.',
      },
      {
        key: 'rotationY',
        label: 'Rotation',
        type: 'number',
        step: 10,
        bigStep: 50,
      },
      {
        key: '002',
        type: 'section',
        label: 'Sun',
      },
      {
        key: 'horizontalRotation',
        label: 'Direction',
        type: 'number',
        min: 0,
        max: 360,
        step: 10,
        bigStep: 50,
        initial: 0,
        dp: 0,
        hint: 'The direction of the sun in degrees',
      },
      {
        key: 'verticalRotation',
        label: 'Elevation',
        type: 'number',
        min: 0,
        max: 360,
        step: 10,
        bigStep: 50,
        initial: 0,
        dp: 0,
        hint: 'The elevation of the sun in degrees',
      },
      {
        key: 'intensity',
        label: 'Intensity',
        type: 'number',
        min: 0,
        max: 10,
        step: 0.1,
        initial: 1,
        dp: 1,
      },
      {
        key: '003',
        type: 'section',
        label: 'Fog',
      },
      {
        key: 'fogColor',
        label: 'Color',
        type: 'text',
        hint: 'The fog color. Leave blank to disable fog',
      },
      {
        key: 'fogNear',
        label: 'Near',
        type: 'number',
        dp: 0,
        min: 0,
        step: 10,
        initial: 0,
        hint: 'The near distance for fog in metres',
      },
      {
        key: 'fogFar',
        label: 'Far',
        type: 'number',
        dp: 0,
        min: 0,
        step: 10,
        initial: 1000,
        hint: 'The far distance for fog in metres',
      },
    ]
  })

  const sky = app.create('sky')

  sky.bg = app.config.sky?.url
  sky.hdr = app.config.hdr?.url
  sky.rotationY = app.config.rotationY * -DEG2RAD

  sky.shader = `
    float y = direction.y;
    float t = clamp(0.5 + 0.5 * y, 0.0, 1.0);

    vec3 nightLow = vec3(0.01, 0.01, 0.03);
    vec3 nightMid = vec3(0.02, 0.02, 0.08);
    vec3 nightHigh = vec3(0.0, 0.0, 0.04);
    vec3 base = mix(nightLow, mix(nightMid, nightHigh, t), t);

    float angle = atan(direction.x, direction.z);

    float wave1 = sin(angle * 3.0 + uTime * 0.15) * 0.5 + 0.5;
    float wave2 = sin(angle * 5.0 - uTime * 0.1 + 1.5) * 0.5 + 0.5;
    float wave3 = sin(angle * 7.0 + uTime * 0.08 + 3.0) * 0.5 + 0.5;

    float curtain = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;

    float band = smoothstep(0.15, 0.4, y) * smoothstep(0.85, 0.5, y);
    float shimmer = sin(angle * 20.0 + y * 30.0 + uTime * 0.5) * 0.5 + 0.5;
    float auroraShape = band * curtain * (0.7 + 0.3 * shimmer);

    vec3 green = vec3(0.1, 0.9, 0.3);
    vec3 teal = vec3(0.0, 0.7, 0.7);
    vec3 purple = vec3(0.4, 0.1, 0.8);
    vec3 pink = vec3(0.7, 0.1, 0.5);

    float colorMix = sin(angle * 2.0 + uTime * 0.12) * 0.5 + 0.5;
    float colorMix2 = sin(angle * 3.5 - uTime * 0.07 + 2.0) * 0.5 + 0.5;
    vec3 auroraColor = mix(mix(green, teal, colorMix), mix(purple, pink, colorMix2), smoothstep(0.3, 0.7, y));

    vec3 aurora = auroraColor * auroraShape * 1.5;

    float stars = 0.0;
    vec3 starDir = normalize(direction);
    float sx = atan(starDir.x, starDir.z) * 50.0;
    float sy = starDir.y * 100.0;
    float cell = floor(sx) * 137.0 + floor(sy) * 241.0;
    float starRand = fract(sin(cell) * 43758.5453);
    if (starRand > 0.97) {
      float fx = fract(sx) - 0.5;
      float fy = fract(sy) - 0.5;
      float dist = fx * fx + fy * fy;
      float twinkle = sin(uTime * (2.0 + starRand * 4.0) + starRand * 6.28) * 0.4 + 0.6;
      stars = smoothstep(0.02, 0.0, dist) * twinkle * step(0.0, y);
    }

    color = base + aurora + vec3(stars);
  `

  const sunDirection = calculateSunDirection(app.config.verticalRotation || 0, app.config.horizontalRotation || 0)
  sky.sunDirection = sunDirection
  sky.sunIntensity = app.config.intensity

  sky.fogNear = app.config.fogNear
  sky.fogFar = app.config.fogFar
  sky.fogColor = app.config.fogColor

  app.add(sky)

  const CITY_SIZE = 500
  const ROAD_WIDTH = 14
  const BLOCK_SIZE = 36
  const SIDEWALK_WIDTH = 3
  const GROUND_THICKNESS = 0.2
  const SIDEWALK_HEIGHT = 0.25
  const PLOT_PADDING = 1.2
  const NEON_STRIP_HEIGHT = 0.25
  const GRID_STEP = ROAD_WIDTH + BLOCK_SIZE
  const ROAD_COUNT = 10

  const buildingPalette = ['#0b0f1a', '#121826', '#1a1f33', '#161425', '#1d2338']
  const neonPalette = ['#00e5ff', '#ff2bd6', '#7a5cff']

  const cityGroup = app.create('group')
  const groundGroup = app.create('group')
  const streetGroup = app.create('group')
  const sidewalkGroup = app.create('group')
  const buildingGroup = app.create('group')
  const decoGroup = app.create('group')

  cityGroup.add(groundGroup)
  cityGroup.add(streetGroup)
  cityGroup.add(sidewalkGroup)
  cityGroup.add(buildingGroup)
  cityGroup.add(decoGroup)

  const ground = app.create('prim', {
    type: 'box',
    size: [CITY_SIZE, GROUND_THICKNESS, CITY_SIZE],
    position: [0, -GROUND_THICKNESS / 2, 0],
    color: '#05070c',
    roughness: 0.95,
    metalness: 0.05,
    physics: 'static',
    castShadow: false,
    receiveShadow: true,
  })
  groundGroup.add(ground)

  const citySpan = ROAD_COUNT * ROAD_WIDTH + (ROAD_COUNT - 1) * BLOCK_SIZE
  const edgePadding = (CITY_SIZE - citySpan) / 2
  const firstRoadCenter = -CITY_SIZE / 2 + edgePadding + ROAD_WIDTH / 2

  const roadCenters = []
  for (let i = 0; i < ROAD_COUNT; i++) {
    roadCenters.push(firstRoadCenter + i * GRID_STEP)
  }

  for (let i = 0; i < roadCenters.length; i++) {
    const center = roadCenters[i]

    const xRoad = app.create('prim', {
      type: 'box',
      size: [CITY_SIZE, 0.03, ROAD_WIDTH],
      position: [0, 0.015, center],
      color: '#10151f',
      roughness: 0.9,
      metalness: 0.15,
      physics: 'static',
      castShadow: false,
      receiveShadow: true,
    })
    streetGroup.add(xRoad)

    const zRoad = app.create('prim', {
      type: 'box',
      size: [ROAD_WIDTH, 0.03, CITY_SIZE],
      position: [center, 0.015, 0],
      color: '#10151f',
      roughness: 0.9,
      metalness: 0.15,
      physics: 'static',
      castShadow: false,
      receiveShadow: true,
    })
    streetGroup.add(zRoad)

    const laneOffset = ROAD_WIDTH * 0.22
    for (let lane = 0; lane < 2; lane++) {
      const side = lane === 0 ? -1 : 1
      const xLineColor = neonPalette[(i + lane) % neonPalette.length]
      const zLineColor = neonPalette[(i + lane + 1) % neonPalette.length]

      const xLine = app.create('prim', {
        type: 'box',
        size: [CITY_SIZE, 0.02, 0.2],
        position: [0, 0.03, center + side * laneOffset],
        color: '#182030',
        emissive: xLineColor,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.2,
        castShadow: false,
        receiveShadow: false,
      })
      decoGroup.add(xLine)

      const zLine = app.create('prim', {
        type: 'box',
        size: [0.2, 0.02, CITY_SIZE],
        position: [center + side * laneOffset, 0.03, 0],
        color: '#182030',
        emissive: zLineColor,
        emissiveIntensity: 0.9,
        roughness: 0.25,
        metalness: 0.2,
        castShadow: false,
        receiveShadow: false,
      })
      decoGroup.add(zLine)
    }
  }

  const blockCount = roadCenters.length - 1

  for (let bx = 0; bx < blockCount; bx++) {
    for (let bz = 0; bz < blockCount; bz++) {
      const blockMinX = roadCenters[bx] + ROAD_WIDTH / 2
      const blockMaxX = roadCenters[bx + 1] - ROAD_WIDTH / 2
      const blockMinZ = roadCenters[bz] + ROAD_WIDTH / 2
      const blockMaxZ = roadCenters[bz + 1] - ROAD_WIDTH / 2
      const blockWidth = blockMaxX - blockMinX
      const blockDepth = blockMaxZ - blockMinZ
      const blockCenterX = (blockMinX + blockMaxX) / 2
      const blockCenterZ = (blockMinZ + blockMaxZ) / 2

      const sidewalk = app.create('prim', {
        type: 'box',
        size: [blockWidth, SIDEWALK_HEIGHT, blockDepth],
        position: [blockCenterX, SIDEWALK_HEIGHT / 2, blockCenterZ],
        color: '#1a1f2b',
        roughness: 0.7,
        metalness: 0.2,
        physics: 'static',
        castShadow: false,
        receiveShadow: true,
      })
      sidewalkGroup.add(sidewalk)

      const buildMinX = blockMinX + SIDEWALK_WIDTH
      const buildMaxX = blockMaxX - SIDEWALK_WIDTH
      const buildMinZ = blockMinZ + SIDEWALK_WIDTH
      const buildMaxZ = blockMaxZ - SIDEWALK_WIDTH
      const plotWidth = (buildMaxX - buildMinX) / 2
      const plotDepth = (buildMaxZ - buildMinZ) / 2

      for (let px = 0; px < 2; px++) {
        for (let pz = 0; pz < 2; pz++) {
          const plotMinX = buildMinX + px * plotWidth
          const plotMaxX = plotMinX + plotWidth
          const plotMinZ = buildMinZ + pz * plotDepth
          const plotMaxZ = plotMinZ + plotDepth
          const seedX = bx * 2 + px
          const seedZ = bz * 2 + pz

          if (hash2(seedX, seedZ, 1) > 0.7) continue

          const maxFootprintX = Math.max(8, Math.min(16, plotWidth - PLOT_PADDING * 2))
          const maxFootprintZ = Math.max(8, Math.min(16, plotDepth - PLOT_PADDING * 2))
          const width = randRange(seedX, seedZ, 2, 8, maxFootprintX)
          const depth = randRange(seedX, seedZ, 3, 8, maxFootprintZ)
          const height = randRange(seedX, seedZ, 4, 18, 95)

          const minCenterX = plotMinX + PLOT_PADDING + width / 2
          const maxCenterX = plotMaxX - PLOT_PADDING - width / 2
          const minCenterZ = plotMinZ + PLOT_PADDING + depth / 2
          const maxCenterZ = plotMaxZ - PLOT_PADDING - depth / 2

          const centerX =
            minCenterX > maxCenterX ? (plotMinX + plotMaxX) / 2 : randRange(seedX, seedZ, 5, minCenterX, maxCenterX)
          const centerZ =
            minCenterZ > maxCenterZ ? (plotMinZ + plotMaxZ) / 2 : randRange(seedX, seedZ, 6, minCenterZ, maxCenterZ)

          const colorIndex = Math.floor(randRange(seedX, seedZ, 7, 0, buildingPalette.length))
          const tower = app.create('prim', {
            type: 'box',
            size: [width, height, depth],
            position: [centerX, SIDEWALK_HEIGHT + height / 2, centerZ],
            color: buildingPalette[Math.min(colorIndex, buildingPalette.length - 1)],
            roughness: 0.35,
            metalness: 0.6,
            physics: 'static',
            castShadow: true,
            receiveShadow: true,
          })
          buildingGroup.add(tower)

          if (hash2(seedX, seedZ, 8) < 0.3) {
            const capHeight = randRange(seedX, seedZ, 9, 1.5, 4)
            const capScale = randRange(seedX, seedZ, 10, 0.45, 0.8)
            const roofCap = app.create('prim', {
              type: 'box',
              size: [width * capScale, capHeight, depth * capScale],
              position: [centerX, SIDEWALK_HEIGHT + height + capHeight / 2, centerZ],
              color: '#252b3e',
              roughness: 0.3,
              metalness: 0.65,
              physics: 'static',
              castShadow: true,
              receiveShadow: true,
            })
            buildingGroup.add(roofCap)
          }

          const neonCount = 1 + Math.floor(randRange(seedX, seedZ, 11, 0, 3))
          for (let n = 0; n < neonCount; n++) {
            const colorPick = Math.floor(randRange(seedX, seedZ, 12 + n, 0, neonPalette.length))
            const neonColor = neonPalette[Math.min(colorPick, neonPalette.length - 1)]
            const bandY = SIDEWALK_HEIGHT + randRange(seedX, seedZ, 16 + n, height * 0.2, Math.max(height * 0.2 + 0.1, height * 0.9))
            const placeOnX = hash2(seedX, seedZ, 20 + n) > 0.5
            const side = hash2(seedX, seedZ, 24 + n) > 0.5 ? 1 : -1

            const neonBand = app.create('prim', {
              type: 'box',
              size: placeOnX ? [0.2, NEON_STRIP_HEIGHT, depth + 0.08] : [width + 0.08, NEON_STRIP_HEIGHT, 0.2],
              position: placeOnX
                ? [centerX + side * (width / 2 + 0.12), bandY, centerZ]
                : [centerX, bandY, centerZ + side * (depth / 2 + 0.12)],
              color: '#1c1c25',
              emissive: neonColor,
              emissiveIntensity: randRange(seedX, seedZ, 30 + n, 2.5, 5),
              roughness: 0.2,
              metalness: 0.15,
              castShadow: false,
              receiveShadow: false,
            })
            decoGroup.add(neonBand)
          }
        }
      }
    }
  }

  app.add(cityGroup)

  function calculateSunDirection(verticalDegrees, horizontalDegrees) {
    const verticalRad = verticalDegrees * DEG2RAD
    const horizontalRad = horizontalDegrees * DEG2RAD
    const x = Math.sin(verticalRad) * Math.sin(horizontalRad)
    const y = -Math.cos(verticalRad) // Negative because 0° should point down
    const z = Math.sin(verticalRad) * Math.cos(horizontalRad)
    return new Vector3(x, y, z)
  }

  function hash2(x, z, salt = 0) {
    const value = Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123
    return value - Math.floor(value)
  }

  function randRange(x, z, salt, min, max) {
    return min + hash2(x, z, salt) * (max - min)
  }
}
