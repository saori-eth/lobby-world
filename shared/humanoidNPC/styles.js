// Procedural NPC style generator
// Given a prng generator, returns a full meshes object with randomized aesthetics.

const BASE_PALETTES = [
  { name: "Cobalt", primary: "#13284a", secondary: "#29426c", legs: "#1f3556", boots: "#090f1b" },
  { name: "Crimson", primary: "#3a1722", secondary: "#572532", legs: "#4a212d", boots: "#14080c" },
  { name: "Emerald", primary: "#103127", secondary: "#23513f", legs: "#1a4233", boots: "#08150f" },
  { name: "Amber", primary: "#3d2a13", secondary: "#5b3f21", legs: "#4f361d", boots: "#161007" },
  { name: "Violet", primary: "#26143e", secondary: "#3e2462", legs: "#331d52", boots: "#11091b" },
  { name: "Steel", primary: "#1d252f", secondary: "#334253", legs: "#283545", boots: "#0d1218" },
  { name: "Magenta", primary: "#3b1634", secondary: "#59274d", legs: "#4a2141", boots: "#150a13" },
  { name: "Teal", primary: "#11303a", secondary: "#24505e", legs: "#1b424f", boots: "#081318" },
  { name: "Orange", primary: "#3e2217", secondary: "#5f3827", legs: "#4f2f22", boots: "#170d09" },
  { name: "Graphite", primary: "#1a1a1f", secondary: "#30303a", legs: "#26262f", boots: "#0f0f12" },
  { name: "Lime", primary: "#243312", secondary: "#3f5924", legs: "#33491d", boots: "#111709" },
  { name: "Sky", primary: "#142c40", secondary: "#274763", legs: "#1f3a53", boots: "#09111a" },
];

const SKIN_TONES = [
  "#e7c5a4",
  "#ddb894",
  "#d2a980",
  "#c99870",
  "#bf8962",
  "#b57b58",
];

const NEON_COLORS = [
  "#00e5ff",
  "#33f0ff",
  "#26f7ff",
  "#00ffc3",
  "#6bff2c",
  "#f5ff52",
  "#ffe100",
  "#ff7a00",
  "#ff4a4a",
  "#ff2f92",
  "#ff57ff",
  "#9f5cff",
  "#6a7dff",
  "#3f8fff",
];

function pickPalette(rng) {
  const base = BASE_PALETTES[rng(0, BASE_PALETTES.length - 1)];
  const skin = SKIN_TONES[rng(0, SKIN_TONES.length - 1)];
  const glow = NEON_COLORS[rng(0, NEON_COLORS.length - 1)];

  let accent2 = NEON_COLORS[rng(0, NEON_COLORS.length - 1)];
  if (accent2 === glow) {
    accent2 = NEON_COLORS[(NEON_COLORS.indexOf(glow) + 4) % NEON_COLORS.length];
  }

  return {
    ...base,
    skin,
    accent: glow,
    accent2,
    glow,
  };
}

function glow(color, intensity) {
  if (!color || !(intensity > 0)) return {};
  return { emissive: color, emissiveIntensity: intensity };
}

function buildHelmet(style, p, glowColor, eyeGlow, trimGlow) {
  // style: 0=visor cap, 1=signal crown, 2=data horns, 3=hood shell
  const children = [
    // Eyes (always present)
    {
      size: [0.08, 0.08, 0.05],
      position: [-0.1, 0.05, -0.2],
      color: glowColor,
      ...glow(glowColor, eyeGlow),
    },
    {
      size: [0.08, 0.08, 0.05],
      position: [0.1, 0.05, -0.2],
      color: glowColor,
      ...glow(glowColor, eyeGlow),
    },
  ];

  if (style === 0) {
    children.push({ size: [0.42, 0.1, 0.42], position: [0, 0.22, 0], color: p.secondary });
    children.push({
      size: [0.36, 0.04, 0.22],
      position: [0, 0.19, -0.23],
      color: p.accent2,
      ...glow(glowColor, trimGlow),
    });
  } else if (style === 1) {
    children.push({ size: [0.42, 0.14, 0.42], position: [0, 0.24, 0], color: p.secondary });
    children.push({ size: [0.3, 0.16, 0.3], position: [0, 0.37, 0], color: p.secondary });
    children.push({
      size: [0.04, 0.2, 0.04],
      position: [-0.12, 0.46, 0],
      color: p.accent,
      ...glow(glowColor, trimGlow),
    });
    children.push({
      size: [0.04, 0.2, 0.04],
      position: [0.12, 0.46, 0],
      color: p.accent,
      ...glow(glowColor, trimGlow),
    });
  } else if (style === 2) {
    children.push({ size: [0.42, 0.14, 0.42], position: [0, 0.24, 0], color: p.secondary });
    children.push({
      size: [0.06, 0.18, 0.06],
      position: [-0.18, 0.36, 0],
      color: p.accent,
      rotation: [0, 0, 0.3],
      ...glow(glowColor, trimGlow),
    });
    children.push({
      size: [0.06, 0.18, 0.06],
      position: [0.18, 0.36, 0],
      color: p.accent,
      rotation: [0, 0, -0.3],
      ...glow(glowColor, trimGlow),
    });
  } else {
    children.push({ size: [0.44, 0.3, 0.44], position: [0, 0.16, 0.02], color: p.primary });
    children.push({
      size: [0.32, 0.12, 0.08],
      position: [0, 0.12, -0.18],
      color: p.accent2,
      ...glow(glowColor, trimGlow),
    });
  }

  return children;
}

function buildWeapon(style, p, glowColor, weaponGlow) {
  // style: 0=mono blade, 1=pulse axe, 2=shock mace, 3=rail spear
  if (style === 0) {
    return [
      { size: [0.06, 0.22, 0.06], position: [0, -0.24, 0], color: "#202635" },
      { size: [0.18, 0.03, 0.06], position: [0, -0.14, 0], color: p.secondary },
      {
        size: [0.06, 0.45, 0.02],
        position: [0, -0.5, 0],
        color: p.accent2,
        ...glow(glowColor, weaponGlow),
      },
      {
        size: [0.02, 0.45, 0.01],
        position: [0, -0.5, -0.016],
        color: glowColor,
        ...glow(glowColor, weaponGlow + 1),
      },
    ];
  } else if (style === 1) {
    return [
      { size: [0.05, 0.5, 0.05], position: [0, -0.38, 0], color: "#202635" },
      {
        size: [0.2, 0.2, 0.04],
        position: [0.06, -0.6, 0],
        color: p.accent2,
        ...glow(glowColor, weaponGlow),
      },
    ];
  } else if (style === 2) {
    return [
      { size: [0.05, 0.45, 0.05], position: [0, -0.36, 0], color: "#202635" },
      {
        size: [0.14, 0.14, 0.14],
        position: [0, -0.62, 0],
        color: p.accent,
        ...glow(glowColor, weaponGlow),
      },
      {
        size: [0.04, 0.18, 0.04],
        position: [0, -0.62, 0],
        color: glowColor,
        ...glow(glowColor, weaponGlow + 0.8),
      },
    ];
  }
  return [
    { size: [0.04, 0.7, 0.04], position: [0, -0.48, 0], color: "#202635" },
    {
      size: [0.06, 0.14, 0.02],
      position: [0, -0.86, 0],
      color: p.accent2,
      ...glow(glowColor, weaponGlow),
    },
    {
      size: [0.02, 0.7, 0.01],
      position: [0, -0.48, -0.016],
      color: glowColor,
      ...glow(glowColor, weaponGlow + 0.8),
    },
  ];
}

export function generateStyle(rng, options = {}) {
  const palette = pickPalette(rng);
  const weaponGlow = Math.max(0, Number(options.emissiveIntensity ?? 2.8));
  const eyeGlow = Math.max(0, Number(options.eyeEmissiveIntensity ?? 4.5));
  const trimGlow = Math.max(
    0,
    Number(options.trimEmissiveIntensity ?? Math.max(1.2, weaponGlow * 0.65)),
  );
  const glowColor = options.emissiveColor || palette.glow || palette.accent;

  // Armor weight: 0=light, 1=medium, 2=heavy
  const weight = rng(0, 2);
  const bulk = 1 + weight * 0.1;

  const helmetStyle = rng(0, 3);
  const weaponStyle = rng(0, 3);

  // Accessory chances
  const hasShoulderPads = rng(0, 100) < 70;
  const hasShield = rng(0, 100) < 45;
  const hasBelt = rng(0, 100) < 55;

  // Build chest
  const chestChildren = [
    { size: [0.44, 0.08, 0.28], position: [0, 0.27, 0], color: palette.secondary },
    { size: [0.5, 0.06, 0.31], position: [0, -0.28, 0], color: "#0e131d" },
    {
      size: [0.42, 0.04, 0.02],
      position: [0, 0.02, -0.16],
      color: glowColor,
      ...glow(glowColor, trimGlow),
    },
    {
      size: [0.08, 0.08, 0.03],
      position: [0, 0.12, -0.16],
      color: palette.accent2,
      ...glow(glowColor, weaponGlow),
    },
  ];
  if (hasBelt) {
    chestChildren.push({
      size: [0.1, 0.08, 0.08],
      position: [0, -0.28, -0.16],
      color: palette.accent,
      ...glow(glowColor, trimGlow),
    });
  }

  // Shoulder pads
  const upperArmLChildren = hasShoulderPads
    ? [
        { size: [0.26, 0.1, 0.26], position: [0, 0.04, 0], color: palette.secondary },
        {
          size: [0.16, 0.03, 0.22],
          position: [0, 0.08, -0.02],
          color: palette.accent,
          ...glow(glowColor, trimGlow),
        },
      ]
    : undefined;
  const upperArmRChildren = hasShoulderPads
    ? [
        { size: [0.26, 0.1, 0.26], position: [0, 0.04, 0], color: palette.secondary },
        {
          size: [0.16, 0.03, 0.22],
          position: [0, 0.08, -0.02],
          color: palette.accent,
          ...glow(glowColor, trimGlow),
        },
      ]
    : undefined;

  // Shield on left arm
  const lowerArmLChildren = hasShield
    ? [
        {
          size: [0.26, 0.3, 0.04],
          position: [0, -0.08, -0.12],
          color: palette.secondary,
        },
        {
          size: [0.18, 0.22, 0.02],
          position: [0, -0.08, -0.145],
          color: palette.accent2,
          ...glow(glowColor, trimGlow),
        },
      ]
    : undefined;

  const legGlowStripe = {
    size: [0.03, 0.2, 0.02],
    position: [0.07, -0.02, -0.1],
    color: glowColor,
    ...glow(glowColor, trimGlow),
  };

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
      children: buildHelmet(helmetStyle, palette, glowColor, eyeGlow, trimGlow),
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
      color: palette.secondary,
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
      color: palette.secondary,
      children: buildWeapon(weaponStyle, palette, glowColor, weaponGlow),
    },
    upperLeg_L: {
      size: [0.2 * bulk, 0.28, 0.2 * bulk],
      position: [0, -0.14, 0],
      color: palette.legs,
      children: [legGlowStripe],
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
      children: [legGlowStripe],
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
