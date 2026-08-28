import {
    ATOM_RADIUS,
    BOND,
    CONTENT_MAX_WIDTH,
    COUNT_CAPS,
    DEPTH_OFFSET,
    FOCAL,
    GUTTER_MIN_WIDTH,
    KIND_C,
    KIND_H,
    KIND_HETERO,
    MAX_SPEED,
    MAX_SPIN,
    MOBILE_BREAKPOINT,
    MOUSE_RADIUS,
} from "../config.js";
import { clampCount, getVisibilityProfile, mixRgb, rgbToString, viewAreaScale } from "../core.js";

export function create(S) {
    const molecules = [];
    const visibleMolecules = [];
    let moleculesInitialized = false;
    let quietSpawn = false;

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

    class Molecule {
        constructor(id, fadeIn = false) {
            this.id = id;
            this.atoms = [];
            this.bonds = [];
            this.atomOrder = [];
            this.reset(fadeIn);
        }

        reset(fadeIn = false) {
            const rng = S.createRng();
            const built = buildStructure(rng);
            this.atoms = built.atoms;
            this.bonds = built.bonds;
            this.extent = built.extent;
            this.atomOrder.length = this.atoms.length;
            for (let i = 0; i < this.atoms.length; i++) {
                this.atomOrder[i] = i;
            }

            this.showpiece = this.atoms.length >= 12;
            const mobileScale = S.width < MOBILE_BREAKPOINT ? 0.92 : 1;
            this.baseScale =
                (0.78 + rng.next() * 0.48) * mobileScale * (this.showpiece && S.width >= MOBILE_BREAKPOINT ? 1.22 : 1);
            this.scale = this.baseScale;
            this.radius = this.extent * this.baseScale + 10;

            this.place(rng);
            this.scaleSeed = this.baseScale;
            this.baseScale = this.scaleSeed * S.params.molecules.size;
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
            this.baseRotVx = this.spinSeedX * S.params.molecules.spin;
            this.baseRotVy = this.spinSeedY * S.params.molecules.spin;
            this.baseRotVz = this.spinSeedZ * S.params.molecules.spin;
            this.rotVx = this.baseRotVx;
            this.rotVy = this.baseRotVy;
            this.rotVz = this.baseRotVz;

            const visibility = S.colors.visibility || getVisibilityProfile();
            this.baseOpacity = rng.next() * visibility.moleculeOpacityRange + visibility.moleculeOpacityMin;
            this.opacity = fadeIn ? 0 : this.baseOpacity;
            this.highlight = 0;
            this.pulse = 0;
        }

        gutterMetrics() {
            const contentWidth = Math.min(CONTENT_MAX_WIDTH, S.width);
            const gutter = (S.width - contentWidth) * 0.5;
            return { contentWidth, gutter, prefer: S.width >= GUTTER_MIN_WIDTH && gutter > 70 };
        }

        place(rng) {
            const pad = Math.min(this.radius, 48);
            this.lane = 0;
            this.x = pad + rng.next() * Math.max(1, S.width - pad * 2);
            this.y = pad + rng.next() * Math.max(1, S.docHeight - pad * 2);
        }

        enforceBounds() {
            const pad = Math.min(this.radius * 0.35, Math.max(8, Math.min(S.width, S.height) * 0.1));
            if (this.x < pad) {
                this.x = pad;
                if (this.vx < 0) {
                    this.vx = -this.vx * 0.85;
                }
                if (this.baseVx < 0) {
                    this.baseVx = -this.baseVx;
                }
            } else if (this.x > S.width - pad) {
                this.x = S.width - pad;
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
            } else if (this.y > S.docHeight - pad) {
                this.y = S.docHeight - pad;
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
            this.baseScale = this.scaleSeed * S.params.molecules.size;
            this.baseRotVx = this.spinSeedX * S.params.molecules.spin;
            this.baseRotVy = this.spinSeedY * S.params.molecules.spin;
            this.baseRotVz = this.spinSeedZ * S.params.molecules.spin;
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
            const mouseScale = S.params.molecules.mouse;
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

            const hoverBoost = S.colors.visibility.hoverOpacityBoost;
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
            const vis = S.colors.visibility;
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
                    ? S.accentColorStr
                    : h > 0.04
                      ? rgbToString(mixRgb(S.colors.particleRgb, S.colors.hoverAccentRgb, Math.min(1, h * 1.2)))
                      : S.particleColorStr;
            const bondAlpha = vis.bondAlpha + (vis.hoverBondAlpha - vis.bondAlpha) * h;

            S.ctx.strokeStyle = bondColor;
            for (let i = 0; i < this.bonds.length; i++) {
                const bond = this.bonds[i];
                const a = this.atoms[bond.a];
                const b = this.atoms[bond.b];
                const avgZ = (a.sz + b.sz) * 0.5;
                const depth = Math.max(0.45, 1 - (avgZ + 36) / 140);
                const bondWidth = (1.2 + bond.order * 0.55) * this.scale * depth;
                S.ctx.globalAlpha = alpha * bondAlpha * depth;
                S.ctx.lineWidth = bondWidth;
                if (bond.order >= 2) {
                    const dx = b.sx - a.sx;
                    const dy = b.sy - a.sy;
                    const len = Math.sqrt(dx * dx + dy * dy) || 1;
                    const ox = (-dy / len) * 1.7 * this.scale;
                    const oy = (dx / len) * 1.7 * this.scale;
                    S.ctx.beginPath();
                    S.ctx.moveTo(a.sx + ox, a.sy + oy);
                    S.ctx.lineTo(b.sx + ox, b.sy + oy);
                    S.ctx.moveTo(a.sx - ox, a.sy - oy);
                    S.ctx.lineTo(b.sx - ox, b.sy - oy);
                    S.ctx.stroke();
                } else {
                    S.ctx.beginPath();
                    S.ctx.moveTo(a.sx, a.sy);
                    S.ctx.lineTo(b.sx, b.sy);
                    S.ctx.stroke();
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
                let sprite = S.sprites.carbon;
                if (h > 0.55) {
                    sprite = S.sprites.accent;
                } else if (atom.kind === KIND_HETERO) {
                    sprite = S.sprites.hetero;
                } else if (atom.kind === KIND_H) {
                    sprite = S.sprites.hydrogen;
                }
                S.ctx.globalAlpha = alpha * (0.72 + depth * 0.28);
                S.ctx.drawImage(sprite, atom.sx - r, atom.sy - r, r * 2, r * 2);
                if (h > 0.04 && h <= 0.55 && atom.kind !== KIND_HETERO) {
                    S.ctx.globalAlpha = alpha * h * 0.85 * (0.72 + depth * 0.28);
                    S.ctx.drawImage(S.sprites.accent, atom.sx - r, atom.sy - r, r * 2, r * 2);
                }
            }
        }
    }

    const getTargetCount = () => {
        if (!S.enabled) {
            return 0;
        }
        const viewH = Math.max(S.height, 1);
        const pages = Math.max(1, S.docHeight / viewH);
        const densityMul = S.params.molecules.density;
        const areaScale = viewAreaScale(S);
        if (S.width < MOBILE_BREAKPOINT) {
            const perView = S.reducedMotion ? 6 : 12;
            return clampCount(perView * pages * areaScale * densityMul, 3, COUNT_CAPS.molecules);
        }
        const area = S.width * S.docHeight;
        const densityFactor = S.reducedMotion ? 0.45 : 1;
        const density = 0.00005 * densityFactor * densityMul * (S.quality ? S.quality.densityMul() : 1);
        return clampCount(area * density, S.reducedMotion ? 8 : 14, COUNT_CAPS.molecules);
    };

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

        if (moleculesInitialized && molecules.length > 0 && previousDocHeight > 0 && Math.abs(S.docHeight - previousDocHeight) > 30) {
            const heightRatio = S.docHeight / previousDocHeight;
            for (let i = 0; i < molecules.length; i++) {
                molecules[i].y *= heightRatio;
            }
        }

        if (moleculesInitialized && molecules.length > 0 && previousWidth > 0 && S.width !== previousWidth) {
            const widthRatio = S.width / previousWidth;
            for (let i = 0; i < molecules.length; i++) {
                molecules[i].x *= widthRatio;
            }
        }

        if (molecules.length < targetCount) {
            const diff = targetCount - molecules.length;
            let maxId = molecules.reduce((max, p) => (p.id > max ? p.id : max), -1);
            for (let i = 0; i < diff; i++) {
                const mol = new Molecule(maxId + 1 + i, true);
                findOpenPosition(mol, S.createRng());
                molecules.push(mol);
            }
        } else if (molecules.length > targetCount) {
            molecules.length = targetCount;
        }
    };

    const initMolecules = (opts) => {
        molecules.length = 0;
        const targetCount = getTargetCount();
        const fadeIn = !(opts && opts.quiet) && !S.reducedMotion;
        for (let i = 0; i < targetCount; i++) {
            const mol = new Molecule(i, fadeIn);
            findOpenPosition(mol, S.createRng());
            molecules.push(mol);
        }
        moleculesInitialized = targetCount > 0;
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
            S.ctx.globalAlpha = 1;
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

    return {
        clear() {
            moleculesInitialized = false;
            molecules.length = 0;
            visibleMolecules.length = 0;
        },
        init(opts) {
            quietSpawn = !!(opts && opts.quiet);
            try { initMolecules(opts); } finally { quietSpawn = false; }
        },
        adjust(pw, ph) { adjustMolecules(pw, ph); },
        tick(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            if (animate) {
                tickMolecules(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive);
            } else {
                for (let i = 0; i < molecules.length; i++) {
                    molecules[i].scale = molecules[i].baseScale;
                    molecules[i].opacity = molecules[i].baseOpacity;
                }
                renderMolecules(scrollY, viewHeight, false);
            }
        },
        hitTest(absX, absY) {
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
        },
        blast(rng, blastItem) {
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
            return true;
        },
        applyParams(changedKey) {
            for (let i = 0; i < molecules.length; i++) {
                molecules[i].applySizeAndSpin();
            }
            if (changedKey === "density") {
                initMolecules({ quiet: true });
            } else {
                adjustMolecules(S.width, S.docHeight);
            }
        },
    };
}
