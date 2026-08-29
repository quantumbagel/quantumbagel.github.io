export const BG_ENABLED_KEY = "particle-background-enabled";
export const BG_MODE_KEY = "particle-background-mode";
export const BG_PARAMS_KEY = "particle-background-params";
export const BG_RANDOM_KEY = "particle-background-random";

export const MOBILE_BREAKPOINT = 768;
export const REF_VIEW_AREA = 1280 * 800;
export const CANVAS_FADE_MS = 450;
export const MOUSE_RADIUS = 170;
export const BLAST_RADIUS = 420;
export const MAX_SPEED = 8;
export const LAUNCH_SPEED = 20;
export const MAX_SPIN = 0.22;
export const REF_FPS = 60;
export const BOND = 16;
export const FOCAL = 170;
export const DEPTH_OFFSET = 55;
export const SPRITE_SIZE = 64;
export const KIND_C = 0;
export const KIND_HETERO = 1;
export const KIND_H = 2;
export const ATOM_RADIUS = [5.8, 6.6, 3.4];
export const CONTENT_MAX_WIDTH = 768;
export const GUTTER_MIN_WIDTH = 900;
export const PATH_CAP = 360;
export const INTERACTIVE_SELECTOR =
    "a, button, input, textarea, select, label, [role='button'], .project-card, .modal-close-btn, #bg-sim-panel, #particle-toggle";

export const MODES = [
    "molecules",
    "network",
    "orbits",
    "stars",
    "epicycles",
    "aurora",
    "pendulum",
    "crystal",
    "flock",
    "field",
    "rain",
    "life",
];

export const MODE_LABELS = {
    molecules: "Molecules",
    network: "Network",
    orbits: "Orbits",
    stars: "Stars",
    epicycles: "Epicycles",
    aurora: "Aurora",
    pendulum: "Pendulum",
    crystal: "Crystal",
    flock: "Flock",
    field: "Field",
    rain: "Rain",
    life: "Life",
};

export const MODE_HINTS = {
    molecules: "Grab a molecule and fling it. Click empty space to scatter them.",
    network: "The original background. it's pretty cool.",
    orbits: "Would be a real shame if something happened in 22 minutes.",
    stars: "*copyrighted music plays*",
    epicycles: "Grab the wheels and throw them. Click to spin the arms.",
    aurora: "Move the pointer to warp the curtain. Click to rumple it.",
    pendulum: "Drag a bob to wind it up, or toss the whole thing. Click to yeet.",
    crystal: "Grab a lattice and throw it. Click to scatter them.",
    flock: "Peer pressure be like",
    field: "Streamlines on a vector field. Move the pointer to stir, click to blow a gust.",
    rain: "l33t hack3r",
    life: "Conway's Game of Life, my favorite simulation :D",
};

export const DEFAULT_PARAMS = {
    frost: 0.7,
    molecules: { density: 1, size: 1, spin: 1, mouse: 1 },
    network: { density: 1, links: 1, speed: 1, mouse: 1 },
    orbits: { density: 1, speed: 1, spread: 1 },
    stars: { density: 1, speed: 1, streak: 0.75 },
    epicycles: { density: 1, speed: 1, arms: 1 },
    aurora: { density: 1, speed: 1, spread: 1 },
    pendulum: { density: 1, speed: 1, energy: 1 },
    crystal: { density: 1, speed: 1, size: 1 },
    flock: { density: 1, speed: 1, cohesion: 1 },
    field: { density: 1, speed: 1, swirl: 1 },
    rain: { density: 1, speed: 1.5, length: 1.5 },
    life: { density: 1, speed: 1, size: 1 },
};

const P = (key, label, min, max, extra) => ({ key, label, min, max, step: 0.25, ...extra });

export const PARAM_FIELDS = {
    molecules: [
        P("density", "Density", 0.25, 8),
        P("size", "Size", 0.25, 4),
        P("spin", "Spin", 0, 4),
        P("mouse", "Mouse", 0, 4),
    ],
    network: [
        P("density", "Density", 0.25, 8),
        P("links", "Links", 0.25, 4),
        P("speed", "Speed", 0.25, 4),
        P("mouse", "Mouse", 0, 4),
    ],
    orbits: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("spread", "Spread", 0.25, 4),
    ],
    stars: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("streak", "Streak", 0, 2),
    ],
    epicycles: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("arms", "Arms", 0.25, 4),
    ],
    aurora: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("spread", "Spread", 0.25, 4),
    ],
    pendulum: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("energy", "Energy", 0.25, 4),
    ],
    crystal: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("size", "Size", 0.25, 4),
    ],
    flock: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("cohesion", "Cohesion", 0.25, 4),
    ],
    field: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("swirl", "Swirl", 0.25, 4),
    ],
    rain: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0.25, 4),
        P("length", "Length", 0.25, 4),
    ],
    life: [
        P("density", "Density", 0.25, 8),
        P("speed", "Speed", 0, 4, { floor: 0 }),
        P("size", "Size", 0.25, 4),
    ],
};

export const COUNT_CAPS = {
    molecules: 3000,
    network: 10000,
    orbits: 1000,
    stars: 8000,
    epicycles: 600,
    pendulum: 400,
    crystal: 600,
    flock: 10000,
    field: 12000,
    aurora: 64,
    rain: 1500,
    life: 200000,
};

export const BAKED_PALETTES = {
    light: {
        particleRgb: { r: 46, g: 46, b: 46 },
        hoverAccentRgb: { r: 200, g: 68, b: 48 },
        bgRgb: { r: 248, g: 248, b: 248 },
    },
    dark: {
        particleRgb: { r: 212, g: 212, b: 217 },
        hoverAccentRgb: { r: 72, g: 212, b: 230 },
        bgRgb: { r: 32, g: 34, b: 38 },
    },
};
