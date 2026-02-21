export default (world, app, fetch, props, setTimeout) => {
  const floor = app.create('prim', {
    type: 'box',
    size: [2.5, 0.2, 2.5],
    position: [0, 0.1, 0],
    color: '#3f3f46',
    physics: 'static',
  })

  const ball = app.create('prim', {
    type: 'sphere',
    size: [0.2],
    position: [0, 1.6, 0],
    color: '#60a5fa',
    emissive: '#1d4ed8',
    emissiveIntensity: 0.5,
    physics: 'dynamic',
    mass: 1,
    restitution: 0.35,
    linearDamping: 0.05,
    angularDamping: 0.05,
  })

  const stateLight = app.create('prim', {
    type: 'box',
    size: [0.15, 0.15, 0.15],
    position: [0, 1.25, 0.6],
    color: '#ef4444',
    emissive: '#ef4444',
    emissiveIntensity: 0.4,
  })

  let hidden = false
  let toggleAction

  const applyHidden = value => {
    const player = world.getPlayer()
    if (!player?.local) return
    hidden = !!value
    player.setLocalMeshHidden('fps', hidden)
    player.firstPerson(hidden)
    if (toggleAction) {
      toggleAction.label = hidden ? 'Show Local Mesh' : 'Hide Local Mesh (FPS)'
    }
    stateLight.color = hidden ? '#22c55e' : '#ef4444'
    stateLight.emissive = stateLight.color
  }

  toggleAction = app.create('action', {
    label: 'Hide Local Mesh (FPS)',
    distance: 4,
    duration: 0.1,
    position: [0, 1.1, 0.9],
    onTrigger: () => {
      applyHidden(!hidden)
    },
  })

  app.add(floor)
  app.add(ball)
  app.add(stateLight)
  app.add(toggleAction)

  app.on('destroy', () => {
    if (hidden) {
      const player = world.getPlayer()
      if (player?.local) {
        player.setLocalMeshHidden('fps', false)
        player.firstPerson(false)
      }
    }
  })
}
