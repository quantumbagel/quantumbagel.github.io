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
    const nearestHitPoints = H.nearestHitPoints;
    const coastToCruise = H.coastToCruise;
    const epiHitPts = [];
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
            const evx = (rng.next() - 0.5) * 0.08;
            const evy = (rng.next() - 0.5) * 0.08;
            epicycles.push({
                x: 40 + rng.next() * Math.max(1, S.width - 80),
                y: 40 + rng.next() * Math.max(1, S.docHeight - 80),
                vx: evx,
                vy: evy,
                baseVx: evx,
                baseVy: evy,
                arms,
                path: [],
                radius: rSum,
                accent: rng.next() < 0.4,
                dragging: false,
                tipX: 0,
                tipY: 0,
                joints: [],
                highlight: 0,
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

    const tickEpicycles = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        const speed = S.params.epicycles.speed;
        S.ctx.lineCap = "round";
        for (let i = 0; i < epicycles.length; i++) {
            const sys = epicycles[i];
            if (animate && !sys.dragging) {
                coastToCruise(sys, damp, frame, 2.4);
                sys.x += sys.vx * frame;
                sys.y += sys.vy * frame;
                if (mouseActive) {
                    const dx = mouseAbsX - sys.x;
                    const dy = mouseAbsY - sys.y;
                    const reach = sys.radius * 0.9 + 48;
                    const d = Math.hypot(dx, dy);
                    if (d < reach && d > 0.01) {
                        const f = 1 - d / reach;
                        sys.highlight += (Math.min(1, f * 1.3) - sys.highlight) * 0.14;
                        sys.vx += (dx / d) * f * f * 0.05 * frame;
                        sys.vy += (dy / d) * f * f * 0.05 * frame;
                        for (let a = 0; a < sys.arms.length; a++) {
                            sys.arms[a].w += (a % 2 === 0 ? 1 : -1) * f * 0.00035 * frame;
                        }
                    } else {
                        sys.highlight *= 0.9;
                    }
                } else {
                    sys.highlight *= 0.9;
                }
            } else if (sys.dragging) {
                sys.highlight = 1;
            } else {
                sys.highlight *= 0.9;
            }
        }
        if (animate) {
            separateBodies(epicycles, (sys) => sys.radius * 0.5 + 16, frame, 0.48);
            for (let i = 0; i < epicycles.length; i++) {
                bounceBounds(epicycles[i], Math.max(18, epicycles[i].radius * 0.35), 1, 0.2);
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
            const joints = sys.joints;
            joints.length = 0;
            joints.push(x, y);
            const lit = sys.highlight > 0.35 || sys.dragging;
            for (let a = 0; a < sys.arms.length; a++) {
                const arm = sys.arms[a];
                if (animate) {
                    arm.p += arm.w * speed * frame * (sys.dragging ? 1.35 : 1);
                }
                const nx = x + Math.cos(arm.p) * arm.r;
                const ny = y + Math.sin(arm.p) * arm.r;
                if (!offscreen) {
                    S.ctx.strokeStyle = lit ? S.accentColorStr : S.particleColorStr;
                    S.ctx.globalAlpha = 0.12 + sys.highlight * 0.12;
                    S.ctx.lineWidth = 0.7;
                    S.ctx.beginPath();
                    S.ctx.arc(x, y - scrollY, Math.abs(arm.r), 0, Math.PI * 2);
                    S.ctx.stroke();
                    S.ctx.globalAlpha = 0.22 + sys.highlight * 0.2;
                    S.ctx.beginPath();
                    S.ctx.moveTo(x, y - scrollY);
                    S.ctx.lineTo(nx, ny - scrollY);
                    S.ctx.stroke();
                }
                x = nx;
                y = ny;
                px = nx;
                py = ny;
                joints.push(x, y);
            }
            sys.tipX = px;
            sys.tipY = py;
            if (animate) {
                pushPath(sys.path, px, py, PATH_CAP);
            }
            if (offscreen) {
                continue;
            }
            drawFadePath(sys.path, sys.accent || lit ? S.accentColorStr : S.particleColorStr, 0.55 + sys.highlight * 0.2, 1.15, scrollY);
            S.ctx.globalAlpha = 0.85;
            S.ctx.fillStyle = sys.accent || lit ? S.accentColorStr : S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(px, py - scrollY, 2.2, 0, Math.PI * 2);
            S.ctx.fill();
        }
    };

    return {
        clear() { epicycles.length = 0; },
        init() { initEpicycles(); },
        adjust(pw, ph) { adjustEpicycles(pw, ph); },
        tick(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickEpicycles(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest(absX, absY) {
            return nearestHitPoints(epicycles, absX, absY, (sys) => {
                const pts = epiHitPts;
                pts.length = 0;
                pts.push(sys.x, sys.y, Math.max(28, sys.radius * 0.42 + 18));
                const joints = sys.joints;
                if (joints) {
                    for (let j = 2; j < joints.length; j += 2) {
                        pts.push(joints[j], joints[j + 1], 22);
                    }
                }
                pts.push(sys.tipX, sys.tipY, 26);
                return pts;
            }, 22);
        },
        grab(sys) {
            sys.highlight = 1;
        },
        dragMove(sys, _x, _y, vx, vy) {
            sys.highlight = 1;
            for (let a = 0; a < sys.arms.length; a++) {
                sys.arms[a].w += (a % 2 === 0 ? vx : -vy) * 0.0008;
            }
        },
        release(sys, vx, vy) {
            sys.highlight = 1;
            const mag = Math.hypot(vx, vy);
            for (let a = 0; a < sys.arms.length; a++) {
                sys.arms[a].w += (a % 2 === 0 ? 1 : -1) * mag * 0.012 + vx * 0.004;
            }
            sys.path.length = 0;
        },
        blast(rng, blastItem) {
            for (let i = 0; i < epicycles.length; i++) {
                blastItem(epicycles[i], (sys, force) => {
                    sys.highlight = Math.min(1, sys.highlight + force);
                    for (let a = 0; a < sys.arms.length; a++) {
                        sys.arms[a].w += (rng.next() - 0.5) * 0.08 * force;
                    }
                });
            }
            return true;
        },
    };
}
