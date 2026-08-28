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
    const fieldParticles = [];
    const fieldGusts = [];
    let fieldTime = 0;
    const getFieldCount = () => H.pagesCount(160, S.params.field.density, COUNT_CAPS.field);
    const flowOut = { fx: 0, fy: 0 };

    const FIELD_TRAIL = 32;

    const spawnFieldParticle = (rng) => ({
        x: rng.next() * S.width,
        y: rng.next() * S.docHeight,
        vx: 0,
        vy: 0,
        path: [],
        life: rng.next() * 120,
        maxLife: 90 + rng.next() * 110,
        accent: rng.next() < 0.14,
    });

    const fieldFlow = (x, y, t, swirl) => {
        const k = 0.0078 * (0.5 + swirl * 0.95);
        const t1 = t * 0.14;
        const t2 = t * 0.08;
        const gx =
            Math.sin(y * k + t1) * Math.cos(x * k * 0.62 + t2) +
            0.7 * Math.sin(y * k * 2.15 + x * k * 0.85 + t1 * 0.55) +
            0.38 * Math.sin((x + y) * k * 1.45 + t2);
        const gy =
            Math.cos(x * k * 0.9 - t1 * 0.8) * Math.sin(y * k * 0.52 + t2) +
            0.7 * Math.cos(x * k * 2.05 - y * k * 0.72 - t2 * 0.65) +
            0.38 * Math.cos((x - y) * k * 1.35 - t1);
        flowOut.fx = gy;
        flowOut.fy = -gx;
        return flowOut;
    };

    const resetFieldPath = (p) => {
        p.path.length = 0;
    };

    const initField = () => {
        fieldParticles.length = 0;
        fieldGusts.length = 0;
        fieldTime = 0;
        const rng = S.createRng();
        const n = getFieldCount();
        for (let i = 0; i < n; i++) {
            fieldParticles.push(spawnFieldParticle(rng));
        }
    };

    const adjustField = (pw, ph) => {
        scaleDocX(fieldParticles, pw);
        scaleDocY(fieldParticles, ph);
        const target = getFieldCount();
        if (fieldParticles.length < target) {
            const rng = S.createRng();
            while (fieldParticles.length < target) {
                fieldParticles.push(spawnFieldParticle(rng));
            }
        } else if (fieldParticles.length > target) {
            fieldParticles.length = target;
        }
    };

    const tickField = (frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        const speed = S.params.field.speed;
        const swirl = S.params.field.swirl;
        if (animate) {
            fieldTime += frame * 0.016;
        }
        const t = fieldTime;
        if (animate) {
            for (let g = fieldGusts.length - 1; g >= 0; g--) {
                fieldGusts[g].life -= 0.014 * frame;
                if (fieldGusts[g].life <= 0) {
                    fieldGusts.splice(g, 1);
                }
            }
        }
        S.ctx.lineCap = "round";
        S.ctx.lineJoin = "round";
        for (let i = 0; i < fieldParticles.length; i++) {
            const p = fieldParticles[i];
            if (animate) {
                const flow = fieldFlow(p.x, p.y, t, swirl);
                p.vx = p.vx * 0.9 + flow.fx * 0.55 * speed;
                p.vy = p.vy * 0.9 + flow.fy * 0.55 * speed;
                if (mouseActive) {
                    const mdx = p.x - mouseAbsX;
                    const mdy = p.y - mouseAbsY;
                    const mdSq = mdx * mdx + mdy * mdy;
                    const mr = 150;
                    if (mdSq < mr * mr && mdSq > 8) {
                        const md = Math.sqrt(mdSq);
                        const mf = (1 - md / mr);
                        const inv = 1 / md;
                        p.vx += (-mdy * inv * 0.85 + mdx * inv * 0.18) * mf * frame;
                        p.vy += (mdx * inv * 0.85 + mdy * inv * 0.18) * mf * frame;
                    }
                }
                for (let g = 0; g < fieldGusts.length; g++) {
                    const gust = fieldGusts[g];
                    const gdx = p.x - gust.x;
                    const gdy = p.y - gust.y;
                    const gdSq = gdx * gdx + gdy * gdy;
                    const gr = gust.radius;
                    if (gdSq < gr * gr && gdSq > 1) {
                        const gd = Math.sqrt(gdSq);
                        const gf = (1 - gd / gr) * gust.life;
                        const inv = 1 / gd;
                        p.vx += (gdx * inv * 2.1 + -gdy * inv * gust.spin * 1.35) * gf;
                        p.vy += (gdy * inv * 2.1 + gdx * inv * gust.spin * 1.35) * gf;
                    }
                }
                const mag = Math.hypot(p.vx, p.vy);
                const maxS = 3.8 * speed;
                if (mag > maxS) {
                    p.vx = (p.vx / mag) * maxS;
                    p.vy = (p.vy / mag) * maxS;
                }
                const ox = p.x;
                const oy = p.y;
                p.x += p.vx * frame * 1.85;
                p.y += p.vy * frame * 1.85;
                bounceBounds(p, 8);
                p.life += frame;
                if (p.life > p.maxLife) {
                    p.x = Math.random() * S.width;
                    p.y = Math.random() * S.docHeight;
                    p.vx = 0;
                    p.vy = 0;
                    p.life = 0;
                    p.maxLife = 90 + Math.random() * 110;
                    resetFieldPath(p);
                } else if (Math.abs(p.x - ox) > 70 || Math.abs(p.y - oy) > 70) {
                    resetFieldPath(p);
                } else {
                    pushPath(p.path, p.x, p.y, FIELD_TRAIL);
                }
            }
            const sy = p.y - scrollY;
            if (sy < -70 || sy > viewHeight + 70) {
                continue;
            }
            const fade = p.life < 12 ? p.life / 12 : p.life > p.maxLife - 16 ? Math.max(0, (p.maxLife - p.life) / 16) : 1;
            const color = p.accent ? S.accentColorStr : S.particleColorStr;
            const lw = p.accent ? 1.35 : 1.05;
            if (p.path.length >= 4) {
                drawFadePath(p.path, color, 0.16 + fade * 0.2, lw, scrollY);
                const n = p.path.length;
                if (n >= 8) {
                    S.ctx.strokeStyle = color;
                    S.ctx.lineWidth = lw;
                    S.ctx.globalAlpha = 0.32 + fade * 0.28;
                    S.ctx.beginPath();
                    S.ctx.moveTo(p.path[n - 8], p.path[n - 7] - scrollY);
                    S.ctx.lineTo(p.path[n - 6], p.path[n - 5] - scrollY);
                    S.ctx.lineTo(p.path[n - 4], p.path[n - 3] - scrollY);
                    S.ctx.lineTo(p.path[n - 2], p.path[n - 1] - scrollY);
                    S.ctx.stroke();
                }
            }
            S.ctx.fillStyle = color;
            S.ctx.globalAlpha = 0.38 + fade * 0.4;
            S.ctx.beginPath();
            S.ctx.arc(p.x, sy, p.accent ? 1.45 : 1.1, 0, Math.PI * 2);
            S.ctx.fill();
        }
    };

    return {
        clear() { fieldParticles.length = 0; fieldGusts.length = 0; fieldTime = 0; },
        init() { initField(); },
        adjust(pw, ph) { adjustField(pw, ph); },
        tick(frame, _damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickField(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest() { return null; },
        blast(rng, blastItem, clickX, clickY) {
            for (let i = 0; i < fieldParticles.length; i++) blastItem(fieldParticles[i]);
            fieldGusts.push({
                x: clickX,
                y: clickY,
                life: 1,
                radius: 240,
                spin: rng.next() < 0.5 ? -1 : 1,
            });
            return true;
        },
    };
}
