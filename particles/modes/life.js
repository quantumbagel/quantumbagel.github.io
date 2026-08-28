import { COUNT_CAPS, MOBILE_BREAKPOINT, PATH_CAP } from "../config.js";
import {
    bindWorldHelpers,
    clampCount,
    createHashGrid,
    pagesCount,
    viewAreaScale,
} from "../core.js";

export function create(S) {
    const H = bindWorldHelpers(S);
    const bounceBounds = H.bounceBounds;
    const separateBodies = H.separateBodies;
    const placeApart = H.placeApart;
    const nearestHit = H.nearestHit;
    const rebuildHashGrid = H.rebuildHashGrid;
    const scaleDocX = H.scaleDocX;
    const scaleDocY = H.scaleDocY;
    const pushPath = H.pushPath;
    const drawFadePath = H.drawFadePath;
    let quietSpawn = false;

    const LIFE_GLIDER = [
        [0, 1],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2],
    ];
    const LIFE_RPENT = [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
        [1, 2],
    ];
    const LIFE_LWSS = [
        [0, 1],
        [0, 3],
        [1, 0],
        [2, 0],
        [3, 0],
        [3, 3],
        [4, 0],
        [4, 1],
        [4, 2],
    ];
    const life = {
        cols: 0,
        rows: 0,
        cur: null,
        next: null,
        age: null,
        acc: 0,
    };

    const lifeCellSize = () => {
        const size = (S.params.life && S.params.life.size) || 1;
        return Math.max(0.25, 10 / Math.max(0.05, size));
    };

    const lifeIndex = (x, y) => {
        const cols = life.cols;
        const rows = life.rows;
        let gx = x % cols;
        let gy = y % rows;
        if (gx < 0) gx += cols;
        if (gy < 0) gy += rows;
        return gy * cols + gx;
    };

    const lifeSet = (x, y, alive) => {
        if (!life.cur) {
            return;
        }
        const i = lifeIndex(x, y);
        life.cur[i] = alive ? 1 : 0;
        if (alive) {
            life.age[i] = 1;
        }
    };

    const stampLife = (pattern, ox, oy, rot) => {
        for (let i = 0; i < pattern.length; i++) {
            let px = pattern[i][0];
            let py = pattern[i][1];
            if (rot === 1) {
                const t = px;
                px = -py;
                py = t;
            } else if (rot === 2) {
                px = -px;
                py = -py;
            } else if (rot === 3) {
                const t = px;
                px = py;
                py = -t;
            }
            lifeSet(ox + px, oy + py, true);
        }
    };

    const seedLife = () => {
        if (!life.cur) {
            return;
        }
        const rng = S.createRng();
        const n = life.cols * life.rows;
        const fill = Math.max(0, Math.min(1, 0.11 * S.params.life.density));
        life.cur.fill(0);
        life.age.fill(0);
        for (let i = 0; i < n; i++) {
            if (rng.next() < fill) {
                life.cur[i] = 1;
                life.age[i] = 1 + ((rng.next() * 10) | 0);
            }
        }
        const stamps = 6 + ((rng.next() * 8 * S.params.life.density) | 0);
        for (let s = 0; s < stamps; s++) {
            const ox = (rng.next() * life.cols) | 0;
            const oy = (rng.next() * life.rows) | 0;
            const rot = (rng.next() * 4) | 0;
            const pick = rng.next();
            if (pick < 0.4) {
                stampLife(LIFE_GLIDER, ox, oy, rot);
            } else if (pick < 0.75) {
                stampLife(LIFE_RPENT, ox, oy, rot);
            } else {
                stampLife(LIFE_LWSS, ox, oy, rot);
            }
        }
        life.acc = 0;
    };

    const rebuildLife = (reseed) => {
        const cell = lifeCellSize();
        let cols = Math.max(24, Math.ceil(S.width / cell));
        let rows = Math.max(16, Math.ceil(S.height / cell));
        const cells = cols * rows;
        if (cells > COUNT_CAPS.life) {
            const scale = Math.sqrt(cells / COUNT_CAPS.life);
            cols = Math.max(24, Math.floor(cols / scale));
            rows = Math.max(16, Math.floor(rows / scale));
        }
        if (!reseed && life.cur && life.cols === cols && life.rows === rows) {
            return;
        }
        life.cols = cols;
        life.rows = rows;
        const n = cols * rows;
        life.cur = new Uint8Array(n);
        life.next = new Uint8Array(n);
        life.age = new Uint8Array(n);
        seedLife();
    };

    const initLife = () => {
        rebuildLife(true);
    };

    const adjustLife = () => {
        rebuildLife(false);
    };

    const stepLife = () => {
        const cols = life.cols;
        const rows = life.rows;
        const cur = life.cur;
        const next = life.next;
        const age = life.age;
        for (let y = 0; y < rows; y++) {
            const y0 = y === 0 ? rows - 1 : y - 1;
            const y2 = y === rows - 1 ? 0 : y + 1;
            const r0 = y0 * cols;
            const r1 = y * cols;
            const r2 = y2 * cols;
            for (let x = 0; x < cols; x++) {
                const x0 = x === 0 ? cols - 1 : x - 1;
                const x2 = x === cols - 1 ? 0 : x + 1;
                const neighbors =
                    cur[r0 + x0] +
                    cur[r0 + x] +
                    cur[r0 + x2] +
                    cur[r1 + x0] +
                    cur[r1 + x2] +
                    cur[r2 + x0] +
                    cur[r2 + x] +
                    cur[r2 + x2];
                const i = r1 + x;
                const alive = cur[i];
                const live = alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
                next[i] = live ? 1 : 0;
                if (live) {
                    age[i] = alive ? (age[i] < 254 ? age[i] + 1 : 254) : 1;
                } else {
                    age[i] = 0;
                }
            }
        }
        life.cur = next;
        life.next = cur;
    };

    const stampLifeAt = (px, py, rng) => {
        if (!life.cur || life.cols < 2) {
            return;
        }
        const gx = Math.round((px / Math.max(S.width, 1)) * life.cols);
        const gy = Math.round((py / Math.max(S.height, 1)) * life.rows);
        const rot = (rng.next() * 4) | 0;
        stampLife(LIFE_RPENT, gx, gy, rot);
        stampLife(LIFE_GLIDER, gx + 4, gy - 2, rot);
        const soup = 8 + ((rng.next() * 10) | 0);
        for (let i = 0; i < soup; i++) {
            lifeSet(gx + ((rng.next() * 7) | 0) - 3, gy + ((rng.next() * 7) | 0) - 3, true);
        }
        if (rng.next() < 0.45) {
            stampLife(LIFE_LWSS, gx - 6, gy + 3, (rot + 1) & 3);
        }
    };

    const tickLife = (frame, animate) => {
        if (!life.cur) {
            initLife();
        }
        if (animate) {
            life.acc += frame * Math.max(0, S.params.life.speed);
            while (life.acc >= 7.5) {
                life.acc -= 7.5;
                stepLife();
            }
        }
        const cols = life.cols;
        const rows = life.rows;
        const cur = life.cur;
        const age = life.age;
        const cw = S.width / cols;
        const ch = S.height / rows;
        const pad = Math.max(1, Math.min(cw, ch) * 0.12);
        for (let y = 0; y < rows; y++) {
            const row = y * cols;
            const y0 = (y * ch + pad) | 0;
            const y1 = ((y + 1) * ch - pad) | 0;
            const h = Math.max(1, y1 - y0);
            for (let x = 0; x < cols; x++) {
                const i = row + x;
                if (!cur[i]) {
                    continue;
                }
                const x0 = (x * cw + pad) | 0;
                const x1 = ((x + 1) * cw - pad) | 0;
                const w = Math.max(1, x1 - x0);
                const young = age[i] < 6;
                S.ctx.globalAlpha = young ? 0.72 : 0.28 + Math.min(0.34, age[i] * 0.012);
                S.ctx.fillStyle = young ? S.accentColorStr : S.particleColorStr;
                S.ctx.fillRect(x0, y0, w, h);
            }
        }
    };

    return {
        clear() {
            life.cur = null;
            life.next = null;
            life.age = null;
            life.cols = 0;
            life.rows = 0;
            life.acc = 0;
        },
        init() { initLife(); },
        adjust() { adjustLife(); },
        tick(frame, _damp, _sy, _vh, _mx, _my, _ma, animate) { tickLife(frame, animate); },
        hitTest() { return null; },
        blast(rng, _blastItem, clickX, clickY) {
            stampLifeAt(clickX, clickY - window.scrollY, rng);
            return true;
        },
    };
}
