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
    const auroraLayers = [];
    const auroraRumples = [];
    const getAuroraCount = () => {
        const n = 10 * Math.sqrt(H.viewAreaScale()) * S.params.aurora.density * (S.reducedMotion ? 0.5 : 1);
        return clampCount(n, 3, COUNT_CAPS.aurora);
    };

    const initAurora = () => {
        auroraLayers.length = 0;
        auroraRumples.length = 0;
        const rng = S.createRng();
        const n = getAuroraCount();
        for (let i = 0; i < n; i++) {
            auroraLayers.push({
                y: (i + 0.6) / (n + 0.4),
                a1: 18 + rng.next() * 28,
                a2: 10 + rng.next() * 18,
                f1: 0.004 + rng.next() * 0.008,
                f2: 0.009 + rng.next() * 0.012,
                w1: 0.008 + rng.next() * 0.012,
                w2: 0.011 + rng.next() * 0.016,
                p1: rng.next() * Math.PI * 2,
                p2: rng.next() * Math.PI * 2,
                accent: rng.next() < 0.45,
                width: 1.1 + rng.next() * 1.4,
            });
        }
    };

    const adjustAurora = () => {
        const target = getAuroraCount();
        if (auroraLayers.length !== target) {
            initAurora();
        }
    };

    const tickAurora = (frame, animate) => {
        const speed = S.params.aurora.speed;
        const spread = S.params.aurora.spread;
        const mouseActive = S.mouse.x > -500 && S.mouse.y > -500;
        const mX = S.mouse.x;
        const mY = S.mouse.y;
        if (animate) {
            for (let r = auroraRumples.length - 1; r >= 0; r--) {
                const rumple = auroraRumples[r];
                rumple.life -= 0.008 * frame;
                rumple.grow = Math.min(1, rumple.grow + 0.16 * frame);
                rumple.sigma += 0.55 * frame;
                rumple.amp *= Math.pow(0.978, frame);
                rumple.phase += rumple.w * frame;
                if (rumple.life <= 0 || Math.abs(rumple.amp) < 0.8) {
                    auroraRumples.splice(r, 1);
                }
            }
        }
        S.ctx.lineCap = "round";
        S.ctx.lineJoin = "round";
        for (let i = 0; i < auroraLayers.length; i++) {
            const layer = auroraLayers[i];
            if (animate) {
                layer.p1 += layer.w1 * speed * frame;
                layer.p2 += layer.w2 * speed * frame;
            }
            const baseY = S.height * (0.18 + layer.y * 0.62);
            S.ctx.strokeStyle = layer.accent ? S.accentColorStr : S.particleColorStr;
            S.ctx.lineWidth = layer.width;
            S.ctx.globalAlpha = 0.16 + (i / Math.max(auroraLayers.length, 1)) * 0.16;
            S.ctx.beginPath();
            const step = S.quality ? S.quality.auroraStep() : 5;
            for (let x = 0; x <= S.width; x += step) {
                let y =
                    baseY +
                    Math.sin(x * layer.f1 + layer.p1) * layer.a1 * spread +
                    Math.sin(x * layer.f2 + layer.p2) * layer.a2 * spread;
                if (mouseActive) {
                    const dx = x - mX;
                    const dy = baseY - mY;
                    const dSq = dx * dx + dy * dy;
                    const radius = 190;
                    if (dSq < radius * radius) {
                        const fall = 1 - Math.sqrt(dSq) / radius;
                        y += (mY - baseY) * fall * fall * 0.55;
                        y += Math.sin(dx * 0.045) * 10 * fall;
                    }
                }
                for (let r = 0; r < auroraRumples.length; r++) {
                    const rumple = auroraRumples[r];
                    const dx = x - rumple.x;
                    const dy = baseY - rumple.y;
                    const sigmaY = rumple.sigma * 1.15 + 36;
                    const fallX = Math.exp(-(dx * dx) / (2 * rumple.sigma * rumple.sigma));
                    const fallY = Math.exp(-(dy * dy) / (2 * sigmaY * sigmaY));
                    const wrinkle = 1 + 0.55 * Math.sin(dx * rumple.freq + rumple.phase);
                    y += rumple.amp * rumple.life * rumple.grow * fallX * fallY * wrinkle;
                }
                if (x === 0) {
                    S.ctx.moveTo(x, y);
                } else {
                    S.ctx.lineTo(x, y);
                }
            }
            S.ctx.stroke();
        }
    };

    return {
        clear() { auroraLayers.length = 0; auroraRumples.length = 0; },
        init() { initAurora(); },
        adjust() { adjustAurora(); },
        tick(frame, _damp, _sy, _vh, _mx, _my, _ma, animate) { tickAurora(frame, animate); },
        hitTest() { return null; },
        blast(rng, _blastItem, clickX, clickY) {
            const sx = clickX;
            const sy = clickY - window.scrollY;
            const sign = rng.next() < 0.5 ? -1 : 1;
            if (auroraRumples.length > 10) {
                auroraRumples.splice(0, auroraRumples.length - 10);
            }
            auroraRumples.push({
                x: sx, y: sy,
                amp: (70 + rng.next() * 50) * sign,
                sigma: 55 + rng.next() * 35,
                freq: 0.028 + rng.next() * 0.03,
                phase: rng.next() * Math.PI * 2,
                w: 0.07 + rng.next() * 0.1,
                life: 1, grow: 0,
            });
            auroraRumples.push({
                x: sx + (rng.next() - 0.5) * 28,
                y: sy + (rng.next() - 0.5) * 18,
                amp: (28 + rng.next() * 22) * -sign,
                sigma: 22 + rng.next() * 16,
                freq: 0.07 + rng.next() * 0.06,
                phase: rng.next() * Math.PI * 2,
                w: 0.12 + rng.next() * 0.16,
                life: 1, grow: 0,
            });
            return true;
        },
    };
}
