// Procedural NPC style generator
// Given a prng generator, returns a full meshes object with randomized aesthetics.

const PALETTES = [
  { name: "Red Knight",     primary: "#cc3333", secondary: "#882222", skin: "#f0c8a0", accent: "#ffcc44", boots: "#442211", legs: "#553333" },
  { name: "Green Ranger",   primary: "#338833", secondary: "#225522", skin: "#d4a574", accent: "#88cc44", boots: "#332211", legs: "#335533" },
  { name: "Purple Mage",    primary: "#7744aa", secondary: "#553388", skin: "#f0c8a0", accent: "#cc88ff", boots: "#221133", legs: "#443355" },
  { name: "Gold Warrior",   primary: "#cc9933", secondary: "#aa7722", skin: "#c89060", accent: "#ffdd66", boots: "#332211", legs: "#665533" },
  { name: "Dark Assassin",  primary: "#333333", secondary: "#222222", skin: "#f0c8a0", accent: "#cc4444", boots: "#111111", legs: "#2a2a2a" },
  { name: "Blue Guardian",  primary: "#4488cc", secondary: "#3377bb", skin: "#f0c8a0", accent: "#88ccff", boots: "#332211", legs: "#335566" },
  { name: "White Paladin",  primary: "#cccccc", secondary: "#aaaaaa", skin: "#f0c8a0", accent: "#ffdd88", boots: "#443322", legs: "#888888" },
  { name: "Brown Barbarian", primary: "#885533", secondary: "#664422", skin: "#c89060", accent: "#aa8844", boots: "#332211", legs: "#554433" },
];

function buildHelmet(style, p) {
  // style: 0=flat cap, 1=tall helm, 2=horned helm, 3=hood
  const children = [
    // Eyes (always present)
    { size: [0.08, 0.08, 0.05], position: [-0.1, 0.05, -0.2], color: "#222222" },
    { size: [0.08, 0.08, 0.05], position: [0.1, 0.05, -0.2], color: "#222222" },
  ];

  if (style === 0) {
    // Flat cap
    children.push({ size: [0.42, 0.1, 0.42], position: [0, 0.22, 0], color: p.secondary });
    children.push({ size: [0.38, 0.04, 0.2], position: [0, 0.19, -0.24], color: p.secondary });
  } else if (style === 1) {
    // Tall helm
    children.push({ size: [0.42, 0.14, 0.42], position: [0, 0.24, 0], color: p.secondary });
    children.push({ size: [0.3, 0.16, 0.3], position: [0, 0.37, 0], color: p.secondary });
    children.push({ size: [0.38, 0.04, 0.22], position: [0, 0.19, -0.24], color: p.accent });
  } else if (style === 2) {
    // Horned helm
    children.push({ size: [0.42, 0.14, 0.42], position: [0, 0.24, 0], color: p.secondary });
    children.push({ size: [0.38, 0.04, 0.2], position: [0, 0.19, -0.24], color: p.secondary });
    // Horns
    children.push({ size: [0.06, 0.18, 0.06], position: [-0.18, 0.36, 0], color: p.accent, rotation: [0, 0, 0.3] });
    children.push({ size: [0.06, 0.18, 0.06], position: [0.18, 0.36, 0], color: p.accent, rotation: [0, 0, -0.3] });
  } else {
    // Hood
    children.push({ size: [0.44, 0.3, 0.44], position: [0, 0.16, 0.02], color: p.primary });
  }

  return children;
}

function buildWeapon(style, p) {
  // style: 0=sword, 1=axe, 2=mace, 3=spear
  if (style === 0) {
    return [
      { size: [0.06, 0.22, 0.06], position: [0, -0.24, 0], color: "#553311" },
      { size: [0.18, 0.03, 0.06], position: [0, -0.14, 0], color: "#888888" },
      { size: [0.06, 0.45, 0.02], position: [0, -0.5, 0], color: "#cccccc", emissive: "#cccccc", emissiveIntensity: 1 },
      { size: [0.06, 0.06, 0.02], position: [0, -0.74, 0], color: "#dddddd", emissive: "#dddddd", emissiveIntensity: 1 },
    ];
  } else if (style === 1) {
    // Axe — handle + head
    return [
      { size: [0.05, 0.5, 0.05], position: [0, -0.38, 0], color: "#664422" },
      { size: [0.2, 0.2, 0.04], position: [0.06, -0.6, 0], color: "#999999", emissive: "#999999", emissiveIntensity: 0.5 },
    ];
  } else if (style === 2) {
    // Mace — handle + ball
    return [
      { size: [0.05, 0.45, 0.05], position: [0, -0.36, 0], color: "#664422" },
      { size: [0.14, 0.14, 0.14], position: [0, -0.62, 0], color: "#777777", emissive: "#777777", emissiveIntensity: 0.5 },
    ];
  } else {
    // Spear — long shaft + tip
    return [
      { size: [0.04, 0.7, 0.04], position: [0, -0.48, 0], color: "#664422" },
      { size: [0.06, 0.14, 0.02], position: [0, -0.86, 0], color: "#cccccc", emissive: "#cccccc", emissiveIntensity: 1 },
    ];
  }
}

export function generateStyle(rng) {
  const palette = PALETTES[rng(0, PALETTES.length - 1)];

  // Armor weight: 0=light, 1=medium, 2=heavy
  const weight = rng(0, 2);
  const bulk = 1 + weight * 0.1;

  const helmetStyle = rng(0, 3);
  const weaponStyle = rng(0, 3);

  // Accessory chances
  const hasShoulderPads = rng(0, 100) < 50;
  const hasShield = rng(0, 100) < 35;
  const hasBelt = rng(0, 100) < 45;

  // Build chest
  const chestChildren = [
    // Collar
    { size: [0.44, 0.08, 0.28], position: [0, 0.27, 0], color: palette.secondary },
    // Belt line
    { size: [0.5, 0.06, 0.31], position: [0, -0.28, 0], color: "#664422" },
  ];
  if (hasBelt) {
    chestChildren.push({ size: [0.1, 0.08, 0.08], position: [0, -0.28, -0.16], color: palette.accent });
  }

  // Shoulder pads
  const upperArmLChildren = hasShoulderPads
    ? [{ size: [0.26, 0.1, 0.26], position: [0, 0.04, 0], color: palette.secondary }]
    : undefined;
  const upperArmRChildren = hasShoulderPads
    ? [{ size: [0.26, 0.1, 0.26], position: [0, 0.04, 0], color: palette.secondary }]
    : undefined;

  // Shield on left arm
  const lowerArmLChildren = hasShield
    ? [{ size: [0.26, 0.3, 0.04], position: [0, -0.08, -0.12], color: palette.accent }]
    : undefined;

  const meshes = {
    chest: {
      size: [0.5 * bulk, 0.6, 0.3 * bulk],
      color: palette.primary,
      physics: "kinematic",
      children: chestChildren,
    },
    head: {
      size: [0.4, 0.4, 0.4],
      position: [0, 0.25, 0],
      color: palette.skin,
      physics: "kinematic",
      children: buildHelmet(helmetStyle, palette),
    },
    upperArm_L: {
      size: [0.2 * bulk, 0.28, 0.2 * bulk],
      position: [0, -0.14, 0],
      color: palette.primary,
      children: upperArmLChildren,
    },
    lowerArm_L: {
      size: [0.18, 0.26, 0.18],
      position: [0, -0.13, 0],
      color: palette.skin,
      children: lowerArmLChildren,
    },
    upperArm_R: {
      size: [0.2 * bulk, 0.28, 0.2 * bulk],
      position: [0, -0.14, 0],
      color: palette.primary,
      children: upperArmRChildren,
    },
    lowerArm_R: {
      size: [0.18, 0.26, 0.18],
      position: [0, -0.13, 0],
      color: palette.skin,
      children: buildWeapon(weaponStyle, palette),
    },
    upperLeg_L: {
      size: [0.2 * bulk, 0.28, 0.2 * bulk],
      position: [0, -0.14, 0],
      color: palette.legs,
    },
    lowerLeg_L: {
      size: [0.2, 0.27, 0.2],
      position: [0, -0.135, 0],
      color: palette.legs,
    },
    foot_L: {
      size: [0.22, 0.08, 0.26],
      position: [0, -0.04, -0.02],
      color: palette.boots,
    },
    upperLeg_R: {
      size: [0.2 * bulk, 0.28, 0.2 * bulk],
      position: [0, -0.14, 0],
      color: palette.legs,
    },
    lowerLeg_R: {
      size: [0.2, 0.27, 0.2],
      position: [0, -0.135, 0],
      color: palette.legs,
    },
    foot_R: {
      size: [0.22, 0.08, 0.26],
      position: [0, -0.04, -0.02],
      color: palette.boots,
    },
  };

  return meshes;
}
