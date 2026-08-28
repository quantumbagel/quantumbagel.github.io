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
    const stars = [];
    let starWarp = 0;

    const getStarCount = () => {
        if (!S.enabled) {
            return 0;
        }
        const mobile = S.width < S.MOBILE_BREAKPOINT ? 0.55 : 1;
        const areaScale = viewAreaScale(S);
        const n = 520 * areaScale * S.params.stars.density * mobile * (S.reducedMotion ? 0.4 : 1);
        return clampCount(n, S.reducedMotion ? 50 : 90, COUNT_CAPS.stars);
    };

    const resetStar = (star, rng, origin, view) => {
        star.hot = rng.next() < 0.08;
        star.boost = 0;
        star.sx = 0;
        star.sy = 0;
        if (origin === "near" && view) {
            star.z = 0.055 + rng.next() * 0.12;
            const k = view.focal / star.z;
            const ang = rng.next() * Math.PI * 2;
            const rx = (0.42 + rng.next() * 0.7) * view.width * 0.5;
            const ry = (0.42 + rng.next() * 0.7) * view.height * 0.5;
            star.x = (Math.cos(ang) * rx) / k;
            star.y = (Math.sin(ang) * ry) / k;
        } else {
            star.x = rng.next() * 1.9 - 0.95;
            star.y = rng.next() * 1.5 - 0.75;
            star.z = origin === "far" ? 1 : rng.next() * 0.82 + 0.16;
        }
        star.pz = star.z;
        return star;
    };

    const initStars = () => {
        stars.length = 0;
        starWarp = 0;
        const rng = S.createRng();
        const count = getStarCount();
        for (let i = 0; i < count; i++) {
            stars.push(resetStar({ x: 0, y: 0, z: 1, pz: 1, hot: false, sx: 0, sy: 0 }, rng, "rand"));
        }
    };

    const adjustStars = () => {
        const target = getStarCount();
        const rng = S.createRng();
        if (stars.length < target) {
            while (stars.length < target) {
                stars.push(resetStar({ x: 0, y: 0, z: 1, pz: 1, hot: false, boost: 0, sx: 0, sy: 0 }, rng, "rand"));
            }
        } else if (stars.length > target) {
            stars.length = target;
        }
    };

    const tickStars = (frame, animate) => {
        const speed = 0.0075 * S.params.stars.speed * (animate ? frame : 0);
        const reverse = speed < 0;
        const streak = S.params.stars.streak;
        const cx = S.width * 0.5 + (S.mouse.x > -500 ? (S.mouse.x - S.width * 0.5) * 0.12 : 0);
        const cy = S.height * 0.5 + (S.mouse.y > -500 ? (S.mouse.y - S.height * 0.5) * 0.12 : 0);
        const focal = Math.min(S.width, S.height) * 0.62;
        const view = { focal, width: S.width, height: S.height };
        const rng = S.createRng();
        S.ctx.lineCap = "round";
        if (animate) {
            starWarp *= Math.pow(0.92, frame);
            if (starWarp < 0.002) {
                starWarp = 0;
            }
        }
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            star.pz = star.z;
            if (animate) {
                if (star.boost > 0.002) {
                    star.boost *= Math.pow(0.9, frame);
                } else {
                    star.boost = 0;
                }
                const rush = 1 + starWarp * 1.6 + star.boost * 1.8;
                star.z -= speed * (0.45 + star.z) * rush;
            }
            if (reverse) {
                if (star.z >= 1.18) {
                    resetStar(star, rng, "near", view);
                }
            } else if (star.z <= 0.045) {
                resetStar(star, rng, "far");
            }
            const k = focal / Math.max(star.z, 0.02);
            const x = cx + star.x * k;
            const y = cy + star.y * k;
            star.sx = x;
            star.sy = y;
            if (x < -40 || x > S.width + 40 || y < -40 || y > S.height + 40) {
                if (animate && !reverse) {
                    resetStar(star, rng, "far");
                }
                continue;
            }
            const depth = 1 - Math.min(star.z, 1);
            S.ctx.globalAlpha = 0.32 + depth * 0.68;
            if (streak > 0.04 && animate) {
                const pk = focal / Math.max(star.pz, 0.045);
                S.ctx.strokeStyle = star.hot ? S.accentColorStr : S.particleColorStr;
                S.ctx.lineWidth = 0.7 + depth * 2.2 * streak;
                S.ctx.beginPath();
                S.ctx.moveTo(cx + star.x * pk, cy + star.y * pk);
                S.ctx.lineTo(x, y);
                S.ctx.stroke();
            }
            S.ctx.fillStyle = star.hot || depth > 0.72 ? S.accentColorStr : S.particleColorStr;
            S.ctx.beginPath();
            S.ctx.arc(x, y, 0.7 + depth * 2.15, 0, Math.PI * 2);
            S.ctx.fill();
        }
    };

    return {
        clear() { stars.length = 0; starWarp = 0; },
        init() { initStars(); },
        adjust() { adjustStars(); },
        tick(frame, _damp, _sy, _vh, _mx, _my, _ma, animate) { tickStars(frame, animate); },
        hitTest() { return null; },
        blast(rng, blastItem, clickX, clickY) {
            const radius = 420;
            const sx = clickX;
            const sy = clickY - window.scrollY;
            starWarp = Math.min(1, starWarp + 0.55);
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                const dx = star.sx - sx;
                const dy = star.sy - sy;
                const distSq = dx * dx + dy * dy;
                if (distSq < radius * radius) {
                    const force = 1 - Math.sqrt(Math.max(distSq, 0.01)) / radius;
                    star.boost = Math.min(1.6, (star.boost || 0) + 0.35 + force * 0.7);
                    star.hot = true;
                }
            }
            return true;
        },
    };
}
