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
    const boids = [];
    const flockGrid = createHashGrid(92);
    const getFlockCount = () => H.pagesCount(100, S.params.flock.density, COUNT_CAPS.flock);

    const initFlock = () => {
        boids.length = 0;
        const rng = S.createRng();
        const n = getFlockCount();
        for (let i = 0; i < n; i++) {
            const ang = rng.next() * Math.PI * 2;
            boids.push({
                x: rng.next() * S.width,
                y: rng.next() * S.docHeight,
                vx: Math.cos(ang) * 1.2,
                vy: Math.sin(ang) * 1.2,
                dragging: false,
            });
        }
    };

    const adjustFlock = (pw, ph) => {
        scaleDocX(boids, pw);
        scaleDocY(boids, ph);
        const target = getFlockCount();
        if (boids.length < target) {
            const rng = S.createRng();
            while (boids.length < target) {
                const ang = rng.next() * Math.PI * 2;
                boids.push({
                    x: rng.next() * S.width,
                    y: rng.next() * S.docHeight,
                    vx: Math.cos(ang),
                    vy: Math.sin(ang),
                    dragging: false,
                });
            }
        } else if (boids.length > target) {
            boids.length = target;
        }
    };

    const tickFlock = (frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        const speed = S.params.flock.speed;
        const coh = S.params.flock.cohesion;
        const visPad = 40;
        if (animate) {
            rebuildHashGrid(flockGrid, boids, 92);
            const cell = flockGrid.cellSize;
            for (let i = 0; i < boids.length; i++) {
                const b = boids[i];
                if (b.dragging) {
                    continue;
                }
                let ax = 0;
                let ay = 0;
                let cx = 0;
                let cy = 0;
                let sx = 0;
                let sy = 0;
                let n = 0;
                let bx = (b.x / cell) | 0;
                let by = (b.y / cell) | 0;
                if (bx < 0) bx = 0;
                else if (bx >= flockGrid.cols) bx = flockGrid.cols - 1;
                if (by < 0) by = 0;
                else if (by >= flockGrid.rows) by = flockGrid.rows - 1;
                const xMin = bx > 0 ? bx - 1 : 0;
                const xMax = bx + 1 < flockGrid.cols ? bx + 1 : flockGrid.cols - 1;
                const yMin = by > 0 ? by - 1 : 0;
                const yMax = by + 1 < flockGrid.rows ? by + 1 : flockGrid.rows - 1;
                for (let ny = yMin; ny <= yMax; ny++) {
                    for (let nx = xMin; nx <= xMax; nx++) {
                        const bucket = flockGrid.cells[ny * flockGrid.cols + nx];
                        for (let c = 0; c < bucket.length; c++) {
                            const o = bucket[c];
                            if (o === b) {
                                continue;
                            }
                            const dx = o.x - b.x;
                            const dy = o.y - b.y;
                            const dSq = dx * dx + dy * dy;
                            if (dSq > 90 * 90 || dSq < 0.01) {
                                continue;
                            }
                            const d = Math.sqrt(dSq);
                            n += 1;
                            ax += o.vx;
                            ay += o.vy;
                            cx += o.x;
                            cy += o.y;
                            if (d < 26) {
                                const push = (26 - d) / 26;
                                sx -= (dx / d) * (0.7 + push * 1.8);
                                sy -= (dy / d) * (0.7 + push * 1.8);
                            }
                        }
                    }
                }
                if (n > 0) {
                    ax = ax / n - b.vx;
                    ay = ay / n - b.vy;
                    cx = cx / n - b.x;
                    cy = cy / n - b.y;
                    b.vx += ax * 0.04 * coh + cx * 0.003 * coh + sx * 0.16;
                    b.vy += ay * 0.04 * coh + cy * 0.003 * coh + sy * 0.16;
                }
                if (mouseActive) {
                    const dx = mouseAbsX - b.x;
                    const dy = mouseAbsY - b.y;
                    const dSq = dx * dx + dy * dy;
                    if (dSq < 140 * 140 && dSq > 16) {
                        b.vx += dx * 0.0004 * frame;
                        b.vy += dy * 0.0004 * frame;
                    }
                }
                const mag = Math.hypot(b.vx, b.vy) || 1;
                const maxS = 1.8 * speed;
                if (mag > maxS) {
                    b.vx = (b.vx / mag) * maxS;
                    b.vy = (b.vy / mag) * maxS;
                }
                b.x += b.vx * frame * speed;
                b.y += b.vy * frame * speed;
                bounceBounds(b, 8);
            }
        }
        S.ctx.lineCap = "round";
        for (let i = 0; i < boids.length; i++) {
            const b = boids[i];
            const sy = b.y - scrollY;
            if (sy < -visPad || sy > viewHeight + visPad) {
                continue;
            }
            const ang = Math.atan2(b.vy, b.vx);
            S.ctx.globalAlpha = 0.55;
            S.ctx.strokeStyle = S.particleColorStr;
            S.ctx.fillStyle = S.particleColorStr;
            S.ctx.lineWidth = 1;
            S.ctx.beginPath();
            S.ctx.moveTo(b.x + Math.cos(ang) * 5.5, sy + Math.sin(ang) * 5.5);
            S.ctx.lineTo(b.x + Math.cos(ang + 2.5) * 4, sy + Math.sin(ang + 2.5) * 4);
            S.ctx.lineTo(b.x + Math.cos(ang - 2.5) * 4, sy + Math.sin(ang - 2.5) * 4);
            S.ctx.closePath();
            S.ctx.fill();
        }
    };

    return {
        clear() { boids.length = 0; },
        init() { initFlock(); },
        adjust(pw, ph) { adjustFlock(pw, ph); },
        tick(frame, _damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickFlock(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest(absX, absY) {
            return nearestHit(boids, absX, absY, () => 26, 26);
        },
        blast(_rng, blastItem) {
            for (let i = 0; i < boids.length; i++) blastItem(boids[i]);
            return true;
        },
    };
}
