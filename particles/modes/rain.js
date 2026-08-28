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
    const rainCols = [];
    let rainRows = 0;
    let rainCell = 15;
    const getRainCount = () => {
        const mobile = S.width < MOBILE_BREAKPOINT ? 0.7 : 1;
        const n = (S.width / 12) * S.params.rain.density * mobile * (S.quality ? S.quality.densityMul() : 1);
        return clampCount(n, 10, COUNT_CAPS.rain);
    };

    const RAIN_GLYPHS = "0123456789ABCDEF<>/\\|=+*#$%-.:";
    const rainGlyph = (rng) => RAIN_GLYPHS.charAt(((rng ? rng.next() : Math.random()) * RAIN_GLYPHS.length) | 0);

    const rainStamp = (col, row, life) => {
        if (row < 0 || row >= col.glyphs.length) {
            return;
        }
        col.glyphs[row] = rainGlyph();
        col.life[row] = life == null ? 1 : life;
    };

    const initRain = () => {
        rainCols.length = 0;
        const rng = S.createRng();
        rainCell = 15;
        rainRows = Math.max(10, Math.ceil(S.height / rainCell) + 1);
        const n = getRainCount();
        const gap = Math.max(rainCell, S.width / Math.max(n, 1));
        for (let i = 0; i < n; i++) {
            const glyphs = new Array(rainRows);
            const life = new Float32Array(rainRows);
            for (let r = 0; r < rainRows; r++) {
                glyphs[r] = rainGlyph(rng);
                life[r] = 0;
            }
            const head = rng.next() * (rainRows + 8) - 4;
            const trail = 14 + ((rng.next() * 16) | 0);
            const headRow = Math.floor(head);
            for (let t = 0; t < trail; t++) {
                const row = headRow - t;
                if (row >= 0 && row < rainRows) {
                    glyphs[row] = rainGlyph(rng);
                    life[row] = Math.max(0.08, 1 - t / trail);
                }
            }
            rainCols.push({
                x: (i + 0.5) * gap,
                glyphs,
                life,
                head,
                speed: 0.16 + rng.next() * 0.24,
                accent: rng.next() < 0.28,
                wait: 0,
            });
        }
    };

    const adjustRain = () => {
        const rows = Math.max(10, Math.ceil(S.height / rainCell) + 1);
        if (rainCols.length !== getRainCount() || rainRows !== rows) {
            initRain();
        }
    };

    const tickRain = (frame, animate) => {
        const speedMul = S.params.rain.speed;
        const lenMul = Math.max(0.35, S.params.rain.length);
        const cell = rainCell;
        const rows = rainRows;
        const decay = Math.pow(0.9, frame / lenMul);
        S.ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        S.ctx.textAlign = "center";
        S.ctx.textBaseline = "top";
        for (let i = 0; i < rainCols.length; i++) {
            const col = rainCols[i];
            if (animate) {
                if (col.wait > 0) {
                    col.wait -= frame;
                } else {
                    const prev = col.head;
                    col.head += col.speed * speedMul * frame * 1.7;
                    const from = Math.floor(prev);
                    const to = Math.floor(col.head);
                    if (to > from) {
                        for (let r = from + 1; r <= to; r++) {
                            rainStamp(col, r, 1);
                        }
                    }
                    if (col.head >= rows) {
                        col.head = -4 - Math.random() * 12;
                        col.wait = 1.5 + Math.random() * 9;
                        col.speed = 0.16 + Math.random() * 0.24;
                    }
                }
                const flicker = 0.035 * frame;
                for (let r = 0; r < rows; r++) {
                    const a = col.life[r];
                    if (a <= 0) {
                        continue;
                    }
                    const next = a * decay;
                    col.life[r] = next < 0.03 ? 0 : next;
                    if (next > 0.08 && Math.random() < flicker) {
                        col.glyphs[r] = rainGlyph();
                    }
                }
            }
            const headRow = Math.floor(col.head);
            for (let r = 0; r < rows; r++) {
                const a = col.life[r];
                if (a <= 0) {
                    continue;
                }
                const gy = r * cell;
                if (gy > S.height + 4) {
                    continue;
                }
                const isHead = r === headRow && col.wait <= 0;
                S.ctx.globalAlpha = isHead ? Math.min(0.92, 0.55 + a * 0.4) : 0.12 + a * 0.5;
                S.ctx.fillStyle = isHead || (col.accent && a > 0.72) ? S.accentColorStr : S.particleColorStr;
                S.ctx.fillText(col.glyphs[r], col.x, gy);
            }
        }
    };

    return {
        clear() { rainCols.length = 0; },
        init() { initRain(); },
        adjust() { adjustRain(); },
        tick(frame, _damp, _sy, _vh, _mx, _my, _ma, animate) { tickRain(frame, animate); },
        hitTest() { return null; },
        blast() { return true; },
    };
}
