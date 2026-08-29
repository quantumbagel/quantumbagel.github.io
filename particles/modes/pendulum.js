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
    const pendHitPts = [];
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
            const x = 40 + rng.next() * Math.max(1, S.width - 80);
            const y = 50 + rng.next() * Math.max(1, S.docHeight - 120);
            const l1 = 36 + rng.next() * 22;
            const l2 = 28 + rng.next() * 20;
            const a1 = Math.PI * (0.6 + rng.next() * 0.8);
            const a2 = Math.PI * (0.4 + rng.next() * 1.1);
            const x1 = x + Math.sin(a1) * l1;
            const y1 = y + Math.cos(a1) * l1;
            pendulums.push({
                x,
                y,
                vx: (rng.next() - 0.5) * 0.06,
                vy: (rng.next() - 0.5) * 0.06,
                l1,
                l2,
                a1,
                a2,
                w1: (rng.next() - 0.5) * 0.04,
                w2: (rng.next() - 0.5) * 0.04,
                path: [],
                accent: rng.next() < 0.5,
                dragging: false,
                grabKind: 0,
                anchorX: 0,
                anchorY: 0,
                lastA1: a1,
                lastA2: a2,
                lastGrabT: 0,
                x1,
                y1,
                x2: x1 + Math.sin(a2) * l2,
                y2: y1 + Math.cos(a2) * l2,
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
    const PEND_V_MAX = 18;
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
        p.grabKind = 0;
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

    const ikPendulum = (p, tx, ty, kind) => {
        const dx = tx - p.x;
        const dy = ty - p.y;
        if (kind === 1) {
            p.a1 = Math.atan2(dx, dy);
            return;
        }
        const l1 = p.l1;
        const l2 = p.l2;
        let dist = Math.hypot(dx, dy);
        const maxR = l1 + l2 - 0.8;
        const minR = Math.abs(l1 - l2) + 0.8;
        if (dist > maxR) {
            dist = maxR;
        } else if (dist < minR) {
            dist = minR;
        }
        const base = Math.atan2(dx, dy);
        const cosA = (l1 * l1 + dist * dist - l2 * l2) / (2 * l1 * dist);
        const delta = Math.acos(Math.max(-1, Math.min(1, cosA)));
        const a1a = wrapAngle(base - delta);
        const a1b = wrapAngle(base + delta);
        const angDist = (a, b) => {
            let d = wrapAngle(a - b);
            return d < 0 ? -d : d;
        };
        p.a1 = angDist(a1a, p.a1) <= angDist(a1b, p.a1) ? a1a : a1b;
        const x1 = p.x + Math.sin(p.a1) * l1;
        const y1 = p.y + Math.cos(p.a1) * l1;
        p.a2 = Math.atan2(tx - x1, ty - y1);
    };

    const tickPendulums = (frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        const speed = S.params.pendulum.speed;
        const speedAbs = Math.abs(speed);
        const g = 0.28 * S.params.pendulum.energy;
        const steps = Math.max(2, Math.min(8, Math.ceil(Math.max(speedAbs, 0.05) * 3)));
        const dt = (0.14 * frame * speed) / steps;
        for (let i = 0; i < pendulums.length; i++) {
            const p = pendulums[i];
            if (animate && p.dragging && p.grabKind === 0) {
                for (let s = 0; s < steps; s++) {
                    stepPendulum(p, g, dt);
                }
            }
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
            if (animate && !p.dragging && mouseActive) {
                const d2x = mouseAbsX - p.x2;
                const d2y = mouseAbsY - p.y2;
                const d2 = Math.hypot(d2x, d2y);
                if (d2 < 96 && d2 > 0.01) {
                    const f = 1 - d2 / 96;
                    const inv = 1 / d2;
                    const torque = (p.x2 - p.x) * d2y * inv - (p.y2 - p.y) * d2x * inv;
                    p.w2 += torque * f * 0.001 * frame;
                    p.w1 += torque * f * 0.00045 * frame;
                    p.vx += d2x * inv * f * f * 0.035 * frame;
                    p.vy += d2y * inv * f * f * 0.035 * frame;
                }
            }
        }
        if (animate) {
            separateBodies(pendulums, (p) => p.l1 * 0.45 + 18, frame, 0.4);
            const bobR = 9;
            const bobRSq = bobR * bobR * 4;
            for (let i = 0; i < pendulums.length; i++) {
                const a = pendulums[i];
                for (let j = i + 1; j < pendulums.length; j++) {
                    const b = pendulums[j];
                    if (a.dragging || b.dragging) {
                        continue;
                    }
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
                bounceBounds(p, Math.max(24, p.l1 * 0.4 + 16), 1, 0.18);
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
            S.ctx.globalAlpha = 0.55;
            S.ctx.fillStyle = S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(p.x, p.y - scrollY, 2.4, 0, Math.PI * 2);
            S.ctx.fill();
            S.ctx.globalAlpha = 0.85;
            S.ctx.beginPath();
            S.ctx.arc(p.x1, p.y1 - scrollY, 3.1, 0, Math.PI * 2);
            S.ctx.fill();
            S.ctx.fillStyle = p.accent || p.dragging ? S.accentColorStr : S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(p.x2, p.y2 - scrollY, p.dragging && p.grabKind === 2 ? 4.2 : 3.6, 0, Math.PI * 2);
            S.ctx.fill();
        }
    };

    return {
        clear() { pendulums.length = 0; },
        init() { initPendulums(); },
        adjust(pw, ph) { adjustPendulums(pw, ph); },
        tick(frame, _damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickPendulums(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest(absX, absY) {
            return nearestHitPoints(pendulums, absX, absY, (p) => {
                const pts = pendHitPts;
                pts.length = 0;
                pts.push(p.x, p.y, 24);
                pts.push(p.x1, p.y1, 30);
                pts.push(p.x2, p.y2, 36);
                return pts;
            }, 24);
        },
        grab(p, absX, absY) {
            const candidates = [
                [p.x, p.y, 0, 24],
                [p.x1, p.y1, 1, 30],
                [p.x2, p.y2, 2, 36],
            ];
            let best = 2;
            let bestD = 1e9;
            for (let i = 0; i < candidates.length; i++) {
                const dx = candidates[i][0] - absX;
                const dy = candidates[i][1] - absY;
                const d = dx * dx + dy * dy;
                const r = candidates[i][3];
                if (d < r * r && d < bestD) {
                    bestD = d;
                    best = candidates[i][2];
                }
            }
            p.grabKind = best;
            p.anchorX = p.x;
            p.anchorY = p.y;
            p.lastA1 = p.a1;
            p.lastA2 = p.a2;
            p.lastGrabT = performance.now();
            p.w1 = 0;
            p.w2 = 0;
            p.path.length = 0;
        },
        dragMove(p, absX, absY) {
            if (!p.grabKind) {
                return;
            }
            p.x = p.anchorX;
            p.y = p.anchorY;
            const now = performance.now();
            ikPendulum(p, absX, absY, p.grabKind);
            const dt = Math.max(0.016, (now - p.lastGrabT) / 1000);
            p.w1 = wrapAngle(p.a1 - p.lastA1) / dt * 0.14;
            p.w2 = wrapAngle(p.a2 - p.lastA2) / dt * 0.14;
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
            p.lastA1 = p.a1;
            p.lastA2 = p.a2;
            p.lastGrabT = now;
            p.x1 = p.x + Math.sin(p.a1) * p.l1;
            p.y1 = p.y + Math.cos(p.a1) * p.l1;
            p.x2 = p.x1 + Math.sin(p.a2) * p.l2;
            p.y2 = p.y1 + Math.cos(p.a2) * p.l2;
        },
        release(p, vx, vy) {
            if (p.grabKind > 0) {
                p.x = p.anchorX;
                p.y = p.anchorY;
                p.vx = 0;
                p.vy = 0;
                p.w1 += -vy * 0.08 + vx * 0.03;
                p.w2 += -vy * 0.12 + vx * 0.045;
            } else {
                p.w1 += vx * 0.05 - vy * 0.07;
                p.w2 += vx * 0.06 - vy * 0.1;
            }
            p.grabKind = 0;
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
