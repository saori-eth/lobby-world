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
  const ROAD_LINE_THICKNESS = 0.012
  const ROAD_LINE_Y = 0.03 + ROAD_LINE_THICKNESS / 2 + 0.001
  const ROAD_LINE_CROSSING_OFFSET = 0.003
  const DETAIL_SURFACE_OFFSET = 0.04
  const GRID_STEP = ROAD_WIDTH + BLOCK_SIZE
  const ROAD_COUNT = 10

  const buildingPalette = ['#0b0f1a', '#121826', '#1a1f33', '#161425', '#1d2338']
  const neonPalette = ['#00e5ff', '#ff2bd6', '#7a5cff']
  const windowPalette = ['#8fd9ff', '#c2f6ff', '#ffe3a1', '#ffc9f0']

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
        size: [CITY_SIZE, ROAD_LINE_THICKNESS, 0.2],
        position: [0, ROAD_LINE_Y, center + side * laneOffset],
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
        size: [0.2, ROAD_LINE_THICKNESS, CITY_SIZE],
        position: [center + side * laneOffset, ROAD_LINE_Y + ROAD_LINE_CROSSING_OFFSET, 0],
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
          const towerColor = buildingPalette[Math.min(colorIndex, buildingPalette.length - 1)]
          const tower = app.create('prim', {
            type: 'box',
            size: [width, height, depth],
            position: [centerX, SIDEWALK_HEIGHT + height / 2, centerZ],
            color: towerColor,
            roughness: 0.35,
            metalness: 0.6,
            physics: 'static',
            castShadow: true,
            receiveShadow: true,
          })
          buildingGroup.add(tower)
          addTowerWindows(centerX, centerZ, width, depth, height, seedX, seedZ)

          const towerBaseY = SIDEWALK_HEIGHT
          const towerTopY = towerBaseY + height
          let roofBaseY = towerTopY

          if (hash2(seedX, seedZ, 40) > 0.15) {
            const podiumHeight = randRange(seedX, seedZ, 41, 1.4, Math.min(4.5, Math.max(2.2, height * 0.18)))
            const desiredPodiumWidth = width + randRange(seedX, seedZ, 42, 0.6, 1.6)
            const desiredPodiumDepth = depth + randRange(seedX, seedZ, 43, 0.6, 1.6)
            const maxPodiumWidth = Math.max(width, (Math.min(centerX - plotMinX, plotMaxX - centerX) - 0.2) * 2)
            const maxPodiumDepth = Math.max(depth, (Math.min(centerZ - plotMinZ, plotMaxZ - centerZ) - 0.2) * 2)
            const podiumWidth = Math.min(desiredPodiumWidth, maxPodiumWidth)
            const podiumDepth = Math.min(desiredPodiumDepth, maxPodiumDepth)

            const podium = app.create('prim', {
              type: 'box',
              size: [podiumWidth, podiumHeight, podiumDepth],
              position: [centerX, towerBaseY + podiumHeight / 2, centerZ],
              color: '#202638',
              roughness: 0.4,
              metalness: 0.5,
              physics: 'static',
              castShadow: true,
              receiveShadow: true,
            })
            buildingGroup.add(podium)
          }

          if (height > 24 && hash2(seedX, seedZ, 44) > 0.22) {
            const tierHeight = randRange(seedX, seedZ, 45, Math.max(3.5, height * 0.1), Math.max(6.5, height * 0.28))
            const tierScaleX = randRange(seedX, seedZ, 46, 0.58, 0.86)
            const tierScaleZ = randRange(seedX, seedZ, 47, 0.58, 0.86)
            const upperTier = app.create('prim', {
              type: 'box',
              size: [width * tierScaleX, tierHeight, depth * tierScaleZ],
              position: [centerX, roofBaseY + tierHeight / 2, centerZ],
              color: '#232b40',
              roughness: 0.32,
              metalness: 0.62,
              physics: 'static',
              castShadow: true,
              receiveShadow: true,
            })
            buildingGroup.add(upperTier)
            roofBaseY += tierHeight
          }

          if (hash2(seedX, seedZ, 48) > 0.35) {
            const ribsOnX = hash2(seedX, seedZ, 49) > 0.5
            const ribHeight = Math.max(6, height - randRange(seedX, seedZ, 50, 2, 8))
            const ribY = towerBaseY + ribHeight / 2 + 0.8
            const ribThickness = randRange(seedX, seedZ, 51, 0.12, 0.2)
            const ribColor = '#2a3550'

            if (ribsOnX) {
              const xOffset = width / 2 + ribThickness / 2 + DETAIL_SURFACE_OFFSET
              const ribSize = [ribThickness, ribHeight, Math.max(2, depth - 0.5)]

              const leftRib = app.create('prim', {
                type: 'box',
                size: ribSize,
                position: [centerX - xOffset, ribY, centerZ],
                color: ribColor,
                roughness: 0.24,
                metalness: 0.3,
                castShadow: false,
                receiveShadow: false,
              })
              const rightRib = app.create('prim', {
                type: 'box',
                size: ribSize,
                position: [centerX + xOffset, ribY, centerZ],
                color: ribColor,
                roughness: 0.24,
                metalness: 0.3,
                castShadow: false,
                receiveShadow: false,
              })
              decoGroup.add(leftRib)
              decoGroup.add(rightRib)
            } else {
              const zOffset = depth / 2 + ribThickness / 2 + DETAIL_SURFACE_OFFSET
              const ribSize = [Math.max(2, width - 0.5), ribHeight, ribThickness]

              const frontRib = app.create('prim', {
                type: 'box',
                size: ribSize,
                position: [centerX, ribY, centerZ - zOffset],
                color: ribColor,
                roughness: 0.24,
                metalness: 0.3,
                castShadow: false,
                receiveShadow: false,
              })
              const backRib = app.create('prim', {
                type: 'box',
                size: ribSize,
                position: [centerX, ribY, centerZ + zOffset],
                color: ribColor,
                roughness: 0.24,
                metalness: 0.3,
                castShadow: false,
                receiveShadow: false,
              })
              decoGroup.add(frontRib)
              decoGroup.add(backRib)
            }
          }

          if (hash2(seedX, seedZ, 8) < 0.3) {
            const capHeight = randRange(seedX, seedZ, 9, 1.5, 4)
            const capScale = randRange(seedX, seedZ, 10, 0.45, 0.8)
            const roofCap = app.create('prim', {
              type: 'box',
              size: [width * capScale, capHeight, depth * capScale],
              position: [centerX, roofBaseY + capHeight / 2, centerZ],
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
              emissiveIntensity: randRange(seedX, seedZ, 30 + n, 0.9, 1.8),
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

  function addTowerWindows(centerX, centerZ, width, depth, height, seedX, seedZ) {
    if (height < 10) return

    const stripCountX = 2 + Math.floor(randRange(seedX, seedZ, 52, 0, 3))
    const stripCountZ = 2 + Math.floor(randRange(seedX, seedZ, 53, 0, 3))
    const bottomInset = randRange(seedX, seedZ, 54, 1.2, 2.2)
    const topInset = randRange(seedX, seedZ, 55, 1.8, 4.6)
    const stripHeight = Math.max(2, height - bottomInset - topInset)
    const stripY = SIDEWALK_HEIGHT + bottomInset + stripHeight / 2
    const stripThickness = 0.08
    const facadeOffset = DETAIL_SURFACE_OFFSET + stripThickness / 2 + 0.005
    const litChance = randRange(seedX, seedZ, 56, 0.55, 0.88)
    const emissiveIntensity = randRange(seedX, seedZ, 57, 0.45, 1.05)
    const widthMargin = Math.min(0.9, width * 0.2)
    const depthMargin = Math.min(0.9, depth * 0.2)
    const stripWidthX = Math.max(0.35, Math.min(1.1, (width - widthMargin * 2) / (stripCountX * 1.5)))
    const stripWidthZ = Math.max(0.35, Math.min(1.1, (depth - depthMargin * 2) / (stripCountZ * 1.5)))

    const addWindowStrip = (size, position, salt) => {
      const lit = hash2(seedX, seedZ, salt) < litChance
      const colorPick = Math.floor(randRange(seedX, seedZ, salt + 1, 0, windowPalette.length))
      const windowColor = windowPalette[Math.min(colorPick, windowPalette.length - 1)]

      const strip = app.create('prim', {
        type: 'box',
        size,
        position,
        color: lit ? '#202736' : '#111420',
        emissive: lit ? windowColor : '#06080d',
        emissiveIntensity: lit ? emissiveIntensity : 0.02,
        roughness: lit ? 0.18 : 0.45,
        metalness: 0.15,
        castShadow: false,
        receiveShadow: false,
      })
      decoGroup.add(strip)
    }

    const xSpan = Math.max(0, width - widthMargin * 2)
    const zSpan = Math.max(0, depth - depthMargin * 2)

    for (let i = 0; i < stripCountX; i++) {
      const t = stripCountX === 1 ? 0.5 : i / (stripCountX - 1)
      const x = -xSpan / 2 + xSpan * t
      addWindowStrip(
        [stripWidthX, stripHeight, stripThickness],
        [centerX + x, stripY, centerZ + depth / 2 + facadeOffset],
        60 + i * 2
      )
      addWindowStrip(
        [stripWidthX, stripHeight, stripThickness],
        [centerX + x, stripY, centerZ - depth / 2 - facadeOffset],
        61 + i * 2
      )
    }

    for (let i = 0; i < stripCountZ; i++) {
      const t = stripCountZ === 1 ? 0.5 : i / (stripCountZ - 1)
      const z = -zSpan / 2 + zSpan * t
      addWindowStrip(
        [stripThickness, stripHeight, stripWidthZ],
        [centerX + width / 2 + facadeOffset, stripY, centerZ + z],
        120 + i * 2
      )
      addWindowStrip(
        [stripThickness, stripHeight, stripWidthZ],
        [centerX - width / 2 - facadeOffset, stripY, centerZ + z],
        121 + i * 2
      )
    }

    const bandCount = height > 45 ? 2 : 1
    for (let i = 0; i < bandCount; i++) {
      const bandY = SIDEWALK_HEIGHT + height * (0.32 + i * 0.24)
      if (bandY >= SIDEWALK_HEIGHT + height - 2) continue
      const colorPick = Math.floor(randRange(seedX, seedZ, 180 + i, 0, windowPalette.length))
      const bandColor = windowPalette[Math.min(colorPick, windowPalette.length - 1)]
      const bandIntensity = randRange(seedX, seedZ, 190 + i, 0.35, 0.75)

      const frontBand = app.create('prim', {
        type: 'box',
        size: [width + 0.02, 0.18, stripThickness],
        position: [centerX, bandY, centerZ + depth / 2 + facadeOffset],
        color: '#1a1f2f',
        emissive: bandColor,
        emissiveIntensity: bandIntensity,
        roughness: 0.2,
        metalness: 0.15,
        castShadow: false,
        receiveShadow: false,
      })
      const backBand = app.create('prim', {
        type: 'box',
        size: [width + 0.02, 0.18, stripThickness],
        position: [centerX, bandY, centerZ - depth / 2 - facadeOffset],
        color: '#1a1f2f',
        emissive: bandColor,
        emissiveIntensity: bandIntensity,
        roughness: 0.2,
        metalness: 0.15,
        castShadow: false,
        receiveShadow: false,
      })
      const rightBand = app.create('prim', {
        type: 'box',
        size: [stripThickness, 0.18, depth + 0.02],
        position: [centerX + width / 2 + facadeOffset, bandY, centerZ],
        color: '#1a1f2f',
        emissive: bandColor,
        emissiveIntensity: bandIntensity,
        roughness: 0.2,
        metalness: 0.15,
        castShadow: false,
        receiveShadow: false,
      })
      const leftBand = app.create('prim', {
        type: 'box',
        size: [stripThickness, 0.18, depth + 0.02],
        position: [centerX - width / 2 - facadeOffset, bandY, centerZ],
        color: '#1a1f2f',
        emissive: bandColor,
        emissiveIntensity: bandIntensity,
        roughness: 0.2,
        metalness: 0.15,
        castShadow: false,
        receiveShadow: false,
      })

      decoGroup.add(frontBand)
      decoGroup.add(backBand)
      decoGroup.add(rightBand)
      decoGroup.add(leftBand)
    }
  }

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
