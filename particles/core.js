import {
    BAKED_PALETTES,
    BG_ENABLED_KEY,
    BG_MODE_KEY,
    BG_PARAMS_KEY,
    BG_RANDOM_KEY,
    COUNT_CAPS,
    DEFAULT_PARAMS,
    MOBILE_BREAKPOINT,
    MODES,
    PARAM_FIELDS,
    PATH_CAP,
    REF_VIEW_AREA,
} from "./config.js";

export function randomSeed() {
    return ((Math.random() * 4294967296) ^ Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
}

export function createRng(seed) {
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

export function rgbToString(rgb) {
    return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
}

export function lerpRgb(current, target, amount) {
    return {
        r: current.r + (target.r - current.r) * amount,
        g: current.g + (target.g - current.g) * amount,
        b: current.b + (target.b - current.b) * amount,
    };
}

export function mixRgb(a, b, t) {
    return {
        r: a.r + (b.r - a.r) * t,
        g: a.g + (b.g - a.g) * t,
        b: a.b + (b.b - a.b) * t,
    };
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function paramIsOverCap(field, value) {
    if (!field || typeof value !== "number" || !Number.isFinite(value)) {
        return false;
    }
    return value > field.max + 1e-6 || value < field.min - 1e-6;
}

export function readStoredEnabled() {
    const stored = localStorage.getItem(BG_ENABLED_KEY);
    if (stored === "off" || stored === "false") {
        return false;
    }
    return true;
}

export function readStoredMode() {
    const stored = localStorage.getItem(BG_MODE_KEY);
    if (MODES.indexOf(stored) >= 0) {
        return stored;
    }
    return "molecules";
}

export function readStoredRandom() {
    const stored = localStorage.getItem(BG_RANDOM_KEY);
    if (stored === "off" || stored === "false") {
        return false;
    }
    return true;
}

export function pickRandomMode(exclude) {
    if (MODES.length <= 1) {
        return MODES[0];
    }
    let next = MODES[(Math.random() * MODES.length) | 0];
    if (next === exclude) {
        next = MODES[(MODES.indexOf(next) + 1 + ((Math.random() * (MODES.length - 1)) | 0)) % MODES.length];
    }
    return next;
}

export function readStoredParams() {
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
        if (typeof raw.frost === "number" && Number.isFinite(raw.frost)) {
            merged.frost = raw.frost;
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
                if (typeof src[field.key] === "number" && Number.isFinite(src[field.key])) {
                    const next = src[field.key];
                    merged[key][field.key] = typeof field.floor === "number" && next < field.floor ? field.floor : next;
                }
            }
        }
    } catch (_error) {
        // Keep defaults if storage is malformed.
    }
    return merged;
}

export function copyDefaultParams() {
    const next = { frost: DEFAULT_PARAMS.frost };
    for (let i = 0; i < MODES.length; i++) {
        const key = MODES[i];
        next[key] = { ...DEFAULT_PARAMS[key] };
    }
    return next;
}

export function isDarkMode() {
    return document.documentElement.classList.contains("dark");
}

export function getVisibilityProfile() {
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
}

export function getThemeColors() {
    const palette = isDarkMode() ? BAKED_PALETTES.dark : BAKED_PALETTES.light;
    return {
        particleRgb: { ...palette.particleRgb },
        hoverAccentRgb: { ...palette.hoverAccentRgb },
        bgRgb: { ...palette.bgRgb },
        visibility: getVisibilityProfile(),
    };
}

export function qualityDensity(S) {
    return S.quality ? S.quality.densityMul() : 1;
}

export function viewAreaScale(S) {
    return ((Math.max(S.width, 1) * Math.max(S.height, 1)) / REF_VIEW_AREA) * qualityDensity(S);
}

export function clampCount(n, minN, maxN) {
    if (!Number.isFinite(n)) {
        return minN;
    }
    const v = Math.round(n);
    if (v < minN) {
        return minN;
    }
    const cap = maxN == null ? 10000 : maxN;
    return v > cap ? cap : v;
}

export function pagesCount(S, perView, densityMul, maxN) {
    const pages = Math.max(1, S.docHeight / Math.max(S.height, 1));
    const mobile = S.width < MOBILE_BREAKPOINT ? 0.65 : 1;
    const n = perView * pages * viewAreaScale(S) * (densityMul || 1) * mobile * (S.reducedMotion ? 0.5 : 1);
    const minN = Math.max(1, Math.round(perView * (S.reducedMotion ? 0.2 : 0.25)));
    return clampCount(n, minN, maxN);
}

export function bounceBounds(S, item, pad, velSign) {
    if (item.dragging || typeof item.vx !== "number" || typeof item.vy !== "number") {
        return;
    }
    const damp = 0.85;
    const sign = velSign < 0 ? -1 : 1;
    let px = pad == null ? 8 : pad;
    let py = pad == null ? 8 : pad;
    const maxPx = Math.max(8, S.width * 0.1);
    const maxPy = Math.max(8, Math.min(S.height, S.docHeight) * 0.1);
    if (px > maxPx) {
        px = maxPx;
    }
    if (py > maxPy) {
        py = maxPy;
    }
    if (px * 2 > S.width - 8) {
        px = Math.max(4, S.width * 0.15);
    }
    if (py * 2 > S.docHeight - 8) {
        py = Math.max(4, S.docHeight * 0.15);
    }
    if (item.x < px) {
        item.x = px;
        if (item.vx * sign < 0) {
            item.vx = -item.vx * damp;
        }
        if (typeof item.baseVx === "number" && item.baseVx * sign < 0) {
            item.baseVx = -item.baseVx;
        }
    } else if (item.x > S.width - px) {
        item.x = S.width - px;
        if (item.vx * sign > 0) {
            item.vx = -item.vx * damp;
        }
        if (typeof item.baseVx === "number" && item.baseVx * sign > 0) {
            item.baseVx = -item.baseVx;
        }
    }
    if (item.y < py) {
        item.y = py;
        if (item.vy * sign < 0) {
            item.vy = -item.vy * damp;
        }
        if (typeof item.baseVy === "number" && item.baseVy * sign < 0) {
            item.baseVy = -item.baseVy;
        }
    } else if (item.y > S.docHeight - py) {
        item.y = S.docHeight - py;
        if (item.vy * sign > 0) {
            item.vy = -item.vy * damp;
        }
        if (typeof item.baseVy === "number" && item.baseVy * sign > 0) {
            item.baseVy = -item.baseVy;
        }
    }
}

export function separateBodies(items, radiusOf, frame, strength) {
    const n = items.length;
    if (n < 2) {
        return;
    }
    const force = strength == null ? 0.42 : strength;
    for (let i = 0; i < n; i++) {
        const a = items[i];
        if (a.dragging) {
            continue;
        }
        const ra = radiusOf(a);
        for (let j = i + 1; j < n; j++) {
            const b = items[j];
            if (b.dragging) {
                continue;
            }
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const min = ra + radiusOf(b);
            const distSq = dx * dx + dy * dy;
            if (distSq >= min * min) {
                continue;
            }
            let dist = Math.sqrt(distSq);
            let nx;
            let ny;
            if (distSq < 0.0001) {
                const ang = (i + 1) * 2.399963 + j;
                nx = Math.cos(ang);
                ny = Math.sin(ang);
                dist = 0.01;
            } else {
                nx = dx / dist;
                ny = dy / dist;
            }
            const overlap = (min - dist) / min;
            const push = overlap * overlap * force * frame;
            const px = nx * push;
            const py = ny * push;
            a.x += px;
            a.y += py;
            b.x -= px;
            b.y -= py;
            if (typeof a.vx === "number" && typeof b.vx === "number") {
                a.vx += px * 0.22;
                a.vy += py * 0.22;
                b.vx -= px * 0.22;
                b.vy -= py * 0.22;
            }
        }
    }
}

export function placeApart(S, items, radiusOf, rng) {
    for (let i = 0; i < items.length; i++) {
        const a = items[i];
        const ra = radiusOf(a);
        const pad = Math.max(18, Math.min(ra, 56));
        for (let attempt = 0; attempt < 16; attempt++) {
            let ok = true;
            for (let j = 0; j < i; j++) {
                const b = items[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const need = ra + radiusOf(b);
                if (dx * dx + dy * dy < need * need) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                break;
            }
            a.x = pad + rng.next() * Math.max(1, S.width - pad * 2);
            a.y = pad + rng.next() * Math.max(1, S.docHeight - pad * 2);
        }
    }
}

export function nearestHit(items, absX, absY, radiusOf, minR) {
    let best = null;
    let bestD = 1e9;
    const floorR = minR == null ? 18 : minR;
    for (let i = 0; i < items.length; i++) {
        const it = items[i];
        const dx = it.x - absX;
        const dy = it.y - absY;
        const r = Math.max(floorR, radiusOf ? radiusOf(it) : floorR);
        const d = dx * dx + dy * dy;
        if (d < r * r && d < bestD) {
            bestD = d;
            best = it;
        }
    }
    return best;
}

export function createHashGrid(cellSize) {
    return {
        cellSize: cellSize || 88,
        cols: 1,
        rows: 1,
        cells: [[]],
        occupied: [],
    };
}

export function rebuildHashGrid(S, grid, items, cellSize, getXY) {
    const cell = cellSize || grid.cellSize;
    grid.cellSize = cell;
    grid.cols = Math.max(1, Math.ceil(S.width / cell));
    grid.rows = Math.max(1, Math.ceil(S.docHeight / cell));
    const count = grid.cols * grid.rows;
    if (grid.cells.length !== count) {
        grid.cells = new Array(count);
        for (let i = 0; i < count; i++) {
            grid.cells[i] = [];
        }
    } else {
        for (let i = 0; i < grid.occupied.length; i++) {
            grid.cells[grid.occupied[i]].length = 0;
        }
    }
    grid.occupied.length = 0;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const pos = getXY ? getXY(item) : item;
        let cx = (pos.x / cell) | 0;
        let cy = (pos.y / cell) | 0;
        if (cx < 0) cx = 0;
        else if (cx >= grid.cols) cx = grid.cols - 1;
        if (cy < 0) cy = 0;
        else if (cy >= grid.rows) cy = grid.rows - 1;
        const index = cy * grid.cols + cx;
        if (grid.cells[index].length === 0) {
            grid.occupied.push(index);
        }
        grid.cells[index].push(item);
    }
}

export function scaleDocY(S, items, previousDocHeight) {
    if (previousDocHeight > 0 && Math.abs(S.docHeight - previousDocHeight) > 30) {
        const ratio = S.docHeight / previousDocHeight;
        for (let i = 0; i < items.length; i++) {
            if (typeof items[i].y === "number") {
                items[i].y *= ratio;
            }
        }
    }
}

export function scaleDocX(S, items, previousWidth) {
    if (previousWidth > 0 && S.width !== previousWidth) {
        const ratio = S.width / previousWidth;
        for (let i = 0; i < items.length; i++) {
            if (typeof items[i].x === "number") {
                items[i].x *= ratio;
            }
        }
    }
}

export function pushPath(path, x, y, maxPts) {
    if (path.length >= 2) {
        const dx = x - path[path.length - 2];
        const dy = y - path[path.length - 1];
        if (dx * dx + dy * dy > 90 * 90) {
            path.length = 0;
        }
    }
    path.push(x, y);
    const cap = (maxPts || PATH_CAP) * 2;
    if (path.length > cap) {
        const extra = path.length - cap;
        path.copyWithin(0, extra);
        path.length = cap;
    }
}

export function drawFadePath(S, path, color, alpha, lineW, scrollY) {
    if (path.length < 4) {
        return;
    }
    S.ctx.strokeStyle = color;
    S.ctx.lineCap = "round";
    S.ctx.lineJoin = "round";
    S.ctx.lineWidth = lineW;
    S.ctx.globalAlpha = alpha;
    S.ctx.beginPath();
    S.ctx.moveTo(path[0], path[1] - scrollY);
    for (let i = 2; i < path.length; i += 2) {
        S.ctx.lineTo(path[i], path[i + 1] - scrollY);
    }
    S.ctx.stroke();
}

export function createQuality() {
    let emaMs = 16.7;
    let stress = 0;
    let lastAdjust = 0;
    let lastDprCap = 2;
    let lastKey = "2:1.00";
    return {
        sample(dt) {
            const ms = Math.max(0, dt * 1000);
            emaMs = emaMs * 0.9 + ms * 0.1;
            if (emaMs > 28) {
                stress = Math.min(1, stress + 0.05);
            } else if (emaMs > 21) {
                stress = Math.min(1, stress + 0.018);
            } else if (emaMs < 15.5) {
                stress = Math.max(0, stress - 0.022);
            }
        },
        densityMul() {
            return 1 - stress * 0.48;
        },
        dprCap() {
            const next = stress > 0.68 ? 1 : stress > 0.38 ? 1.25 : 2;
            lastDprCap = next;
            return next;
        },
        orbitSamples() {
            return stress > 0.55 ? 28 : stress > 0.3 ? 40 : 56;
        },
        auroraStep() {
            return stress > 0.5 ? 9 : 5;
        },
        frostMul() {
            return 1 - stress * 0.5;
        },
        shouldRebuild(now) {
            const key = `${stress > 0.68 ? 1 : stress > 0.38 ? 1.25 : 2}:${(1 - stress * 0.48).toFixed(2)}`;
            if (key === lastKey) {
                return false;
            }
            if (now - lastAdjust < 900) {
                return false;
            }
            lastKey = key;
            lastAdjust = now;
            return true;
        },
        get stress() {
            return stress;
        },
        get emaMs() {
            return emaMs;
        },
        get lastDprCap() {
            return lastDprCap;
        },
    };
}

export function bindWorldHelpers(S) {
    return {
        bounceBounds: (item, pad, velSign) => bounceBounds(S, item, pad, velSign),
        placeApart: (items, radiusOf, rng) => placeApart(S, items, radiusOf, rng),
        rebuildHashGrid: (grid, items, cellSize, getXY) => rebuildHashGrid(S, grid, items, cellSize, getXY),
        scaleDocX: (items, previousWidth) => scaleDocX(S, items, previousWidth),
        scaleDocY: (items, previousDocHeight) => scaleDocY(S, items, previousDocHeight),
        drawFadePath: (path, color, alpha, lineW, scrollY) => drawFadePath(S, path, color, alpha, lineW, scrollY),
        viewAreaScale: () => viewAreaScale(S),
        pagesCount: (perView, densityMul, maxN) => pagesCount(S, perView, densityMul, maxN),
        clampCount,
        separateBodies,
        nearestHit,
        pushPath,
        createHashGrid,
        COUNT_CAPS,
        PATH_CAP,
        REF_VIEW_AREA,
        MOBILE_BREAKPOINT,
    };
}
