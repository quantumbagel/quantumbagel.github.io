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
    const pendulums = [];
    const getPendulumCount = () => H.pagesCount(12, S.params.pendulum.density, COUNT_CAPS.pendulum);

    const initPendulums = () => {
        pendulums.length = 0;
        const rng = S.createRng();
        const n = getPendulumCount();
        for (let i = 0; i < n; i++) {
            pendulums.push({
                x: 40 + rng.next() * Math.max(1, S.width - 80),
                y: 50 + rng.next() * Math.max(1, S.docHeight - 120),
                vx: (rng.next() - 0.5) * 0.06,
                vy: (rng.next() - 0.5) * 0.06,
                l1: 36 + rng.next() * 22,
                l2: 28 + rng.next() * 20,
                a1: Math.PI * (0.6 + rng.next() * 0.8),
                a2: Math.PI * (0.4 + rng.next() * 1.1),
                w1: (rng.next() - 0.5) * 0.04,
                w2: (rng.next() - 0.5) * 0.04,
                path: [],
                accent: rng.next() < 0.5,
                dragging: false,
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 0,
            });
        }
        placeApart(pendulums, (p) => p.l1 + p.l2 + 10, rng);
    };

    const adjustPendulums = (pw, ph) => {
        scaleDocX(pendulums, pw);
        scaleDocY(pendulums, ph);
        const target = getPendulumCount();
        if (pendulums.length < target) {
            initPendulums();
        } else if (pendulums.length > target) {
            pendulums.length = target;
        }
    };

    const PEND_W_MAX = 8;
    const PEND_V_MAX = 3.5;
    const PEND_AW_MAX = 40;

    const wrapAngle = (a) => {
        const tau = Math.PI * 2;
        a = a % tau;
        if (a > Math.PI) {
            a -= tau;
        } else if (a < -Math.PI) {
            a += tau;
        }
        return a;
    };

    const revivePendulum = (p) => {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
            p.x = 40 + Math.random() * Math.max(1, S.width - 80);
            p.y = 50 + Math.random() * Math.max(1, S.docHeight - 120);
        }
        p.vx = 0;
        p.vy = 0;
        p.w1 = (Math.random() - 0.5) * 0.08;
        p.w2 = (Math.random() - 0.5) * 0.08;
        p.a1 = Math.PI * (0.6 + Math.random() * 0.8);
        p.a2 = Math.PI * (0.4 + Math.random() * 1.1);
        p.path.length = 0;
    };

    const stepPendulum = (p, g, dt) => {
        const a1 = p.a1;
        const a2 = p.a2;
        const w1 = p.w1;
        const w2 = p.w2;
        const l1 = p.l1;
        const l2 = p.l2;
        const den = Math.max(1.05, 2 - Math.cos(2 * (a1 - a2)));
        let aw1 = (-g * (2 * Math.sin(a1) - Math.sin(a1 - 2 * a2)) - 2 * Math.sin(a1 - a2) * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(a1 - a2))) / (l1 * den);
        let aw2 = (2 * Math.sin(a1 - a2) * (w1 * w1 * l1 + g * Math.cos(a1) + w2 * w2 * l2 * Math.cos(a1 - a2))) / (l2 * den);
        if (!Number.isFinite(aw1)) {
            aw1 = 0;
        } else if (aw1 > PEND_AW_MAX) {
            aw1 = PEND_AW_MAX;
        } else if (aw1 < -PEND_AW_MAX) {
            aw1 = -PEND_AW_MAX;
        }
        if (!Number.isFinite(aw2)) {
            aw2 = 0;
        } else if (aw2 > PEND_AW_MAX) {
            aw2 = PEND_AW_MAX;
        } else if (aw2 < -PEND_AW_MAX) {
            aw2 = -PEND_AW_MAX;
        }
        p.w1 = (p.w1 + aw1 * dt) * 0.9992;
        p.w2 = (p.w2 + aw2 * dt) * 0.9992;
        if (p.w1 > PEND_W_MAX) {
            p.w1 = PEND_W_MAX;
        } else if (p.w1 < -PEND_W_MAX) {
            p.w1 = -PEND_W_MAX;
        }
        if (p.w2 > PEND_W_MAX) {
            p.w2 = PEND_W_MAX;
        } else if (p.w2 < -PEND_W_MAX) {
            p.w2 = -PEND_W_MAX;
        }
        p.a1 = wrapAngle(p.a1 + p.w1 * dt);
        p.a2 = wrapAngle(p.a2 + p.w2 * dt);
    };

    const tickPendulums = (frame, scrollY, viewHeight, animate) => {
        const speed = S.params.pendulum.speed;
        const speedAbs = Math.abs(speed);
        const g = 0.28 * S.params.pendulum.energy;
        const steps = Math.max(2, Math.min(8, Math.ceil(Math.max(speedAbs, 0.05) * 3)));
        const dt = (0.14 * frame * speed) / steps;
        for (let i = 0; i < pendulums.length; i++) {
            const p = pendulums[i];
            if (animate && !p.dragging) {
                p.vx *= 0.995;
                p.vy *= 0.995;
                if (p.vx > PEND_V_MAX) {
                    p.vx = PEND_V_MAX;
                } else if (p.vx < -PEND_V_MAX) {
                    p.vx = -PEND_V_MAX;
                }
                if (p.vy > PEND_V_MAX) {
                    p.vy = PEND_V_MAX;
                } else if (p.vy < -PEND_V_MAX) {
                    p.vy = -PEND_V_MAX;
                }
                p.x += p.vx * frame;
                p.y += p.vy * frame;
                for (let s = 0; s < steps; s++) {
                    stepPendulum(p, g, dt);
                }
                if (
                    !Number.isFinite(p.x) ||
                    !Number.isFinite(p.y) ||
                    !Number.isFinite(p.a1) ||
                    !Number.isFinite(p.a2) ||
                    !Number.isFinite(p.w1) ||
                    !Number.isFinite(p.w2)
                ) {
                    revivePendulum(p);
                }
            }
            p.x1 = p.x + Math.sin(p.a1) * p.l1;
            p.y1 = p.y + Math.cos(p.a1) * p.l1;
            p.x2 = p.x1 + Math.sin(p.a2) * p.l2;
            p.y2 = p.y1 + Math.cos(p.a2) * p.l2;
        }
        if (animate) {
            separateBodies(pendulums, (p) => p.l1 * 0.45 + 18, frame, 0.4);
            const bobR = 9;
            const bobRSq = bobR * bobR * 4;
            for (let i = 0; i < pendulums.length; i++) {
                const a = pendulums[i];
                for (let j = i + 1; j < pendulums.length; j++) {
                    const b = pendulums[j];
                    const pairs = [
                        [a.x1, a.y1, b.x1, b.y1, 1, 1],
                        [a.x1, a.y1, b.x2, b.y2, 1, 2],
                        [a.x2, a.y2, b.x1, b.y1, 2, 1],
                        [a.x2, a.y2, b.x2, b.y2, 2, 2],
                    ];
                    for (let k = 0; k < pairs.length; k++) {
                        const dx = pairs[k][0] - pairs[k][2];
                        const dy = pairs[k][1] - pairs[k][3];
                        const distSq = dx * dx + dy * dy;
                        if (!Number.isFinite(distSq) || distSq >= bobRSq || distSq < 0.01) {
                            continue;
                        }
                        const dist = Math.sqrt(distSq);
                        const overlap = (bobR * 2 - dist) / (bobR * 2);
                        const inv = 1 / dist;
                        const nx = dx * inv;
                        const ny = dy * inv;
                        const torqueA = (pairs[k][0] - a.x) * ny - (pairs[k][1] - a.y) * nx;
                        const torqueB = (pairs[k][2] - b.x) * ny - (pairs[k][3] - b.y) * nx;
                        if (pairs[k][4] === 1) {
                            a.w1 += torqueA * overlap * 0.012;
                        } else {
                            a.w2 += torqueA * overlap * 0.016;
                        }
                        if (pairs[k][5] === 1) {
                            b.w1 -= torqueB * overlap * 0.012;
                        } else {
                            b.w2 -= torqueB * overlap * 0.016;
                        }
                        a.vx += nx * overlap * 0.2;
                        a.vy += ny * overlap * 0.2;
                        b.vx -= nx * overlap * 0.2;
                        b.vy -= ny * overlap * 0.2;
                    }
                }
            }
            for (let i = 0; i < pendulums.length; i++) {
                const p = pendulums[i];
                if (p.w1 > PEND_W_MAX) {
                    p.w1 = PEND_W_MAX;
                } else if (p.w1 < -PEND_W_MAX) {
                    p.w1 = -PEND_W_MAX;
                }
                if (p.w2 > PEND_W_MAX) {
                    p.w2 = PEND_W_MAX;
                } else if (p.w2 < -PEND_W_MAX) {
                    p.w2 = -PEND_W_MAX;
                }
                bounceBounds(p, 32);
                if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.a1) || !Number.isFinite(p.a2)) {
                    revivePendulum(p);
                }
                p.x1 = p.x + Math.sin(p.a1) * p.l1;
                p.y1 = p.y + Math.cos(p.a1) * p.l1;
                p.x2 = p.x1 + Math.sin(p.a2) * p.l2;
                p.y2 = p.y1 + Math.cos(p.a2) * p.l2;
            }
        }
        for (let i = 0; i < pendulums.length; i++) {
            const p = pendulums[i];
            if (!Number.isFinite(p.x) || !Number.isFinite(p.x2) || !Number.isFinite(p.y2)) {
                continue;
            }
            if (animate) {
                pushPath(p.path, p.x2, p.y2, PATH_CAP);
            }
            const vis = p.y - scrollY;
            const pad = p.l1 + p.l2 + 24;
            if (vis < -pad || vis > viewHeight + pad) {
                continue;
            }
            drawFadePath(p.path, p.accent ? S.accentColorStr : S.particleColorStr, 0.42, 1, scrollY);
            S.ctx.strokeStyle = S.particleColorStr;
            S.ctx.globalAlpha = 0.35;
            S.ctx.lineWidth = 1;
            S.ctx.beginPath();
            S.ctx.moveTo(p.x, p.y - scrollY);
            S.ctx.lineTo(p.x1, p.y1 - scrollY);
            S.ctx.lineTo(p.x2, p.y2 - scrollY);
            S.ctx.stroke();
            S.ctx.globalAlpha = 0.8;
            S.ctx.fillStyle = S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(p.x1, p.y1 - scrollY, 2.1, 0, Math.PI * 2);
            S.ctx.fill();
            S.ctx.fillStyle = p.accent ? S.accentColorStr : S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(p.x2, p.y2 - scrollY, 2.6, 0, Math.PI * 2);
            S.ctx.fill();
        }
    };

    return {
        clear() { pendulums.length = 0; },
        init() { initPendulums(); },
        adjust(pw, ph) { adjustPendulums(pw, ph); },
        tick(frame, _damp, scrollY, viewHeight, _mx, _my, _ma, animate) {
            tickPendulums(frame, scrollY, viewHeight, animate);
        },
        hitTest(absX, absY) {
            return nearestHit(pendulums, absX, absY, () => 26, 26);
        },
        blast(rng, blastItem, clickX, clickY) {
            for (let i = 0; i < pendulums.length; i++) {
                const p = pendulums[i];
                const pts = [p.x, p.y, p.x1, p.y1, p.x2, p.y2];
                let bestD = 1e9;
                let bx = p.x;
                let by = p.y;
                for (let k = 0; k < pts.length; k += 2) {
                    if (typeof pts[k] !== "number") continue;
                    const dx = pts[k] - clickX;
                    const dy = pts[k + 1] - clickY;
                    const d = dx * dx + dy * dy;
                    if (d < bestD) {
                        bestD = d;
                        bx = pts[k];
                        by = pts[k + 1];
                    }
                }
                const proxy = { x: bx, y: by, vx: p.vx, vy: p.vy };
                blastItem(proxy, (_item, force) => {
                    p.vx = proxy.vx;
                    p.vy = proxy.vy;
                    p.w1 += (rng.next() - 0.5) * force * 0.22;
                    p.w2 += (rng.next() - 0.5) * force * 0.28;
                });
            }
            return true;
        },
    };
}
