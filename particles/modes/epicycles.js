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
    const epicycles = [];
    const getEpicycleCount = () => H.pagesCount(12, S.params.epicycles.density, COUNT_CAPS.epicycles);

    const initEpicycles = () => {
        epicycles.length = 0;
        const rng = S.createRng();
        const n = getEpicycleCount();
        for (let i = 0; i < n; i++) {
            const armN = 4 + ((rng.next() * 3 * S.params.epicycles.arms) | 0);
            const arms = [];
            let rSum = 0;
            for (let a = 0; a < armN; a++) {
                const r = (28 - a * 5) * (0.55 + rng.next() * 0.7);
                rSum += Math.abs(r);
                arms.push({
                    r,
                    w: (0.012 + rng.next() * 0.03) * (a + 1) * (rng.next() < 0.5 ? -1 : 1),
                    p: rng.next() * Math.PI * 2,
                });
            }
            epicycles.push({
                x: 40 + rng.next() * Math.max(1, S.width - 80),
                y: 40 + rng.next() * Math.max(1, S.docHeight - 80),
                vx: (rng.next() - 0.5) * 0.08,
                vy: (rng.next() - 0.5) * 0.08,
                arms,
                path: [],
                radius: rSum,
                accent: rng.next() < 0.4,
                dragging: false,
                tipX: 0,
                tipY: 0,
            });
        }
        placeApart(epicycles, (sys) => sys.radius * 0.55 + 18, rng);
    };

    const adjustEpicycles = (pw, ph) => {
        scaleDocX(epicycles, pw);
        scaleDocY(epicycles, ph);
        const target = getEpicycleCount();
        if (epicycles.length < target) {
            initEpicycles();
        } else if (epicycles.length > target) {
            epicycles.length = target;
        }
    };

    const tickEpicycles = (frame, scrollY, viewHeight, animate) => {
        const speed = S.params.epicycles.speed;
        S.ctx.lineCap = "round";
        for (let i = 0; i < epicycles.length; i++) {
            const sys = epicycles[i];
            if (animate && !sys.dragging) {
                sys.x += sys.vx * frame;
                sys.y += sys.vy * frame;
            }
        }
        if (animate) {
            separateBodies(epicycles, (sys) => sys.radius * 0.5 + 16, frame, 0.48);
            for (let i = 0; i < epicycles.length; i++) {
                bounceBounds(epicycles[i], Math.max(16, epicycles[i].radius * 0.2));
            }
        }
        for (let i = 0; i < epicycles.length; i++) {
            const sys = epicycles[i];
            let x = sys.x;
            let y = sys.y;
            const sy0 = sys.y - scrollY;
            const offscreen = sy0 < -sys.radius - 40 || sy0 > viewHeight + sys.radius + 40;
            let px = x;
            let py = y;
            for (let a = 0; a < sys.arms.length; a++) {
                const arm = sys.arms[a];
                if (animate) {
                    arm.p += arm.w * speed * frame;
                }
                const nx = x + Math.cos(arm.p) * arm.r;
                const ny = y + Math.sin(arm.p) * arm.r;
                if (!offscreen) {
                    S.ctx.strokeStyle = S.particleColorStr;
                    S.ctx.globalAlpha = 0.12;
                    S.ctx.lineWidth = 0.7;
                    S.ctx.beginPath();
                    S.ctx.arc(x, y - scrollY, Math.abs(arm.r), 0, Math.PI * 2);
                    S.ctx.stroke();
                    S.ctx.globalAlpha = 0.22;
                    S.ctx.beginPath();
                    S.ctx.moveTo(x, y - scrollY);
                    S.ctx.lineTo(nx, ny - scrollY);
                    S.ctx.stroke();
                }
                x = nx;
                y = ny;
                px = nx;
                py = ny;
            }
            sys.tipX = px;
            sys.tipY = py;
            if (animate) {
                pushPath(sys.path, px, py, PATH_CAP);
            }
            if (offscreen) {
                continue;
            }
            drawFadePath(sys.path, sys.accent ? S.accentColorStr : S.particleColorStr, 0.55, 1.15, scrollY);
            S.ctx.globalAlpha = 0.85;
            S.ctx.fillStyle = sys.accent ? S.accentColorStr : S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(px, py - scrollY, 2.2, 0, Math.PI * 2);
            S.ctx.fill();
        }
    };

    return {
        clear() { epicycles.length = 0; },
        init() { initEpicycles(); },
        adjust(pw, ph) { adjustEpicycles(pw, ph); },
        tick(frame, _damp, scrollY, viewHeight, _mx, _my, _ma, animate) {
            tickEpicycles(frame, scrollY, viewHeight, animate);
        },
        hitTest(absX, absY) {
            return nearestHit(epicycles, absX, absY, (sys) => sys.radius * 0.7 + 22, 28);
        },
        blast(rng, blastItem) {
            for (let i = 0; i < epicycles.length; i++) {
                blastItem(epicycles[i], (sys, force) => {
                    for (let a = 0; a < sys.arms.length; a++) {
                        sys.arms[a].w += (rng.next() - 0.5) * 0.04 * force;
                    }
                });
            }
            return true;
        },
    };
}
