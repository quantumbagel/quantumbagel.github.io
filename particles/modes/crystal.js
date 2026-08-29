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
    const coastToCruise = H.coastToCruise;
    const rebuildHashGrid = H.rebuildHashGrid;
    const scaleDocX = H.scaleDocX;
    const scaleDocY = H.scaleDocY;
    const pushPath = H.pushPath;
    const drawFadePath = H.drawFadePath;
    let quietSpawn = false;
    const crystals = [];
    const getCrystalCount = () => H.pagesCount(12, S.params.crystal.density, COUNT_CAPS.crystal);
    const projBuf = [];

    const initCrystals = () => {
        crystals.length = 0;
        const rng = S.createRng();
        const n = getCrystalCount();
        for (let i = 0; i < n; i++) {
            const dim = rng.next() < 0.45 ? 3 : 2;
            const pts = [];
            const step = 18;
            if (dim === 3) {
                for (let x = -1; x <= 1; x++) {
                    for (let y = -1; y <= 1; y++) {
                        for (let z = -1; z <= 1; z++) {
                            pts.push(x * step, y * step, z * step);
                        }
                    }
                }
            } else {
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
                for (let p = 0; p < raw.length; p++) {
                    pts.push(raw[p][0] * 11, raw[p][1] * 11, raw[p][2] * 11);
                }
            }
            const cvx = (rng.next() - 0.5) * 0.09;
            const cvy = (rng.next() - 0.5) * 0.09;
            crystals.push({
                x: 40 + rng.next() * Math.max(1, S.width - 80),
                y: 40 + rng.next() * Math.max(1, S.docHeight - 80),
                vx: cvx,
                vy: cvy,
                baseVx: cvx,
                baseVy: cvy,
                rotX: rng.next() * Math.PI,
                rotY: rng.next() * Math.PI,
                rotZ: rng.next() * Math.PI,
                rotVx: (rng.next() - 0.5) * 0.01,
                rotVy: (rng.next() - 0.5) * 0.014,
                rotVz: (rng.next() - 0.5) * 0.008,
                pts,
                diamond: dim !== 3,
                scale: 0.7 + rng.next() * 0.5,
                dragging: false,
                highlight: 0,
            });
        }
        placeApart(crystals, (c) => 34 * c.scale * S.params.crystal.size + 10, rng);
    };

    const adjustCrystals = (pw, ph) => {
        scaleDocX(crystals, pw);
        scaleDocY(crystals, ph);
        const target = getCrystalCount();
        if (crystals.length < target) {
            initCrystals();
        } else if (crystals.length > target) {
            crystals.length = target;
        }
    };

    const crystalRadius = (c) => 36 * c.scale * S.params.crystal.size + 14;

    const tickCrystals = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        const speed = S.params.crystal.speed;
        const size = S.params.crystal.size;
        const zLimit = (S.FOCAL + S.DEPTH_OFFSET) * 0.55;
        S.ctx.lineCap = "round";
        for (let i = 0; i < crystals.length; i++) {
            const c = crystals[i];
            if (animate && !c.dragging) {
                coastToCruise(c, damp, frame, 2.6);
                c.rotX += c.rotVx * speed * frame;
                c.rotY += c.rotVy * speed * frame;
                c.rotZ += c.rotVz * speed * frame;
                c.x += c.vx * frame;
                c.y += c.vy * frame;
                if (mouseActive) {
                    const dx = mouseAbsX - c.x;
                    const dy = mouseAbsY - c.y;
                    const d = Math.hypot(dx, dy);
                    const reach = 150 + crystalRadius(c);
                    if (d < reach && d > 0.01) {
                        const f = 1 - d / reach;
                        c.highlight += (Math.min(1, f * 1.35) - c.highlight) * 0.16;
                        c.rotVy += dx * 0.00004 * f * frame;
                        c.rotVx -= dy * 0.00003 * f * frame;
                        c.vx += (dx / d) * f * f * 0.045 * frame;
                        c.vy += (dy / d) * f * f * 0.045 * frame;
                    } else {
                        c.highlight *= 0.92;
                    }
                } else {
                    c.highlight *= 0.92;
                }
            } else if (c.dragging) {
                c.highlight = 1;
                if (animate) {
                    c.rotY += 0.028 * speed * frame;
                    c.rotX += c.rotVx * speed * frame;
                    c.rotZ += c.rotVz * speed * frame;
                }
            }
        }
        if (animate) {
            separateBodies(crystals, (c) => crystalRadius(c) * 0.82, frame, 0.5);
            for (let i = 0; i < crystals.length; i++) {
                bounceBounds(crystals[i], Math.max(20, crystalRadius(crystals[i]) * 0.45), 1, 0.18);
            }
        }
        for (let i = 0; i < crystals.length; i++) {
            const c = crystals[i];
            const sy = c.y - scrollY;
            if (sy < -90 || sy > viewHeight + 90) {
                continue;
            }
            const cosX = Math.cos(c.rotX);
            const sinX = Math.sin(c.rotX);
            const cosY = Math.cos(c.rotY);
            const sinY = Math.sin(c.rotY);
            const cosZ = Math.cos(c.rotZ);
            const sinZ = Math.sin(c.rotZ);
            const pts = c.pts;
            const proj = projBuf;
            proj.length = 0;
            for (let p = 0; p < pts.length; p += 3) {
                let x = pts[p] * c.scale * size;
                let y = pts[p + 1] * c.scale * size;
                let z = pts[p + 2] * c.scale * size;
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
                if (z1 < -zLimit) {
                    z1 = -zLimit;
                } else if (z1 > zLimit) {
                    z1 = zLimit;
                }
                const persp = S.FOCAL / Math.max(48, S.FOCAL + S.DEPTH_OFFSET + z1);
                proj.push(c.x + x1 * persp, sy + y1 * persp, z1);
            }
            S.ctx.strokeStyle = c.highlight > 0.35 ? S.accentColorStr : S.particleColorStr;
            S.ctx.lineWidth = 0.7;
            const bond = 18 * c.scale * size * 1.25;
            const bondSq = bond * bond;
            for (let a = 0; a < proj.length; a += 3) {
                for (let b = a + 3; b < proj.length; b += 3) {
                    const dx = proj[a] - proj[b];
                    const dy = proj[a + 1] - proj[b + 1];
                    const dz = proj[a + 2] - proj[b + 2];
                    const d = dx * dx + dy * dy + dz * dz;
                    if (d < bondSq && d > 1) {
                        S.ctx.globalAlpha = 0.16 + c.highlight * 0.25;
                        S.ctx.beginPath();
                        S.ctx.moveTo(proj[a], proj[a + 1]);
                        S.ctx.lineTo(proj[b], proj[b + 1]);
                        S.ctx.stroke();
                    }
                }
            }
            for (let a = 0; a < proj.length; a += 3) {
                const depth = Math.max(0.4, 1 - (proj[a + 2] + 30) / 120);
                S.ctx.globalAlpha = 0.35 + depth * 0.45 + c.highlight * 0.15;
                S.ctx.fillStyle = c.highlight > 0.5 ? S.accentColorStr : S.particleColorStr;
                S.ctx.beginPath();
                S.ctx.arc(proj[a], proj[a + 1], 1.5 * depth, 0, Math.PI * 2);
                S.ctx.fill();
            }
        }
    };

    return {
        clear() { crystals.length = 0; },
        init() { initCrystals(); },
        adjust(pw, ph) { adjustCrystals(pw, ph); },
        tick(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickCrystals(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest(absX, absY) {
            return nearestHit(crystals, absX, absY, (c) => crystalRadius(c) + 18, 34);
        },
        grab(c) {
            c.highlight = 1;
        },
        dragMove(c, _x, _y, vx, vy) {
            c.rotVy += vx * 0.016;
            c.rotVx -= vy * 0.012;
            c.rotVz += vx * 0.005;
            c.highlight = 1;
        },
        release(c, vx, vy) {
            c.rotVy += vx * 0.055;
            c.rotVx -= vy * 0.04;
            c.rotVz += (vx - vy) * 0.02;
            c.highlight = 1;
        },
        blast(rng, blastItem) {
            for (let i = 0; i < crystals.length; i++) {
                blastItem(crystals[i], (c, force) => {
                    c.rotVx += (rng.next() - 0.5) * force * 0.14;
                    c.rotVy += (rng.next() - 0.5) * force * 0.18;
                    c.rotVz += (rng.next() - 0.5) * force * 0.1;
                    c.highlight = Math.min(1, c.highlight + force);
                });
            }
            return true;
        },
    };
}
