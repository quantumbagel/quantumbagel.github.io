(function () {
    "use strict";

    const BG_ENABLED_KEY = "particle-background-enabled";
    const BG_MODE_KEY = "particle-background-mode";
    const BG_PARAMS_KEY = "particle-background-params";
    const BG_RANDOM_KEY = "particle-background-random";
    const MOBILE_BREAKPOINT = 768;
    const CANVAS_FADE_MS = 450;
    const MOUSE_RADIUS = 170;
    const BLAST_RADIUS = 420;
    const MAX_SPEED = 8;
    const MAX_SPIN = 0.22;
    const REF_FPS = 60;
    const BOND = 16;
    const FOCAL = 170;
    const DEPTH_OFFSET = 55;
    const SPRITE_SIZE = 64;
    const KIND_C = 0;
    const KIND_HETERO = 1;
    const KIND_H = 2;
    const ATOM_RADIUS = [5.8, 6.6, 3.4];
    const CONTENT_MAX_WIDTH = 768;
    const GUTTER_MIN_WIDTH = 900;
    const INTERACTIVE_SELECTOR =
        "a, button, input, textarea, select, label, [role='button'], .project-card, .modal-close-btn, #bg-sim-panel, #particle-toggle";
    const MODES = [
        "molecules",
        "network",
        "orbits",
        "stars",
        "epicycles",
        "harmonograph",
        "aurora",
        "pendulum",
        "crystal",
        "flock",
        "field",
        "rain",
        "life",
    ];
    const MODE_LABELS = {
        molecules: "Molecules",
        network: "Network",
        orbits: "Orbits",
        stars: "Stars",
        epicycles: "Epicycles",
        harmonograph: "Harmonic",
        aurora: "Aurora",
        pendulum: "Pendulum",
        crystal: "Crystal",
        flock: "Flock",
        field: "Field",
        rain: "Rain",
        life: "Life",
    };
    const MODE_HINTS = {
        molecules: "Drag molecules anywhere, and click empty space to scatter them.",
        network: "The original background. it's pretty cool.",
        orbits: "Would be a real shame if something happened in 22 minutes.",
        stars: "*copyrighted music plays*",
        epicycles: "Fourier wheels drawing a path",
        harmonograph: "Traces that slowly decay. Click to add force.",
        aurora: "Move the pointer to warp the curtain. Click to rumple it.",
        pendulum: "Just some double pendulums. Click to yeet.",
        crystal: "3D lattices. You can yeet them.",
        flock: "Peer pressure be like",
        field: "Streamlines on a vector field. Move the pointer to stir, click to blow a gust.",
        rain: "l33t hack3r",
        life: "Conway's Game of Life, my favorite simulation :D",
    };
    const DEFAULT_PARAMS = {
        frost: 0.7,
        molecules: { density: 1, size: 1, spin: 1, mouse: 1 },
        network: { density: 1, links: 1, speed: 1, mouse: 1 },
        orbits: { density: 1, speed: 1, spread: 1 },
        stars: { density: 1, speed: 1, streak: 0.7 },
        epicycles: { density: 1, speed: 1, arms: 1 },
        harmonograph: { density: 1, speed: 1, decay: 0.55 },
        aurora: { density: 1, speed: 1, spread: 1 },
        pendulum: { density: 1, speed: 1, energy: 1 },
        crystal: { density: 1, speed: 1, size: 1 },
        flock: { density: 1, speed: 1, cohesion: 1 },
        field: { density: 1, speed: 1, swirl: 1 },
        rain: { density: 1, speed: 1.4, length: 1.55 },
        life: { density: 1, speed: 1, size: 1 },
    };
    const PARAM_FIELDS = {
        molecules: [
            { key: "density", label: "Density", min: 0.35, max: 4, step: 0.05 },
            { key: "size", label: "Size", min: 0.6, max: 1.8, step: 0.05 },
            { key: "spin", label: "Spin", min: 0, max: 2.5, step: 0.05 },
            { key: "mouse", label: "Mouse", min: 0, max: 2, step: 0.05 },
        ],
        network: [
            { key: "density", label: "Density", min: 0.4, max: 2, step: 0.05 },
            { key: "links", label: "Links", min: 0.45, max: 2, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.3, max: 2.2, step: 0.05 },
            { key: "mouse", label: "Mouse", min: 0, max: 2, step: 0.05 },
        ],
        orbits: [
            { key: "density", label: "Density", min: 0.4, max: 2.4, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.15, max: 2.4, step: 0.05 },
            { key: "spread", label: "Spread", min: 0.55, max: 2.2, step: 0.05 },
        ],
        stars: [
            { key: "density", label: "Density", min: 0.4, max: 2.4, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.2, max: 2.6, step: 0.05 },
            { key: "streak", label: "Streak", min: 0, max: 1, step: 0.05 },
        ],
        epicycles: [
            { key: "density", label: "Density", min: 0.4, max: 2.2, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.2, max: 2.4, step: 0.05 },
            { key: "arms", label: "Arms", min: 0.5, max: 1.8, step: 0.05 },
        ],
        harmonograph: [
            { key: "density", label: "Density", min: 0.4, max: 2.2, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.2, max: 2.4, step: 0.05 },
            { key: "decay", label: "Decay", min: 0.15, max: 1, step: 0.05 },
        ],
        aurora: [
            { key: "density", label: "Density", min: 0.4, max: 2.2, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.2, max: 2.4, step: 0.05 },
            { key: "spread", label: "Spread", min: 0.5, max: 2, step: 0.05 },
        ],
        pendulum: [
            { key: "density", label: "Density", min: 0.4, max: 2.2, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.2, max: 2.4, step: 0.05 },
            { key: "energy", label: "Energy", min: 0.4, max: 2, step: 0.05 },
        ],
        crystal: [
            { key: "density", label: "Density", min: 0.4, max: 2.2, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.15, max: 2.4, step: 0.05 },
            { key: "size", label: "Size", min: 0.55, max: 1.8, step: 0.05 },
        ],
        flock: [
            { key: "density", label: "Density", min: 0.4, max: 2.4, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.3, max: 2.2, step: 0.05 },
            { key: "cohesion", label: "Cohesion", min: 0.2, max: 2, step: 0.05 },
        ],
        field: [
            { key: "density", label: "Density", min: 0.4, max: 2.4, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.3, max: 2.2, step: 0.05 },
            { key: "swirl", label: "Swirl", min: 0.2, max: 2.2, step: 0.05 },
        ],
        rain: [
            { key: "density", label: "Density", min: 0.4, max: 2.4, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.3, max: 2.4, step: 0.05 },
            { key: "length", label: "Length", min: 0.45, max: 2, step: 0.05 },
        ],
        life: [
            { key: "density", label: "Density", min: 0.4, max: 2.4, step: 0.05 },
            { key: "speed", label: "Speed", min: 0.2, max: 2.6, step: 0.05 },
            { key: "size", label: "Size", min: 0.55, max: 1.8, step: 0.05 },
        ],
    };

    function randomSeed() {
        return ((Math.random() * 4294967296) ^ Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    }

    function createRng(seed) {
        let state = (seed == null ? randomSeed() : seed) >>> 0;
        if (state === 0) {
            state = 0x9e3779b9;
        }
        return {
            next() {
                state = (state + 0x6d2b79f5) >>> 0;
                let t = state;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            },
        };
    }

    // Baked from templates/index.html theme tokens (oklch values in site CSS).
    const BAKED_PALETTES = {
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

    function rgbToString(rgb) {
        return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
    }

    function lerpRgb(current, target, amount) {
        return {
            r: current.r + (target.r - current.r) * amount,
            g: current.g + (target.g - current.g) * amount,
            b: current.b + (target.b - current.b) * amount,
        };
    }

    function mixRgb(a, b, t) {
        return {
            r: a.r + (b.r - a.r) * t,
            g: a.g + (b.g - a.g) * t,
            b: a.b + (b.b - a.b) * t,
        };
    }

    function readStoredEnabled() {
        const stored = localStorage.getItem(BG_ENABLED_KEY);
        if (stored === "off" || stored === "false") {
            return false;
        }
        return true;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function readStoredMode() {
        const stored = localStorage.getItem(BG_MODE_KEY);
        if (MODES.indexOf(stored) >= 0) {
            return stored;
        }
        return "molecules";
    }

    function readStoredRandom() {
        const stored = localStorage.getItem(BG_RANDOM_KEY);
        if (stored === "off" || stored === "false") {
            return false;
        }
        return true;
    }

    function pickRandomMode(exclude) {
        if (MODES.length <= 1) {
            return MODES[0];
        }
        let next = MODES[(Math.random() * MODES.length) | 0];
        if (next === exclude) {
            next = MODES[(MODES.indexOf(next) + 1 + ((Math.random() * (MODES.length - 1)) | 0)) % MODES.length];
        }
        return next;
    }

    function readStoredParams() {
        const merged = { frost: DEFAULT_PARAMS.frost };
        for (let i = 0; i < MODES.length; i++) {
            const key = MODES[i];
            merged[key] = { ...DEFAULT_PARAMS[key] };
        }
        try {
            const raw = JSON.parse(localStorage.getItem(BG_PARAMS_KEY) || "null");
            if (!raw || typeof raw !== "object") {
                return merged;
            }
            if (typeof raw.frost === "number") {
                merged.frost = clamp(raw.frost, 0, 1);
            }
            for (let i = 0; i < MODES.length; i++) {
                const key = MODES[i];
                const src = raw[key];
                if (!src || typeof src !== "object") {
                    continue;
                }
                const fields = PARAM_FIELDS[key];
                for (let f = 0; f < fields.length; f++) {
                    const field = fields[f];
                    if (typeof src[field.key] === "number") {
                        merged[key][field.key] = clamp(src[field.key], field.min, field.max);
                    }
                }
            }
        } catch (_error) {
            // Keep defaults if storage is malformed.
        }
        return merged;
    }

    function pushAtom(atoms, x, y, z, kind) {
        atoms.push({ x, y, z, kind, sx: 0, sy: 0, sz: 0, sr: 0 });
    }

    function centerAtoms(atoms) {
        let cx = 0;
        let cy = 0;
        let cz = 0;
        const n = atoms.length;
        if (n === 0) {
            return;
        }
        for (let i = 0; i < n; i++) {
            cx += atoms[i].x;
            cy += atoms[i].y;
            cz += atoms[i].z;
        }
        cx /= n;
        cy /= n;
        cz /= n;
        for (let i = 0; i < n; i++) {
            atoms[i].x -= cx;
            atoms[i].y -= cy;
            atoms[i].z -= cz;
        }
    }

    function jitterAtoms(atoms, rng, amount) {
        for (let i = 0; i < atoms.length; i++) {
            atoms[i].x += (rng.next() - 0.5) * amount;
            atoms[i].y += (rng.next() - 0.5) * amount;
            atoms[i].z += (rng.next() - 0.5) * amount;
        }
    }

    function connectNear(atoms, minDist, maxDist) {
        const bonds = [];
        const minSq = minDist * minDist;
        const maxSq = maxDist * maxDist;
        for (let i = 0; i < atoms.length; i++) {
            for (let j = i + 1; j < atoms.length; j++) {
                const dx = atoms[i].x - atoms[j].x;
                const dy = atoms[i].y - atoms[j].y;
                const dz = atoms[i].z - atoms[j].z;
                const dSq = dx * dx + dy * dy + dz * dz;
                if (dSq >= minSq && dSq <= maxSq) {
                    bonds.push({ a: i, b: j, order: 1 });
                }
            }
        }
        return bonds;
    }

    function maybeHetero(rng, chance) {
        return rng.next() < chance ? KIND_HETERO : KIND_C;
    }

    function structureExtent(atoms) {
        let max = 8;
        for (let i = 0; i < atoms.length; i++) {
            const a = atoms[i];
            const d = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z) + ATOM_RADIUS[a.kind];
            if (d > max) {
                max = d;
            }
        }
        return max;
    }

    function finishStructure(atoms, bonds, rng, extraJitter) {
        centerAtoms(atoms);
        jitterAtoms(atoms, rng, extraJitter == null ? 0.45 : extraJitter);
        return { atoms, bonds, extent: structureExtent(atoms) };
    }

    function buildChain(rng) {
        const atoms = [];
        const bonds = [];
        const n = 5 + ((rng.next() * 4) | 0);
        let x = 0;
        let y = 0;
        let z = 0;
        let dir = rng.next() * Math.PI * 2;
        let pitch = (rng.next() - 0.5) * 0.8;
        for (let i = 0; i < n; i++) {
            pushAtom(atoms, x, y, z, maybeHetero(rng, i === 0 || i === n - 1 ? 0.45 : 0.12));
            if (i > 0) {
                bonds.push({ a: i - 1, b: i, order: rng.next() < 0.18 ? 2 : 1 });
            }
            dir += 0.42 + rng.next() * 0.55;
            pitch += (rng.next() - 0.5) * 0.35;
            x += Math.cos(dir) * BOND;
            y += Math.sin(dir) * BOND * 0.72;
            z += Math.sin(pitch) * BOND * 0.55;
            if (rng.next() < 0.28 && i > 0) {
                const ang = dir + Math.PI * 0.5;
                const bx = x + Math.cos(ang) * BOND * 0.92;
                const by = y + Math.sin(ang) * BOND * 0.92;
                const bz = z + (rng.next() - 0.5) * BOND * 0.6;
                const idx = atoms.length;
                pushAtom(atoms, bx, by, bz, maybeHetero(rng, 0.4));
                bonds.push({ a: i, b: idx, order: 1 });
            }
        }
        return finishStructure(atoms, bonds, rng);
    }

    function buildRing(rng) {
        const atoms = [];
        const bonds = [];
        const n = rng.next() < 0.22 ? 5 : rng.next() < 0.78 ? 6 : 7;
        const pucker = (rng.next() - 0.5) * 4.5;
        const r = BOND / (2 * Math.sin(Math.PI / n));
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            pushAtom(
                atoms,
                Math.cos(a) * r,
                Math.sin(a) * r,
                Math.sin(a * 2) * pucker,
                maybeHetero(rng, 0.16)
            );
        }
        for (let i = 0; i < n; i++) {
            const order = n === 6 && i % 2 === 0 ? 2 : 1;
            bonds.push({ a: i, b: (i + 1) % n, order });
        }
        if (rng.next() < 0.4) {
            const i = (rng.next() * n) | 0;
            const a = (i / n) * Math.PI * 2;
            const idx = atoms.length;
            pushAtom(
                atoms,
                Math.cos(a) * (r + BOND),
                Math.sin(a) * (r + BOND),
                Math.sin(a * 2) * pucker * 0.4,
                maybeHetero(rng, 0.7)
            );
            bonds.push({ a: i, b: idx, order: 1 });
        }
        return finishStructure(atoms, bonds, rng);
    }

    function buildTetrahedral(rng) {
        const atoms = [];
        const bonds = [];
        const verts = [
            [1, 1, 1],
            [1, -1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
        ];
        const inv = 1 / Math.sqrt(3);
        pushAtom(atoms, 0, 0, 0, rng.next() < 0.35 ? KIND_HETERO : KIND_C);
        for (let i = 0; i < 4; i++) {
            pushAtom(
                atoms,
                verts[i][0] * inv * BOND,
                verts[i][1] * inv * BOND,
                verts[i][2] * inv * BOND,
                rng.next() < 0.55 ? KIND_H : maybeHetero(rng, 0.25)
            );
            bonds.push({ a: 0, b: i + 1, order: 1 });
        }
        return finishStructure(atoms, bonds, rng, 0.25);
    }

    function buildBranched(rng) {
        const atoms = [];
        const bonds = [];
        const verts = [
            [1, 1, 1],
            [1, -1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
        ];
        const inv = 1 / Math.sqrt(3);
        const arms = 3 + ((rng.next() * 2) | 0);
        pushAtom(atoms, 0, 0, 0, maybeHetero(rng, 0.3));
        for (let i = 0; i < arms; i++) {
            const x = verts[i][0] * inv * BOND;
            const y = verts[i][1] * inv * BOND;
            const z = verts[i][2] * inv * BOND;
            const idx = atoms.length;
            pushAtom(atoms, x, y, z, maybeHetero(rng, 0.2));
            bonds.push({ a: 0, b: idx, order: 1 });
            if (rng.next() < 0.55) {
                const idx2 = atoms.length;
                pushAtom(atoms, x * 2.05, y * 2.05, z * 2.05, maybeHetero(rng, 0.45));
                bonds.push({ a: idx, b: idx2, order: rng.next() < 0.2 ? 2 : 1 });
            }
        }
        return finishStructure(atoms, bonds, rng);
    }

    function buildCube(rng) {
        const atoms = [];
        const s = BOND * 0.58;
        for (let x = -1; x <= 1; x += 2) {
            for (let y = -1; y <= 1; y += 2) {
                for (let z = -1; z <= 1; z += 2) {
                    pushAtom(atoms, x * s, y * s, z * s, maybeHetero(rng, 0.12));
                }
            }
        }
        const bonds = connectNear(atoms, BOND * 0.7, BOND * 1.22);
        if (rng.next() < 0.35) {
            const idx = atoms.length;
            pushAtom(atoms, 0, 0, 0, KIND_HETERO);
            for (let i = 0; i < 8; i++) {
                bonds.push({ a: idx, b: i, order: 1 });
            }
        }
        return finishStructure(atoms, bonds, rng, 0.2);
    }

    function buildHelix(rng) {
        const atoms = [];
        const bonds = [];
        const n = 9 + ((rng.next() * 6) | 0);
        const r = BOND * (1.15 + rng.next() * 0.35);
        const pitch = BOND * (0.58 + rng.next() * 0.18);
        const step = 0.62 + rng.next() * 0.18;
        const doubleStrand = rng.next() < 0.62;
        for (let i = 0; i < n; i++) {
            const t = i * step;
            const y = (i - (n - 1) / 2) * pitch;
            const idxA = atoms.length;
            pushAtom(
                atoms,
                Math.cos(t) * r,
                y,
                Math.sin(t) * r,
                i % 4 === 0 ? KIND_HETERO : KIND_C
            );
            if (doubleStrand) {
                const idxB = atoms.length;
                pushAtom(
                    atoms,
                    Math.cos(t + Math.PI) * r,
                    y,
                    Math.sin(t + Math.PI) * r,
                    i % 4 === 2 ? KIND_HETERO : KIND_C
                );
                if (i > 0) {
                    bonds.push({ a: idxA - 2, b: idxA, order: 1 });
                    bonds.push({ a: idxB - 2, b: idxB, order: 1 });
                }
                if (i % 2 === 0) {
                    bonds.push({ a: idxA, b: idxB, order: 1 });
                }
            } else if (i > 0) {
                bonds.push({ a: idxA - 1, b: idxA, order: 1 });
            }
        }
        return finishStructure(atoms, bonds, rng, 0.3);
    }

    function buildOctahedron(rng) {
        const atoms = [];
        const bonds = [];
        const s = BOND;
        pushAtom(atoms, 0, 0, 0, KIND_HETERO);
        const tips = [
            [s, 0, 0],
            [-s, 0, 0],
            [0, s, 0],
            [0, -s, 0],
            [0, 0, s],
            [0, 0, -s],
        ];
        for (let i = 0; i < tips.length; i++) {
            pushAtom(atoms, tips[i][0], tips[i][1], tips[i][2], maybeHetero(rng, 0.2));
            bonds.push({ a: 0, b: i + 1, order: 1 });
        }
        return finishStructure(atoms, bonds, rng, 0.2);
    }

    function buildFusedRings(rng) {
        const atoms = [];
        const r = BOND;
        const hex = [];
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3;
            hex.push([Math.cos(a) * r, Math.sin(a) * r, (rng.next() - 0.5) * 1.2]);
        }
        const dx = r * Math.sqrt(3);
        const used = [];
        const addUnique = (x, y, z, kind) => {
            for (let i = 0; i < used.length; i++) {
                const ddx = used[i][0] - x;
                const ddy = used[i][1] - y;
                const ddz = used[i][2] - z;
                if (ddx * ddx + ddy * ddy + ddz * ddz < 4) {
                    return i;
                }
            }
            const idx = atoms.length;
            pushAtom(atoms, x, y, z, kind);
            used.push([x, y, z]);
            return idx;
        };
        const ring1 = [];
        const ring2 = [];
        for (let i = 0; i < 6; i++) {
            ring1.push(addUnique(hex[i][0], hex[i][1], hex[i][2], maybeHetero(rng, 0.1)));
            ring2.push(addUnique(hex[i][0] + dx, hex[i][1], hex[i][2], maybeHetero(rng, 0.1)));
        }
        const bonds = [];
        const addBond = (a, b, order) => {
            const lo = a < b ? a : b;
            const hi = a < b ? b : a;
            for (let i = 0; i < bonds.length; i++) {
                if (bonds[i].a === lo && bonds[i].b === hi) {
                    return;
                }
            }
            bonds.push({ a: lo, b: hi, order });
        };
        for (let i = 0; i < 6; i++) {
            addBond(ring1[i], ring1[(i + 1) % 6], i % 2 === 0 ? 2 : 1);
            addBond(ring2[i], ring2[(i + 1) % 6], i % 2 === 0 ? 1 : 2);
        }
        return finishStructure(atoms, bonds, rng, 0.25);
    }

    function buildIcosahedron(rng) {
        const atoms = [];
        const phi = (1 + Math.sqrt(5)) / 2;
        const raw = [
            [0, 1, phi],
            [0, -1, phi],
            [0, 1, -phi],
            [0, -1, -phi],
            [1, phi, 0],
            [-1, phi, 0],
            [1, -phi, 0],
            [-1, -phi, 0],
            [phi, 0, 1],
            [-phi, 0, 1],
            [phi, 0, -1],
            [-phi, 0, -1],
        ];
        const scale = BOND / 2;
        for (let i = 0; i < raw.length; i++) {
            pushAtom(
                atoms,
                raw[i][0] * scale,
                raw[i][1] * scale,
                raw[i][2] * scale,
                i % 5 === 0 ? KIND_HETERO : KIND_C
            );
        }
        const bonds = connectNear(atoms, BOND * 0.85, BOND * 1.2);
        return finishStructure(atoms, bonds, rng, 0.18);
    }

    function buildWater(rng) {
        const atoms = [];
        const bonds = [];
        const angle = 0.912;
        pushAtom(atoms, 0, 0, 0, KIND_HETERO);
        pushAtom(atoms, Math.cos(angle) * BOND, Math.sin(angle) * BOND, 0.35, KIND_H);
        pushAtom(atoms, Math.cos(-angle) * BOND, Math.sin(-angle) * BOND, -0.35, KIND_H);
        bonds.push({ a: 0, b: 1, order: 1 }, { a: 0, b: 2, order: 1 });
        return finishStructure(atoms, bonds, rng, 0.12);
    }

    function buildMethane(rng) {
        return buildTetrahedral(rng);
    }

    function buildAmmonia(rng) {
        const atoms = [];
        const bonds = [];
        const verts = [
            [1, 1, 1],
            [1, -1, -1],
            [-1, 1, -1],
        ];
        const inv = 1 / Math.sqrt(3);
        pushAtom(atoms, 0, 0.35 * BOND, 0, KIND_HETERO);
        for (let i = 0; i < 3; i++) {
            pushAtom(
                atoms,
                verts[i][0] * inv * BOND,
                verts[i][1] * inv * BOND - 0.2 * BOND,
                verts[i][2] * inv * BOND,
                KIND_H
            );
            bonds.push({ a: 0, b: i + 1, order: 1 });
        }
        return finishStructure(atoms, bonds, rng, 0.12);
    }

    function buildCO2(rng) {
        const atoms = [];
        const bonds = [];
        pushAtom(atoms, -BOND, 0, 0, KIND_HETERO);
        pushAtom(atoms, 0, 0, 0, KIND_C);
        pushAtom(atoms, BOND, 0, 0, KIND_HETERO);
        bonds.push({ a: 0, b: 1, order: 2 }, { a: 1, b: 2, order: 2 });
        return finishStructure(atoms, bonds, rng, 0.1);
    }

    function buildOzone(rng) {
        const atoms = [];
        const bonds = [];
        const angle = 1.017;
        pushAtom(atoms, 0, 0, 0, KIND_HETERO);
        pushAtom(atoms, Math.cos(angle) * BOND, Math.sin(angle) * BOND, 0.2, KIND_HETERO);
        pushAtom(atoms, Math.cos(-angle) * BOND, Math.sin(-angle) * BOND, -0.2, KIND_HETERO);
        bonds.push({ a: 0, b: 1, order: 2 }, { a: 0, b: 2, order: 1 });
        return finishStructure(atoms, bonds, rng, 0.12);
    }

    function buildBenzene(rng) {
        const atoms = [];
        const bonds = [];
        const r = BOND;
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3;
            pushAtom(atoms, Math.cos(a) * r, Math.sin(a) * r, 0, KIND_C);
        }
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3;
            bonds.push({ a: i, b: (i + 1) % 6, order: i % 2 === 0 ? 2 : 1 });
            const hi = atoms.length;
            pushAtom(atoms, Math.cos(a) * (r + BOND * 0.7), Math.sin(a) * (r + BOND * 0.7), 0, KIND_H);
            bonds.push({ a: i, b: hi, order: 1 });
        }
        return finishStructure(atoms, bonds, rng, 0.12);
    }

    function buildEthanol(rng) {
        const atoms = [];
        const bonds = [];
        pushAtom(atoms, 0, 0, 0, KIND_C);
        pushAtom(atoms, BOND, 0.15 * BOND, 0.2 * BOND, KIND_C);
        pushAtom(atoms, BOND * 1.38, BOND * 0.95, 0.15 * BOND, KIND_HETERO);
        pushAtom(atoms, BOND * 1.55, BOND * 1.55, 0.7 * BOND, KIND_H);
        bonds.push({ a: 0, b: 1, order: 1 }, { a: 1, b: 2, order: 1 }, { a: 2, b: 3, order: 1 });
        const hydrogens = [
            [-0.45 * BOND, 0.72 * BOND, 0.55 * BOND],
            [-0.45 * BOND, -0.72 * BOND, 0.5 * BOND],
            [-0.35 * BOND, 0, -0.9 * BOND],
            [BOND * 1.15, -0.72 * BOND, -0.55 * BOND],
            [BOND * 0.85, 0.78 * BOND, -0.65 * BOND],
        ];
        for (let i = 0; i < hydrogens.length; i++) {
            const idx = atoms.length;
            pushAtom(atoms, hydrogens[i][0], hydrogens[i][1], hydrogens[i][2], KIND_H);
            bonds.push({ a: i < 3 ? 0 : 1, b: idx, order: 1 });
        }
        return finishStructure(atoms, bonds, rng, 0.14);
    }

    function buildCaffeine(rng) {
        const atoms = [];
        const bonds = [];
        const r = BOND * 0.95;
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const kind = i === 0 || i === 3 ? KIND_HETERO : KIND_C;
            pushAtom(atoms, Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 2) * 0.7, kind);
        }
        for (let i = 0; i < 6; i++) {
            bonds.push({ a: i, b: (i + 1) % 6, order: i === 1 || i === 4 ? 2 : 1 });
        }
        const mx = (atoms[1].x + atoms[2].x) * 0.5;
        const my = (atoms[1].y + atoms[2].y) * 0.5;
        let nx = atoms[1].y - atoms[2].y;
        let ny = atoms[2].x - atoms[1].x;
        const nlen = Math.hypot(nx, ny) || 1;
        nx /= nlen;
        ny /= nlen;
        const p1 = atoms.length;
        pushAtom(atoms, mx + nx * r * 1.05 + (atoms[1].x - mx) * 0.45, my + ny * r * 1.05 + (atoms[1].y - my) * 0.45, 1.1, KIND_HETERO);
        const p2 = atoms.length;
        pushAtom(atoms, mx + nx * r * 1.05 + (atoms[2].x - mx) * 0.45, my + ny * r * 1.05 + (atoms[2].y - my) * 0.45, 1.1, KIND_C);
        bonds.push({ a: 1, b: p1, order: 1 }, { a: p1, b: p2, order: 2 }, { a: p2, b: 2, order: 1 });
        const attach = (i, kind, dist, order) => {
            const len = Math.hypot(atoms[i].x, atoms[i].y) || 1;
            const idx = atoms.length;
            pushAtom(atoms, atoms[i].x * (1 + dist / len), atoms[i].y * (1 + dist / len), atoms[i].z * 0.8, kind);
            bonds.push({ a: i, b: idx, order });
        };
        attach(4, KIND_HETERO, BOND * 0.82, 2);
        attach(5, KIND_HETERO, BOND * 0.82, 2);
        attach(0, KIND_C, BOND * 0.88, 1);
        attach(3, KIND_C, BOND * 0.88, 1);
        attach(p1, KIND_C, BOND * 0.88, 1);
        return finishStructure(atoms, bonds, rng, 0.16);
    }

    function buildGlucose(rng) {
        const atoms = [];
        const bonds = [];
        const chair = [
            [1.05, -0.65, 0.62],
            [1.05, 0.65, -0.62],
            [0, 1.15, 0.62],
            [-1.05, 0.65, -0.62],
            [-1.05, -0.65, 0.62],
            [0, -1.15, -0.45],
        ];
        for (let i = 0; i < 6; i++) {
            pushAtom(atoms, chair[i][0] * BOND, chair[i][1] * BOND, chair[i][2] * BOND, i === 5 ? KIND_HETERO : KIND_C);
        }
        for (let i = 0; i < 6; i++) {
            bonds.push({ a: i, b: (i + 1) % 6, order: 1 });
        }
        for (let i = 0; i < 5; i++) {
            const idx = atoms.length;
            const s = i % 2 === 0 ? 1 : -1;
            pushAtom(
                atoms,
                chair[i][0] * BOND * 1.15,
                chair[i][1] * BOND * 1.15,
                chair[i][2] * BOND + s * BOND * 0.85,
                KIND_HETERO
            );
            bonds.push({ a: i, b: idx, order: 1 });
        }
        return finishStructure(atoms, bonds, rng, 0.16);
    }

    function buildAdenine(rng) {
        const atoms = [];
        const bonds = [];
        const r = BOND * 0.95;
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const kind = i === 1 || i === 3 || i === 5 ? KIND_HETERO : KIND_C;
            pushAtom(atoms, Math.cos(a) * r, Math.sin(a) * r, Math.sin(a * 2) * 0.55, kind);
        }
        for (let i = 0; i < 6; i++) {
            bonds.push({ a: i, b: (i + 1) % 6, order: i % 2 === 0 ? 2 : 1 });
        }
        const mx = (atoms[0].x + atoms[5].x) * 0.5;
        const my = (atoms[0].y + atoms[5].y) * 0.5;
        let nx = atoms[0].y - atoms[5].y;
        let ny = atoms[5].x - atoms[0].x;
        const nlen = Math.hypot(nx, ny) || 1;
        const p1 = atoms.length;
        pushAtom(atoms, mx + (nx / nlen) * r * 1.1, my + (ny / nlen) * r * 1.1, 1.0, KIND_HETERO);
        const p2 = atoms.length;
        pushAtom(atoms, mx + (nx / nlen) * r * 1.7, my + (ny / nlen) * r * 1.7, 0.2, KIND_C);
        bonds.push({ a: 0, b: p1, order: 1 }, { a: p1, b: p2, order: 2 }, { a: p2, b: 5, order: 1 });
        const amine = atoms.length;
        pushAtom(atoms, atoms[2].x * 1.85, atoms[2].y * 1.85, atoms[2].z, KIND_HETERO);
        bonds.push({ a: 2, b: amine, order: 1 });
        return finishStructure(atoms, bonds, rng, 0.16);
    }

    function buildAspirin(rng) {
        const atoms = [];
        const bonds = [];
        const r = BOND;
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3;
            pushAtom(atoms, Math.cos(a) * r, Math.sin(a) * r, 0, KIND_C);
        }
        for (let i = 0; i < 6; i++) {
            bonds.push({ a: i, b: (i + 1) % 6, order: i % 2 === 0 ? 2 : 1 });
        }
        const carboxyl = atoms.length;
        pushAtom(atoms, atoms[0].x * 1.85, atoms[0].y * 1.85, 0.4, KIND_C);
        const o1 = atoms.length;
        pushAtom(atoms, atoms[0].x * 2.45, atoms[0].y * 2.45, 1.1, KIND_HETERO);
        const o2 = atoms.length;
        pushAtom(atoms, atoms[0].x * 2.15, atoms[0].y * 2.15 - BOND * 0.85, -0.3, KIND_HETERO);
        bonds.push({ a: 0, b: carboxyl, order: 1 }, { a: carboxyl, b: o1, order: 2 }, { a: carboxyl, b: o2, order: 1 });
        const esterO = atoms.length;
        pushAtom(atoms, atoms[1].x * 1.75, atoms[1].y * 1.75, -0.5, KIND_HETERO);
        const esterC = atoms.length;
        pushAtom(atoms, atoms[1].x * 2.4, atoms[1].y * 2.4, -0.2, KIND_C);
        const esterO2 = atoms.length;
        pushAtom(atoms, atoms[1].x * 2.9, atoms[1].y * 2.9, 0.7, KIND_HETERO);
        const methyl = atoms.length;
        pushAtom(atoms, atoms[1].x * 2.55, atoms[1].y * 2.55 - BOND, -0.8, KIND_C);
        bonds.push(
            { a: 1, b: esterO, order: 1 },
            { a: esterO, b: esterC, order: 1 },
            { a: esterC, b: esterO2, order: 2 },
            { a: esterC, b: methyl, order: 1 }
        );
        return finishStructure(atoms, bonds, rng, 0.16);
    }

    function buildDopamine(rng) {
        const atoms = [];
        const bonds = [];
        const r = BOND;
        for (let i = 0; i < 6; i++) {
            const a = Math.PI / 6 + (i * Math.PI) / 3;
            pushAtom(atoms, Math.cos(a) * r, Math.sin(a) * r, 0, KIND_C);
        }
        for (let i = 0; i < 6; i++) {
            bonds.push({ a: i, b: (i + 1) % 6, order: i % 2 === 0 ? 2 : 1 });
        }
        const oh1 = atoms.length;
        pushAtom(atoms, atoms[0].x * 1.8, atoms[0].y * 1.8, 0.3, KIND_HETERO);
        const oh2 = atoms.length;
        pushAtom(atoms, atoms[1].x * 1.8, atoms[1].y * 1.8, -0.3, KIND_HETERO);
        const c1 = atoms.length;
        pushAtom(atoms, atoms[3].x * 1.7, atoms[3].y * 1.7, 0.2, KIND_C);
        const c2 = atoms.length;
        pushAtom(atoms, atoms[3].x * 2.45, atoms[3].y * 2.45, 0.8, KIND_C);
        const n = atoms.length;
        pushAtom(atoms, atoms[3].x * 3.05, atoms[3].y * 3.05, 0.2, KIND_HETERO);
        bonds.push(
            { a: 0, b: oh1, order: 1 },
            { a: 1, b: oh2, order: 1 },
            { a: 3, b: c1, order: 1 },
            { a: c1, b: c2, order: 1 },
            { a: c2, b: n, order: 1 }
        );
        return finishStructure(atoms, bonds, rng, 0.16);
    }

    function buildStructure(rng) {
        const roll = rng.next();
        if (roll < 0.08) {
            return buildWater(rng);
        }
        if (roll < 0.15) {
            return buildMethane(rng);
        }
        if (roll < 0.21) {
            return buildAmmonia(rng);
        }
        if (roll < 0.27) {
            return buildCO2(rng);
        }
        if (roll < 0.32) {
            return buildOzone(rng);
        }
        if (roll < 0.42) {
            return buildBenzene(rng);
        }
        if (roll < 0.5) {
            return buildEthanol(rng);
        }
        if (roll < 0.58) {
            return buildCaffeine(rng);
        }
        if (roll < 0.64) {
            return buildGlucose(rng);
        }
        if (roll < 0.7) {
            return buildAdenine(rng);
        }
        if (roll < 0.76) {
            return buildAspirin(rng);
        }
        if (roll < 0.82) {
            return buildDopamine(rng);
        }
        if (roll < 0.88) {
            return buildHelix(rng);
        }
        if (roll < 0.93) {
            return buildOctahedron(rng);
        }
        if (roll < 0.97) {
            return buildFusedRings(rng);
        }
        return buildIcosahedron(rng);
    }

    function makeAtomSprite(rgb, highlight) {
        const size = SPRITE_SIZE;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const g = canvas.getContext("2d");
        const cx = size * 0.5;
        const cy = size * 0.5;
        const r = size * 0.5 - 1;
        const R = rgb.r;
        const G = rgb.g;
        const B = rgb.b;
        const lightT = highlight ? 0.78 : 0.62;
        const light = {
            r: Math.min(255, Math.round(R + (255 - R) * lightT)),
            g: Math.min(255, Math.round(G + (255 - G) * lightT)),
            b: Math.min(255, Math.round(B + (255 - B) * lightT)),
        };
        const dark = {
            r: Math.round(R * 0.22),
            g: Math.round(G * 0.22),
            b: Math.round(B * 0.22),
        };
        const midDark = {
            r: Math.round(R * 0.52),
            g: Math.round(G * 0.52),
            b: Math.round(B * 0.52),
        };
        const grd = g.createRadialGradient(cx - r * 0.32, cy - r * 0.34, r * 0.06, cx + r * 0.08, cy + r * 0.1, r);
        grd.addColorStop(0, `rgb(${light.r}, ${light.g}, ${light.b})`);
        grd.addColorStop(0.32, `rgb(${Math.round(R)}, ${Math.round(G)}, ${Math.round(B)})`);
        grd.addColorStop(0.72, `rgb(${midDark.r}, ${midDark.g}, ${midDark.b})`);
        grd.addColorStop(1, `rgb(${dark.r}, ${dark.g}, ${dark.b})`);
        g.fillStyle = grd;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = highlight ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.42)";
        g.beginPath();
        g.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.22, r * 0.15, -0.5, 0, Math.PI * 2);
        g.fill();
        return canvas;
    }

    function initParticleBackground(canvas, options) {
        if (!canvas) {
            return { updateCanvasDimensions: () => {}, scheduleDimensionUpdate: () => {} };
        }

        const toggleButton = options.toggleButton || document.getElementById("particle-toggle");
        const sitePanel = document.getElementById("site-panel");
        const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const ctx = canvas.getContext("2d");
        const getDocumentScrollHeight = () =>
            Math.max(
                document.body ? document.body.scrollHeight : 0,
                document.documentElement.scrollHeight,
                document.body ? document.body.offsetHeight : 0,
                document.documentElement.offsetHeight,
                document.body ? document.body.clientHeight : 0,
                document.documentElement.clientHeight
            );
        const getDpr = () => Math.min(window.devicePixelRatio || 1, 2);

        let width = window.innerWidth;
        let height = window.innerHeight;
        let docHeight = getDocumentScrollHeight();
        let dpr = getDpr();
        let moleculesInitialized = false;
        let animationFrameId = null;
        let stopTimeoutId = null;
        let resizeRaf = null;
        let lastFrameTime = 0;
        let isPageVisible = !document.hidden;
        let reducedMotion = reducedMotionQuery.matches;
        let enabled = readStoredEnabled();
        let randomMode = readStoredRandom();
        let mode = randomMode ? pickRandomMode() : readStoredMode();
        let params = readStoredParams();
        let particleColorStr = "";
        let accentColorStr = "";
        let bgColorStr = "";
        let sprites = { carbon: null, hetero: null, hydrogen: null, accent: null };
        let simReady = false;
        let panelEl = null;
        let persistTimer = null;
        let drag = {
            active: false,
            kind: "",
            target: null,
            offsetX: 0,
            offsetY: 0,
            lastX: 0,
            lastY: 0,
            lastT: 0,
            vx: 0,
            vy: 0,
            moved: 0,
            pointerId: null,
        };
        let longPressTimer = null;
        let hoverGrab = false;
        let pressStartX = 0;
        let pressStartY = 0;
        let pointerTap = {
            interactive: true,
            blasted: false,
            x: 0,
            y: 0,
        };

        if (!enabled) {
            canvas.style.opacity = "0";
        }
        canvas.style.transition = `opacity ${CANVAS_FADE_MS}ms ease`;

        let mouse = { x: -1000, y: -1000 };

        const isDarkMode = () => document.documentElement.classList.contains("dark");

        const getVisibilityProfile = () => {
            if (isDarkMode()) {
                return {
                    moleculeOpacityMin: 0.34,
                    moleculeOpacityRange: 0.16,
                    bondAlpha: 0.28,
                    hoverBondAlpha: 0.78,
                    hoverOpacityBoost: 0.48,
                    edgeFade: 0.18,
                };
            }
            return {
                moleculeOpacityMin: 0.32,
                moleculeOpacityRange: 0.14,
                bondAlpha: 0.32,
                hoverBondAlpha: 0.78,
                hoverOpacityBoost: 0.44,
                edgeFade: 0.14,
            };
        };

        const getThemeColors = () => {
            const palette = isDarkMode() ? BAKED_PALETTES.dark : BAKED_PALETTES.light;
            return {
                particleRgb: { ...palette.particleRgb },
                hoverAccentRgb: { ...palette.hoverAccentRgb },
                bgRgb: { ...palette.bgRgb },
                visibility: getVisibilityProfile(),
            };
        };

        let colors = getThemeColors();
        particleColorStr = rgbToString(colors.particleRgb);
        accentColorStr = rgbToString(colors.hoverAccentRgb);
        bgColorStr = rgbToString(colors.bgRgb);

        const rebuildSprites = () => {
            sprites.carbon = makeAtomSprite(colors.particleRgb, false);
            sprites.hydrogen = makeAtomSprite(mixRgb(colors.particleRgb, { r: 255, g: 255, b: 255 }, 0.18), false);
            sprites.hetero = makeAtomSprite(colors.hoverAccentRgb, false);
            sprites.accent = makeAtomSprite(colors.hoverAccentRgb, true);
        };
        rebuildSprites();

        const applyCanvasSize = () => {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.imageSmoothingEnabled = true;
        };

        applyCanvasSize();

        const molecules = [];
        const visibleMolecules = [];
        const fxWorld = {
            get width() { return width; },
            get height() { return height; },
            get docHeight() { return docHeight; },
            get ctx() { return ctx; },
            get params() { return params; },
            get mouse() { return mouse; },
            get colors() { return colors; },
            get particleColorStr() { return particleColorStr; },
            get accentColorStr() { return accentColorStr; },
            get sprites() { return sprites; },
            get reducedMotion() { return reducedMotion; },
            get lastFrameTime() { return lastFrameTime; },
            get enabled() { return enabled; },
            get createRng() { return createRng; },
            FOCAL,
            DEPTH_OFFSET,
            MOBILE_BREAKPOINT,
            MOUSE_RADIUS,
        };
        const fx = (window.ParticleBG && typeof window.ParticleBG.createFx === "function")
            ? window.ParticleBG.createFx(fxWorld)
            : {
                clear() {},
                init() {},
                adjust() {},
                tick() {},
                hitTest() { return null; },
                blast() { return false; },
            };

        const getTargetCount = () => {
            if (!enabled) {
                return 0;
            }
            const viewH = Math.max(height, 1);
            const pages = Math.max(1, docHeight / viewH);
            const densityMul = params.molecules.density;
            if (width < MOBILE_BREAKPOINT) {
                const perView = reducedMotion ? 6 : 12;
                return Math.min(360, Math.max(3, Math.round(perView * pages * densityMul)));
            }
            const area = width * docHeight;
            const densityFactor = reducedMotion ? 0.45 : 1;
            const density = 0.00005 * densityFactor * densityMul;
            return Math.min(420, Math.max(reducedMotion ? 8 : 14, Math.floor(area * density)));
        };

        class Molecule {
            constructor(id, fadeIn = false) {
                this.id = id;
                this.atoms = [];
                this.bonds = [];
                this.atomOrder = [];
                this.reset(fadeIn);
            }

            reset(fadeIn = false) {
                const rng = createRng();
                const built = buildStructure(rng);
                this.atoms = built.atoms;
                this.bonds = built.bonds;
                this.extent = built.extent;
                this.atomOrder.length = this.atoms.length;
                for (let i = 0; i < this.atoms.length; i++) {
                    this.atomOrder[i] = i;
                }

                this.showpiece = this.atoms.length >= 12;
                const mobileScale = width < MOBILE_BREAKPOINT ? 0.92 : 1;
                this.baseScale =
                    (0.78 + rng.next() * 0.48) * mobileScale * (this.showpiece && width >= MOBILE_BREAKPOINT ? 1.22 : 1);
                this.scale = this.baseScale;
                this.radius = this.extent * this.baseScale + 10;

                this.place(rng);
                this.scaleSeed = this.baseScale;
                this.baseScale = this.scaleSeed * params.molecules.size;
                this.scale = this.baseScale;
                this.radius = this.extent * this.baseScale + 10;
                this.dragging = false;
                this.baseVx = (rng.next() - 0.5) * 0.16;
                this.baseVy = (rng.next() - 0.5) * 0.16;
                this.vx = this.baseVx;
                this.vy = this.baseVy;
                this.rotX = rng.next() * Math.PI * 2;
                this.rotY = rng.next() * Math.PI * 2;
                this.rotZ = rng.next() * Math.PI * 2;
                this.spinSeedX = (rng.next() - 0.5) * 0.01;
                this.spinSeedY = (rng.next() - 0.5) * 0.014;
                this.spinSeedZ = (rng.next() - 0.5) * 0.008;
                this.baseRotVx = this.spinSeedX * params.molecules.spin;
                this.baseRotVy = this.spinSeedY * params.molecules.spin;
                this.baseRotVz = this.spinSeedZ * params.molecules.spin;
                this.rotVx = this.baseRotVx;
                this.rotVy = this.baseRotVy;
                this.rotVz = this.baseRotVz;

                const visibility = colors.visibility || getVisibilityProfile();
                this.baseOpacity = rng.next() * visibility.moleculeOpacityRange + visibility.moleculeOpacityMin;
                this.opacity = fadeIn ? 0 : this.baseOpacity;
                this.highlight = 0;
                this.pulse = 0;
            }

            gutterMetrics() {
                const contentWidth = Math.min(CONTENT_MAX_WIDTH, width);
                const gutter = (width - contentWidth) * 0.5;
                return { contentWidth, gutter, prefer: width >= GUTTER_MIN_WIDTH && gutter > 70 };
            }

            place(rng) {
                const pad = Math.min(this.radius, 48);
                this.lane = 0;
                this.x = pad + rng.next() * Math.max(1, width - pad * 2);
                this.y = pad + rng.next() * Math.max(1, docHeight - pad * 2);
            }

            enforceBounds() {
                const pad = this.radius * 0.35;
                if (this.x < pad) {
                    this.x = pad;
                    if (this.vx < 0) {
                        this.vx = -this.vx * 0.85;
                    }
                    if (this.baseVx < 0) {
                        this.baseVx = -this.baseVx;
                    }
                } else if (this.x > width - pad) {
                    this.x = width - pad;
                    if (this.vx > 0) {
                        this.vx = -this.vx * 0.85;
                    }
                    if (this.baseVx > 0) {
                        this.baseVx = -this.baseVx;
                    }
                }
                if (this.y < pad) {
                    this.y = pad;
                    if (this.vy < 0) {
                        this.vy = -this.vy * 0.85;
                    }
                    if (this.baseVy < 0) {
                        this.baseVy = -this.baseVy;
                    }
                } else if (this.y > docHeight - pad) {
                    this.y = docHeight - pad;
                    if (this.vy > 0) {
                        this.vy = -this.vy * 0.85;
                    }
                    if (this.baseVy > 0) {
                        this.baseVy = -this.baseVy;
                    }
                }
            }

            wrapAngles() {
                const tau = Math.PI * 2;
                if (this.rotX > tau || this.rotX < -tau) {
                    this.rotX = this.rotX % tau;
                }
                if (this.rotY > tau || this.rotY < -tau) {
                    this.rotY = this.rotY % tau;
                }
                if (this.rotZ > tau || this.rotZ < -tau) {
                    this.rotZ = this.rotZ % tau;
                }
            }

            clampSpin() {
                const spinSq = this.rotVx * this.rotVx + this.rotVy * this.rotVy + this.rotVz * this.rotVz;
                const maxSq = MAX_SPIN * MAX_SPIN;
                if (spinSq > maxSq) {
                    const s = MAX_SPIN / Math.sqrt(spinSq);
                    this.rotVx *= s;
                    this.rotVy *= s;
                    this.rotVz *= s;
                }
            }

            applySizeAndSpin() {
                this.baseScale = this.scaleSeed * params.molecules.size;
                this.baseRotVx = this.spinSeedX * params.molecules.spin;
                this.baseRotVy = this.spinSeedY * params.molecules.spin;
                this.baseRotVz = this.spinSeedZ * params.molecules.spin;
                this.scale = this.baseScale * (1 + this.pulse);
                this.radius = this.extent * this.scale + 10;
            }

            integrate(frame, damp) {
                if (this.opacity < this.baseOpacity) {
                    this.opacity += (this.baseOpacity - this.opacity) * damp.fadeIn;
                }
                this.pulse += (0 - this.pulse) * damp.pulse;

                if (this.dragging) {
                    this.rotX += this.rotVx * frame;
                    this.rotY += this.rotVy * frame;
                    this.rotZ += this.rotVz * frame;
                    this.wrapAngles();
                    this.scale = this.baseScale * (1 + this.pulse);
                    this.radius = this.extent * this.scale + 10;
                    return;
                }

                this.vx += (this.baseVx - this.vx) * damp.cruise;
                this.vy += (this.baseVy - this.vy) * damp.cruise;
                this.rotVx += (this.baseRotVx - this.rotVx) * damp.spin;
                this.rotVy += (this.baseRotVy - this.rotVy) * damp.spin;
                this.rotVz += (this.baseRotVz - this.rotVz) * damp.spin;
                this.clampSpin();

                const speedSq = this.vx * this.vx + this.vy * this.vy;
                const maxSpeedSq = MAX_SPEED * MAX_SPEED;
                if (speedSq > maxSpeedSq) {
                    const scale = MAX_SPEED / Math.sqrt(speedSq);
                    this.vx *= scale;
                    this.vy *= scale;
                }

                this.x += this.vx * frame;
                this.y += this.vy * frame;
                this.rotX += this.rotVx * frame;
                this.rotY += this.rotVy * frame;
                this.rotZ += this.rotVz * frame;
                this.wrapAngles();
                this.scale = this.baseScale * (1 + this.pulse);
                this.radius = this.extent * this.scale + 10;
            }

            applyMouse(mouseAbsX, mouseAbsY, mouseActive, frame, damp) {
                if (this.dragging) {
                    this.highlight += (1 - this.highlight) * damp.opacityIn;
                    return;
                }
                const mouseScale = params.molecules.mouse;
                if (!mouseActive || mouseScale <= 0.01) {
                    this.highlight += (0 - this.highlight) * damp.opacityOut;
                    this.opacity += (this.baseOpacity - this.opacity) * damp.opacityOut;
                    return;
                }

                const dx = mouseAbsX - this.x;
                const dy = mouseAbsY - this.y;
                const distSq = dx * dx + dy * dy;
                const radius = MOUSE_RADIUS * mouseScale + this.radius * 0.45;
                const radiusSq = radius * radius;

                if (distSq >= radiusSq) {
                    this.highlight += (0 - this.highlight) * damp.opacityOut;
                    this.opacity += (this.baseOpacity - this.opacity) * damp.opacityOut;
                    return;
                }

                const dist = Math.sqrt(Math.max(distSq, 0.001));
                const falloff = 1 - dist / radius;
                const f = falloff * falloff;
                this.highlight += (Math.min(1, f * 1.35) - this.highlight) * damp.opacityIn;

                this.rotVy += dx * 0.00009 * f * frame * mouseScale;
                this.rotVx -= dy * 0.00009 * f * frame * mouseScale;
                this.vx += dx * 0.0009 * f * frame * mouseScale;
                this.vy += dy * 0.0009 * f * frame * mouseScale;

                const hoverBoost = colors.visibility.hoverOpacityBoost;
                const targetOpacity = Math.min(0.92, this.baseOpacity + f * hoverBoost);
                this.opacity += (targetOpacity - this.opacity) * damp.opacityIn;
            }

            project(scrollY) {
                const cosX = Math.cos(this.rotX);
                const sinX = Math.sin(this.rotX);
                const cosY = Math.cos(this.rotY);
                const sinY = Math.sin(this.rotY);
                const cosZ = Math.cos(this.rotZ);
                const sinZ = Math.sin(this.rotZ);
                const atoms = this.atoms;
                const scale = this.scale;
                const originX = this.x;
                const originY = this.y - scrollY;

                for (let i = 0; i < atoms.length; i++) {
                    const a = atoms[i];
                    let x = a.x;
                    let y = a.y;
                    let z = a.z;

                    let y1 = y * cosX - z * sinX;
                    let z1 = y * sinX + z * cosX;
                    y = y1;
                    z = z1;

                    let x1 = x * cosY + z * sinY;
                    z1 = -x * sinY + z * cosY;
                    x = x1;
                    z = z1;

                    x1 = x * cosZ - y * sinZ;
                    y1 = x * sinZ + y * cosZ;
                    x = x1;
                    y = y1;

                    const perspective = FOCAL / (FOCAL + DEPTH_OFFSET + z);
                    a.sx = originX + x * scale * perspective;
                    a.sy = originY + y * scale * perspective;
                    a.sz = z;
                    a.sr = ATOM_RADIUS[a.kind] * scale * perspective * (1 + this.highlight * 0.18);
                }

                const order = this.atomOrder;
                for (let i = 1; i < order.length; i++) {
                    const id = order[i];
                    const z = atoms[id].sz;
                    let j = i - 1;
                    while (j >= 0 && atoms[order[j]].sz > z) {
                        order[j + 1] = order[j];
                        j -= 1;
                    }
                    order[j + 1] = id;
                }
            }

            draw(viewHeight) {
                const vis = colors.visibility;
                const h = this.highlight;
                const edge = vis.edgeFade;
                let edgeMul = 1;
                let minSy = 1e9;
                let maxSy = -1e9;
                for (let i = 0; i < this.atoms.length; i++) {
                    const sy = this.atoms[i].sy;
                    if (sy < minSy) {
                        minSy = sy;
                    }
                    if (sy > maxSy) {
                        maxSy = sy;
                    }
                }
                if (maxSy < 0 || minSy > viewHeight) {
                    return;
                }
                if (minSy < 48) {
                    edgeMul = Math.max(edge, minSy / 48);
                }
                if (maxSy > viewHeight - 48) {
                    edgeMul = Math.min(edgeMul, Math.max(edge, (viewHeight - maxSy) / 48));
                }

                const alpha = this.opacity * edgeMul;
                const bondColor =
                    h > 0.72
                        ? accentColorStr
                        : h > 0.04
                          ? rgbToString(mixRgb(colors.particleRgb, colors.hoverAccentRgb, Math.min(1, h * 1.2)))
                          : particleColorStr;
                const bondAlpha = vis.bondAlpha + (vis.hoverBondAlpha - vis.bondAlpha) * h;

                ctx.strokeStyle = bondColor;
                for (let i = 0; i < this.bonds.length; i++) {
                    const bond = this.bonds[i];
                    const a = this.atoms[bond.a];
                    const b = this.atoms[bond.b];
                    const avgZ = (a.sz + b.sz) * 0.5;
                    const depth = Math.max(0.45, 1 - (avgZ + 36) / 140);
                    const width = (1.2 + bond.order * 0.55) * this.scale * depth;
                    ctx.globalAlpha = alpha * bondAlpha * depth;
                    ctx.lineWidth = width;
                    if (bond.order >= 2) {
                        const dx = b.sx - a.sx;
                        const dy = b.sy - a.sy;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const ox = (-dy / len) * 1.7 * this.scale;
                        const oy = (dx / len) * 1.7 * this.scale;
                        ctx.beginPath();
                        ctx.moveTo(a.sx + ox, a.sy + oy);
                        ctx.lineTo(b.sx + ox, b.sy + oy);
                        ctx.moveTo(a.sx - ox, a.sy - oy);
                        ctx.lineTo(b.sx - ox, b.sy - oy);
                        ctx.stroke();
                    } else {
                        ctx.beginPath();
                        ctx.moveTo(a.sx, a.sy);
                        ctx.lineTo(b.sx, b.sy);
                        ctx.stroke();
                    }
                }

                const order = this.atomOrder;
                for (let i = 0; i < order.length; i++) {
                    const atom = this.atoms[order[i]];
                    const depth = Math.max(0.4, 1 - (atom.sz + 36) / 140);
                    const r = atom.sr;
                    if (r < 0.4) {
                        continue;
                    }
                    let sprite = sprites.carbon;
                    if (h > 0.55) {
                        sprite = sprites.accent;
                    } else if (atom.kind === KIND_HETERO) {
                        sprite = sprites.hetero;
                    } else if (atom.kind === KIND_H) {
                        sprite = sprites.hydrogen;
                    }
                    ctx.globalAlpha = alpha * (0.72 + depth * 0.28);
                    ctx.drawImage(sprite, atom.sx - r, atom.sy - r, r * 2, r * 2);
                    if (h > 0.04 && h <= 0.55 && atom.kind !== KIND_HETERO) {
                        ctx.globalAlpha = alpha * h * 0.85 * (0.72 + depth * 0.28);
                        ctx.drawImage(sprites.accent, atom.sx - r, atom.sy - r, r * 2, r * 2);
                    }
                }
            }
        }

        const findOpenPosition = (mol, rng) => {
            const minDist = 48;
            const minDistSq = minDist * minDist;
            for (let attempt = 0; attempt < 10; attempt++) {
                mol.place(rng);
                let ok = true;
                for (let i = 0; i < molecules.length; i++) {
                    const other = molecules[i];
                    if (other.id === mol.id) {
                        continue;
                    }
                    const dx = mol.x - other.x;
                    const dy = mol.y - other.y;
                    const need = (mol.radius + other.radius) * 0.55;
                    const needSq = Math.max(minDistSq, need * need);
                    if (dx * dx + dy * dy < needSq) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    return;
                }
            }
        };

        const adjustMolecules = (previousWidth, previousDocHeight) => {
            const targetCount = getTargetCount();

            if (moleculesInitialized && molecules.length > 0 && previousDocHeight > 0 && Math.abs(docHeight - previousDocHeight) > 30) {
                const heightRatio = docHeight / previousDocHeight;
                for (let i = 0; i < molecules.length; i++) {
                    molecules[i].y *= heightRatio;
                }
            }

            if (moleculesInitialized && molecules.length > 0 && previousWidth > 0 && width !== previousWidth) {
                const widthRatio = width / previousWidth;
                for (let i = 0; i < molecules.length; i++) {
                    molecules[i].x *= widthRatio;
                }
            }

            if (molecules.length < targetCount) {
                const diff = targetCount - molecules.length;
                let maxId = molecules.reduce((max, p) => (p.id > max ? p.id : max), -1);
                for (let i = 0; i < diff; i++) {
                    const mol = new Molecule(maxId + 1 + i, true);
                    findOpenPosition(mol, createRng());
                    molecules.push(mol);
                }
            } else if (molecules.length > targetCount) {
                molecules.length = targetCount;
            }
        };

        const initMolecules = (opts) => {
            molecules.length = 0;
            const targetCount = getTargetCount();
            const fadeIn = !(opts && opts.quiet) && !reducedMotion;
            for (let i = 0; i < targetCount; i++) {
                const mol = new Molecule(i, fadeIn);
                findOpenPosition(mol, createRng());
                molecules.push(mol);
            }
            moleculesInitialized = targetCount > 0;
        };

        const clearSimData = () => {
            moleculesInitialized = false;
            molecules.length = 0;
            visibleMolecules.length = 0;
            fx.clear();
            simReady = false;
        };

        const initCurrentMode = (fadeCanvas) => {
            clearSimData();
            if (mode === "molecules") {
                initMolecules();
            } else {
                fx.init(mode);
            }
            simReady = true;
            if (fadeCanvas) {
                mouse.x = -1000;
                mouse.y = -1000;
                canvas.style.opacity = "0";
                requestAnimationFrame(() => {
                    canvas.style.opacity = "1";
                });
            }
        };

        const updateCanvasDimensions = () => {
            const currentScrollHeight = getDocumentScrollHeight();
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            const currentDpr = getDpr();
            const previousWidth = width;
            const previousDocHeight = docHeight;

            let sizeChanged = false;
            if (width !== currentWidth || height !== currentHeight || dpr !== currentDpr) {
                width = currentWidth;
                height = currentHeight;
                dpr = currentDpr;
                applyCanvasSize();
                sizeChanged = true;
            }
            if (Math.abs(docHeight - currentScrollHeight) > 30) {
                docHeight = currentScrollHeight;
                sizeChanged = true;
            }

            if (sizeChanged && enabled) {
                if (mode === "molecules") {
                    adjustMolecules(previousWidth, previousDocHeight);
                } else {
                    fx.adjust(mode, previousWidth, previousDocHeight);
                }
            }
        };

        const scheduleDimensionUpdate = () => {
            if (resizeRaf !== null) {
                return;
            }
            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                updateCanvasDimensions();
            });
        };

        const clearCanvas = () => {
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, width, height);
        };

        const separateMolecules = (frame) => {
            const n = visibleMolecules.length;
            for (let i = 0; i < n; i++) {
                const a = visibleMolecules[i];
                if (a.dragging) {
                    continue;
                }
                for (let j = i + 1; j < n; j++) {
                    const b = visibleMolecules[j];
                    if (b.dragging) {
                        continue;
                    }
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const min = (a.radius + b.radius) * 0.88;
                    const distSq = dx * dx + dy * dy;
                    if (distSq >= min * min || distSq < 0.01) {
                        continue;
                    }
                    const dist = Math.sqrt(distSq);
                    const overlap = (min - dist) / min;
                    const push = overlap * overlap * 0.46 * frame;
                    const inv = 1 / dist;
                    const px = dx * inv * push;
                    const py = dy * inv * push;
                    a.x += px;
                    a.y += py;
                    b.x -= px;
                    b.y -= py;
                    a.vx += px * 0.18;
                    a.vy += py * 0.18;
                    b.vx -= px * 0.18;
                    b.vy -= py * 0.18;
                }
            }
        };

        const renderMolecules = (scrollY, viewHeight, projectOnly) => {
            visibleMolecules.length = 0;
            const padding = 160;
            for (let i = 0; i < molecules.length; i++) {
                const mol = molecules[i];
                const screenY = mol.y - scrollY;
                if (screenY >= -padding && screenY <= viewHeight + padding) {
                    visibleMolecules.push(mol);
                    mol.project(scrollY);
                    if (!projectOnly) {
                        mol.draw(viewHeight);
                    }
                }
            }
            if (!projectOnly) {
                ctx.globalAlpha = 1;
            }
        };

        const tickMolecules = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive) => {
            const farPadding = viewHeight + 260;
            for (let i = 0; i < molecules.length; i++) {
                const mol = molecules[i];
                const screenY = mol.y - scrollY;
                const nearView = screenY >= -farPadding && screenY <= viewHeight + farPadding;
                mol.integrate(frame, damp);
                if (nearView) {
                    mol.applyMouse(mouseAbsX, mouseAbsY, mouseActive, frame, damp);
                } else if (!mol.dragging) {
                    mol.highlight += (0 - mol.highlight) * damp.opacityOut;
                }
            }

            visibleMolecules.length = 0;
            const padding = 160;
            for (let i = 0; i < molecules.length; i++) {
                const mol = molecules[i];
                const screenY = mol.y - scrollY;
                if (screenY >= -padding && screenY <= viewHeight + padding) {
                    visibleMolecules.push(mol);
                }
            }

            separateMolecules(frame);

            for (let i = 0; i < molecules.length; i++) {
                if (!molecules[i].dragging) {
                    molecules[i].enforceBounds();
                }
            }

            for (let i = 0; i < visibleMolecules.length; i++) {
                visibleMolecules[i].project(scrollY);
                visibleMolecules[i].draw(viewHeight);
            }
        };

        const tickCurrentMode = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
            if (mode === "molecules") {
                if (animate) {
                    tickMolecules(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive);
                } else {
                    for (let i = 0; i < molecules.length; i++) {
                        molecules[i].scale = molecules[i].baseScale;
                        molecules[i].opacity = molecules[i].baseOpacity;
                    }
                    renderMolecules(scrollY, viewHeight, false);
                }
                return;
            }
            fx.tick(mode, frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        };

        const drawStatic = () => {
            clearCanvas();
            if (!simReady && !moleculesInitialized) {
                return;
            }
            const scrollY = window.scrollY;
            const viewHeight = window.innerHeight;
            tickCurrentMode(1, { fadeIn: 1, cruise: 1, opacityOut: 1, opacityIn: 1 }, scrollY, viewHeight, -1000, -1000, false, false);
        };

        const draw = (now) => {
            animationFrameId = null;

            if (!isPageVisible || !enabled) {
                return;
            }

            if (reducedMotion) {
                drawStatic();
                return;
            }

            if (!lastFrameTime) {
                lastFrameTime = now;
            }
            let dt = (now - lastFrameTime) / 1000;
            lastFrameTime = now;
            if (dt > 0.05) {
                dt = 0.05;
            } else if (dt <= 0) {
                dt = 1 / REF_FPS;
            }
            const frame = dt * REF_FPS;
            const damp = {
                fadeIn: 1 - Math.pow(0.95, frame),
                cruise: 1 - Math.pow(0.96, frame),
                spin: 1 - Math.pow(0.975, frame),
                pulse: 1 - Math.pow(0.9, frame),
                opacityOut: 1 - Math.pow(0.9, frame),
                opacityIn: 1 - Math.pow(0.78, frame),
            };

            clearCanvas();

            if (!simReady && !moleculesInitialized) {
                scheduleNextFrame();
                return;
            }

            const scrollY = window.scrollY;
            const viewHeight = window.innerHeight;
            const mouseAbsX = mouse.x;
            const mouseAbsY = mouse.y + scrollY;
            const mouseActive = !drag.active && mouse.x > -500 && mouse.y > -500;

            tickCurrentMode(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, true);
            ctx.globalAlpha = 1;

            scheduleNextFrame();
        };

        const scheduleNextFrame = () => {
            if (animationFrameId !== null || !enabled) {
                return;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        const stopAnimation = (immediate = false) => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            if (stopTimeoutId !== null) {
                clearTimeout(stopTimeoutId);
                stopTimeoutId = null;
            }

            const finishStop = () => {
                ctx.globalAlpha = 1;
                ctx.clearRect(0, 0, width, height);
                canvas.style.opacity = "0";
                clearSimData();
                lastFrameTime = 0;
                stopTimeoutId = null;
            };

            if (immediate) {
                finishStop();
                return;
            }

            canvas.style.opacity = "0";
            stopTimeoutId = setTimeout(finishStop, CANVAS_FADE_MS);
        };

        const startAnimation = () => {
            const wasFading = stopTimeoutId !== null;
            if (stopTimeoutId !== null) {
                clearTimeout(stopTimeoutId);
                stopTimeoutId = null;
            }
            colors = getThemeColors();
            particleColorStr = rgbToString(colors.particleRgb);
            accentColorStr = rgbToString(colors.hoverAccentRgb);
            bgColorStr = rgbToString(colors.bgRgb);
            rebuildSprites();
            updateCanvasDimensions();
            lastFrameTime = 0;

            if (!simReady || !wasFading) {
                initCurrentMode(true);
            } else {
                canvas.style.opacity = "1";
            }

            if (reducedMotion) {
                drawStatic();
                return;
            }
            scheduleNextFrame();
        };

        const handleReducedMotionScroll = () => {
            if (reducedMotion && enabled && (simReady || moleculesInitialized)) {
                drawStatic();
            }
        };

        const persistParams = () => {
            if (persistTimer) {
                clearTimeout(persistTimer);
            }
            persistTimer = setTimeout(() => {
                localStorage.setItem(BG_PARAMS_KEY, JSON.stringify(params));
                localStorage.setItem(BG_RANDOM_KEY, randomMode ? "on" : "off");
                if (!randomMode) {
                    localStorage.setItem(BG_MODE_KEY, mode);
                }
            }, 80);
        };

        const applyFrost = () => {
            const t = params.frost;
            const root = document.documentElement;
            if (t < 0.04) {
                root.style.setProperty("--site-frost-blur", "0px");
                root.style.setProperty("--site-frost-tint", "0%");
                if (sitePanel) {
                    sitePanel.classList.add("site-glass-off");
                }
                return;
            }
            root.style.setProperty("--site-frost-blur", `${(8 + t * 16).toFixed(1)}px`);
            root.style.setProperty("--site-frost-tint", `${Math.round(10 + t * 20)}%`);
            if (sitePanel) {
                sitePanel.classList.remove("site-glass-off");
            }
        };

        const applyLiveParams = (changedKey) => {
            applyFrost();
            if (!enabled) {
                return;
            }
            const rebuild = changedKey === "density" || (mode === "life" && changedKey === "size");
            if (mode === "molecules") {
                for (let i = 0; i < molecules.length; i++) {
                    molecules[i].applySizeAndSpin();
                }
                if (rebuild) {
                    initMolecules({ quiet: true });
                } else {
                    adjustMolecules(width, docHeight);
                }
                return;
            }
            if (rebuild) {
                fx.init(mode, { quiet: true });
                return;
            }
            fx.adjust(mode, width, docHeight);
        };

        const formatParam = (value) => {
            if (Math.abs(value - Math.round(value)) < 0.001) {
                return String(Math.round(value));
            }
            return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
        };

        const paramBounds = (scope, key) => {
            if (scope === "frost") {
                return { min: 0, max: 1, step: 0.05 };
            }
            const fields = PARAM_FIELDS[scope];
            if (!fields) {
                return null;
            }
            for (let i = 0; i < fields.length; i++) {
                if (fields[i].key === key) {
                    return fields[i];
                }
            }
            return null;
        };

        const currentParamValue = (scope, key) => {
            if (scope === "frost") {
                return params.frost;
            }
            if (scope && key && params[scope]) {
                return params[scope][key];
            }
            return null;
        };

        const paramRow = (label, value, min, max, step, scope, key) => {
            const keyAttr = key ? ` data-key="${key}"` : "";
            return `<div class="bg-sim-row"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-scope="${scope}"${keyAttr}><input type="number" min="${min}" max="${max}" step="any" inputmode="decimal" value="${formatParam(value)}" data-scope="${scope}"${keyAttr}></div>`;
        };

        const setParamValue = (scope, key, value, sourceInput, commit) => {
            const bounds = paramBounds(scope, key);
            if (!bounds) {
                return;
            }
            const next = clamp(value, bounds.min, bounds.max);
            if (scope === "frost") {
                params.frost = next;
            } else {
                params[scope][key] = next;
            }
            const row = sourceInput && sourceInput.parentElement;
            if (row) {
                const range = row.querySelector('input[type="range"]');
                const number = row.querySelector('input[type="number"]');
                if (range && range !== sourceInput) {
                    range.value = String(next);
                }
                if (number && (commit || number !== sourceInput)) {
                    number.value = formatParam(next);
                }
            }
            persistParams();
            applyLiveParams(key);
        };

        const renderPanel = () => {
            if (!panelEl) {
                return;
            }
            const fields = PARAM_FIELDS[mode];
            let modesHtml = "";
            for (let i = 0; i < MODES.length; i++) {
                const id = MODES[i];
                const pressed = id === mode ? "true" : "false";
                modesHtml += `<button type="button" class="bg-sim-mode" data-mode="${id}" aria-pressed="${pressed}">${MODE_LABELS[id]}</button>`;
            }
            let rows = paramRow("Frost", params.frost, 0, 1, 0.05, "frost");
            for (let i = 0; i < fields.length; i++) {
                const field = fields[i];
                rows += paramRow(field.label, params[mode][field.key], field.min, field.max, field.step, mode, field.key);
            }
            const randomNote = randomMode
                ? `<p class="bg-sim-note">Random is on, so a new simulation is picked each visit.</p>`
                : "";
            panelEl.innerHTML = `<div class="bg-sim-head"><strong>Background</strong><span class="bg-sim-tools"><button type="button" class="bg-sim-close" data-action="toggle" aria-pressed="${enabled ? "true" : "false"}">${enabled ? "On" : "Off"}</button><button type="button" class="bg-sim-close" data-action="random" aria-pressed="${randomMode ? "true" : "false"}">Random</button><button type="button" class="bg-sim-close" data-action="close" aria-label="Close">X</button></span></div><div class="bg-sim-modes">${modesHtml}</div>${rows}<p class="bg-sim-hint">${MODE_HINTS[mode]}</p>${randomNote}`;
        };

        const setMode = (nextMode) => {
            if (MODES.indexOf(nextMode) < 0 || nextMode === mode) {
                renderPanel();
                return;
            }
            mode = nextMode;
            persistParams();
            renderPanel();
            updateToggleLabel();
            if (!enabled) {
                return;
            }
            lastFrameTime = 0;
            initCurrentMode(true);
            if (reducedMotion) {
                drawStatic();
                return;
            }
            scheduleNextFrame();
        };

        const setPanelOpen = (open) => {
            if (!panelEl) {
                return;
            }
            panelEl.hidden = !open;
            updateToggleLabel();
        };

        const ensurePanel = () => {
            if (panelEl) {
                return;
            }
            panelEl = document.createElement("div");
            panelEl.id = "bg-sim-panel";
            panelEl.className = "bg-sim-panel";
            panelEl.hidden = true;
            panelEl.setAttribute("role", "dialog");
            panelEl.setAttribute("aria-label", "Background effects");
            document.body.appendChild(panelEl);
            const handleParamField = (event, commit) => {
                const input = event.target;
                if (!(input instanceof HTMLInputElement) || (input.type !== "range" && input.type !== "number")) {
                    return;
                }
                const scope = input.dataset.scope;
                const key = input.dataset.key;
                const raw = input.value.trim();
                if (input.type === "number" && !commit && (raw === "" || raw === "-" || raw === "." || raw === "-.")) {
                    return;
                }
                const value = Number(raw);
                if (!Number.isFinite(value)) {
                    if (commit) {
                        const current = currentParamValue(scope, key);
                        if (typeof current === "number") {
                            input.value = formatParam(current);
                        }
                    }
                    return;
                }
                setParamValue(scope, key, value, input, commit || input.type === "range");
            };
            panelEl.addEventListener("input", (event) => {
                handleParamField(event, false);
            });
            panelEl.addEventListener("change", (event) => {
                handleParamField(event, true);
            });
            panelEl.addEventListener("keydown", (event) => {
                if (event.key !== "Enter") {
                    return;
                }
                const input = event.target;
                if (input instanceof HTMLInputElement && input.type === "number") {
                    handleParamField(event, true);
                    input.blur();
                }
            });
            panelEl.addEventListener("click", (event) => {
                event.stopPropagation();
                const actionBtn = event.target.closest("[data-action]");
                if (actionBtn) {
                    const action = actionBtn.getAttribute("data-action");
                    if (action === "close") {
                        setPanelOpen(false);
                    } else if (action === "toggle") {
                        toggleEnabled();
                    } else if (action === "random") {
                        setRandomMode(!randomMode);
                    }
                    return;
                }
                const button = event.target.closest("[data-mode]");
                if (!button) {
                    return;
                }
                setMode(button.getAttribute("data-mode"));
            });
            renderPanel();
        };

        const isGutterX = (clientX) => {
            if (width < GUTTER_MIN_WIDTH) {
                return true;
            }
            const gutter = (width - Math.min(CONTENT_MAX_WIDTH, width)) * 0.5;
            return clientX < gutter + 40 || clientX > width - gutter - 40;
        };

        const hitTest = (absX, absY) => {
            if (mode !== "molecules") {
                return fx.hitTest(mode, absX, absY);
            }
            let best = null;
            let bestD = 1e9;
            for (let i = 0; i < molecules.length; i++) {
                const mol = molecules[i];
                const dx = mol.x - absX;
                const dy = mol.y - absY;
                const r = mol.radius * 0.95;
                const d = dx * dx + dy * dy;
                if (d < r * r && d < bestD) {
                    bestD = d;
                    best = mol;
                }
            }
            return best;
        };

        const beginDrag = (target, clientX, clientY, pointerId) => {
            if (!target || reducedMotion) {
                return;
            }
            drag.active = true;
            drag.kind = mode;
            drag.target = target;
            drag.offsetX = target.x - clientX;
            drag.offsetY = target.y - (clientY + window.scrollY);
            drag.lastX = clientX;
            drag.lastY = clientY;
            drag.lastT = performance.now();
            drag.vx = 0;
            drag.vy = 0;
            drag.moved = 0;
            drag.pointerId = pointerId;
            target.dragging = true;
            target.vx = 0;
            target.vy = 0;
            document.body.classList.add("bg-grabbing");
            document.body.classList.remove("bg-can-grab");
        };

        const moveDrag = (clientX, clientY) => {
            if (!drag.active || !drag.target) {
                return;
            }
            const now = performance.now();
            const dt = Math.max(8, now - drag.lastT);
            const nx = clientX + drag.offsetX;
            const ny = clientY + window.scrollY + drag.offsetY;
            drag.vx = ((nx - drag.target.x) / dt) * 16.7;
            drag.vy = ((ny - drag.target.y) / dt) * 16.7;
            drag.moved += Math.abs(clientX - drag.lastX) + Math.abs(clientY - drag.lastY);
            drag.lastX = clientX;
            drag.lastY = clientY;
            drag.lastT = now;
            drag.target.x = nx;
            drag.target.y = ny;
        };

        const endDrag = () => {
            if (!drag.active) {
                return false;
            }
            const target = drag.target;
            const moved = drag.moved;
            if (target) {
                target.dragging = false;
                target.vx = clamp(drag.vx, -MAX_SPEED, MAX_SPEED);
                target.vy = clamp(drag.vy, -MAX_SPEED, MAX_SPEED);
                if (typeof target.lane === "number") {
                    const contentWidth = Math.min(CONTENT_MAX_WIDTH, width);
                    const gutter = (width - contentWidth) * 0.5;
                    if (width >= GUTTER_MIN_WIDTH && gutter > 70) {
                        target.lane = target.x < gutter + 24 ? -1 : target.x > width - gutter - 24 ? 1 : 0;
                    } else {
                        target.lane = 0;
                    }
                }
            }
            drag.active = false;
            drag.target = null;
            drag.pointerId = null;
            drag.moved = 0;
            document.body.classList.remove("bg-grabbing");
            return moved > 6;
        };

        const cancelLongPress = () => {
            if (longPressTimer !== null) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        const persistEnabled = () => {
            localStorage.setItem(BG_ENABLED_KEY, enabled ? "on" : "off");
        };

        const setEnabled = (nextEnabled) => {
            enabled = nextEnabled;
            persistEnabled();
            updateToggleLabel();
            renderPanel();

            if (!enabled) {
                stopAnimation();
                return;
            }

            startAnimation();
        };

        const toggleEnabled = () => {
            setEnabled(!enabled);
        };

        const setRandomMode = (nextRandom) => {
            randomMode = !!nextRandom;
            persistParams();
            if (randomMode) {
                setMode(pickRandomMode(mode));
                return;
            }
            localStorage.setItem(BG_MODE_KEY, mode);
            renderPanel();
        };

        const updateToggleLabel = () => {
            if (!toggleButton) {
                return;
            }
            const open = panelEl && !panelEl.hidden;
            const dot = enabled ? "○" : "●";
            toggleButton.textContent = `Background/${dot}`;
            toggleButton.setAttribute("aria-label", `Background: ${enabled ? "On" : "Off"}`);
            toggleButton.setAttribute("aria-expanded", open ? "true" : "false");
            toggleButton.setAttribute("aria-controls", "bg-sim-panel");
        };

        const initializeParticlesWhenReady = async () => {
            try {
                if (document.fonts && document.fonts.ready) {
                    await Promise.race([
                        document.fonts.ready,
                        new Promise((resolve) => setTimeout(resolve, 2000)),
                    ]);
                }
            } catch (_error) {
                // Continue even if font loading fails.
            }

            persistEnabled();
            updateToggleLabel();
            ensurePanel();
            applyFrost();
            renderPanel();

            if (!enabled) {
                stopAnimation(true);
                return;
            }

            startAnimation();
        };

        const clearMouse = () => {
            mouse.x = -1000;
            mouse.y = -1000;
        };

        window.addEventListener(
            "mousemove",
            (e) => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            },
            { passive: true }
        );

        window.addEventListener("mouseleave", clearMouse);
        document.addEventListener("mouseout", (e) => {
            if (!e.relatedTarget) {
                clearMouse();
            }
        });
        window.addEventListener("blur", clearMouse);

        window.addEventListener(
            "touchmove",
            (e) => {
                if (e.touches.length > 0) {
                    mouse.x = e.touches[0].clientX;
                    mouse.y = e.touches[0].clientY;
                }
            },
            { passive: true }
        );

        window.addEventListener("touchend", clearMouse);

        const blastAt = (clickX, clickY) => {
            if (!enabled || reducedMotion) {
                return;
            }
            const blastRadiusSq = BLAST_RADIUS * BLAST_RADIUS;
            const rng = createRng();

            const blastItem = (item, extra) => {
                if (!item || typeof item.x !== "number" || typeof item.y !== "number") {
                    return;
                }
                const dx = item.x - clickX;
                const dy = item.y - clickY;
                const distSq = dx * dx + dy * dy;
                if (distSq >= blastRadiusSq || distSq <= 0.01) {
                    return;
                }
                const dist = Math.sqrt(distSq);
                const force = (BLAST_RADIUS - dist) / BLAST_RADIUS;
                const push = force * force * 14;
                const inv = 1 / dist;
                if (typeof item.vx === "number") {
                    item.vx += dx * inv * push;
                }
                if (typeof item.vy === "number") {
                    item.vy += dy * inv * push;
                }
                if (extra) {
                    extra(item, force, dx, dy, inv);
                }
            };

            if (!fx.blast(mode, rng, blastItem, clickX, clickY)) {
                for (let i = 0; i < molecules.length; i++) {
                    blastItem(molecules[i], (mol, force) => {
                        mol.rotVx += (rng.next() - 0.5) * force * 0.28;
                        mol.rotVy += (rng.next() - 0.5) * force * 0.32;
                        mol.rotVz += (rng.next() - 0.5) * force * 0.22;
                        mol.pulse = Math.min(0.55, mol.pulse + force * 0.45);
                        mol.opacity = Math.min(0.9, mol.baseOpacity + force * 0.28);
                        mol.highlight = Math.min(1, mol.highlight + force * 0.8);
                    });
                }
            }
        };

        window.addEventListener("click", (e) => {
            if (pointerTap.blasted) {
                pointerTap.blasted = false;
                return;
            }
            if (e.target.closest(INTERACTIVE_SELECTOR)) {
                return;
            }
            if (!enabled || reducedMotion) {
                return;
            }
            blastAt(e.clientX, e.clientY + window.scrollY);
        });

        const themeObserver = new MutationObserver(() => {
            colors = getThemeColors();
            particleColorStr = rgbToString(colors.particleRgb);
            accentColorStr = rgbToString(colors.hoverAccentRgb);
            bgColorStr = rgbToString(colors.bgRgb);
            rebuildSprites();
            if (reducedMotion && enabled && (simReady || moleculesInitialized)) {
                drawStatic();
            }
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        document.addEventListener("visibilitychange", () => {
            isPageVisible = !document.hidden;
            if (isPageVisible && enabled && !reducedMotion) {
                lastFrameTime = 0;
                scheduleNextFrame();
            }
        });

        reducedMotionQuery.addEventListener("change", (event) => {
            reducedMotion = event.matches;
            if (!enabled) {
                return;
            }
            startAnimation();
        });

        window.addEventListener("resize", scheduleDimensionUpdate);
        window.addEventListener("scroll", handleReducedMotionScroll, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", scheduleDimensionUpdate);
            window.visualViewport.addEventListener("scroll", scheduleDimensionUpdate);
        }

        if (typeof ResizeObserver !== "undefined" && document.body) {
            const resizeObserver = new ResizeObserver(() => {
                scheduleDimensionUpdate();
            });
            resizeObserver.observe(document.body);
        }

        window.addEventListener("pointerdown", (e) => {
            pointerTap.interactive = !!e.target.closest(INTERACTIVE_SELECTOR);
            pointerTap.blasted = false;
            pointerTap.x = e.clientX;
            pointerTap.y = e.clientY;
            if (!enabled || reducedMotion || pointerTap.interactive) {
                return;
            }
            const absX = e.clientX;
            const absY = e.clientY + window.scrollY;
            const target = hitTest(absX, absY);
            if (!target) {
                return;
            }
            if (width >= GUTTER_MIN_WIDTH) {
                beginDrag(target, e.clientX, e.clientY, e.pointerId);
                e.preventDefault();
                return;
            }
            cancelLongPress();
            pressStartX = e.clientX;
            pressStartY = e.clientY;
            const sx = e.clientX;
            const sy = e.clientY;
            const id = e.pointerId;
            longPressTimer = setTimeout(() => {
                longPressTimer = null;
                beginDrag(target, sx, sy, id);
            }, 380);
        });

        window.addEventListener(
            "pointermove",
            (e) => {
                if (longPressTimer !== null) {
                    if (Math.abs(e.clientX - pressStartX) + Math.abs(e.clientY - pressStartY) > 10) {
                        cancelLongPress();
                    }
                }
                if (drag.active) {
                    moveDrag(e.clientX, e.clientY);
                    e.preventDefault();
                    return;
                }
                if (!enabled || reducedMotion || width < GUTTER_MIN_WIDTH) {
                    if (hoverGrab) {
                        document.body.classList.remove("bg-can-grab");
                        hoverGrab = false;
                    }
                    return;
                }
                const over = hitTest(e.clientX, e.clientY + window.scrollY);
                if (over && !hoverGrab) {
                    document.body.classList.add("bg-can-grab");
                    hoverGrab = true;
                } else if (!over && hoverGrab) {
                    document.body.classList.remove("bg-can-grab");
                    hoverGrab = false;
                }
            },
            { passive: false }
        );

        const finishPointer = (e) => {
            cancelLongPress();
            const draggedFar = endDrag();
            if (!e || e.type === "pointercancel") {
                pointerTap.blasted = true;
                return;
            }
            if (draggedFar || pointerTap.interactive || pointerTap.blasted) {
                pointerTap.blasted = true;
                return;
            }
            if (!enabled || reducedMotion) {
                return;
            }
            const x = e.clientX != null ? e.clientX : pointerTap.x;
            const y = e.clientY != null ? e.clientY : pointerTap.y;
            blastAt(x, y + window.scrollY);
            pointerTap.blasted = true;
        };

        window.addEventListener("pointerup", finishPointer);
        window.addEventListener("pointercancel", finishPointer);

        if (toggleButton) {
            toggleButton.addEventListener("click", (e) => {
                e.stopPropagation();
                ensurePanel();
                renderPanel();
                setPanelOpen(panelEl.hidden);
            });
        }

        applyFrost();
        ensurePanel();

        if (document.readyState === "complete") {
            initializeParticlesWhenReady();
        } else {
            window.addEventListener("load", initializeParticlesWhenReady);
        }

        return {
            updateCanvasDimensions,
            scheduleDimensionUpdate,
            setEnabled,
        };
    }

    window.initParticleBackground = initParticleBackground;
})();
