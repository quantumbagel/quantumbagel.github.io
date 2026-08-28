import { COUNT_CAPS } from "../config.js";
import {
    bindWorldHelpers,
    clampCount,
    createHashGrid,
    viewAreaScale,
} from "../core.js";

export function create(S) {
    const H = bindWorldHelpers(S);
    const bounceBounds = H.bounceBounds;
    const separateBodies = H.separateBodies;
    const placeApart = H.placeApart;
    const nearestHit = H.nearestHit;
    let quietSpawn = false;
    const orbitSystems = [];
    const orbitDrawBuf = [];
    const _local = { x: 0, y: 0, z: 0 };
    const _proj = { x: 0, y: 0, z: 0, p: 1 };

    const getOrbitCount = () => {
        if (!S.enabled) {
            return 0;
        }
        const viewH = Math.max(S.height, 1);
        const pages = Math.max(1, S.docHeight / viewH);
        const densityMul = S.params.orbits.density;
        const areaScale = viewAreaScale(S);
        if (S.width < S.MOBILE_BREAKPOINT) {
            const perView = S.reducedMotion ? 5 : 8;
            return clampCount(perView * pages * areaScale * densityMul, 2, COUNT_CAPS.orbits);
        }
        const area = S.width * S.docHeight;
        const density = 0.000032 * (S.reducedMotion ? 0.45 : 1) * densityMul * (S.quality ? S.quality.densityMul() : 1);
        return clampCount(area * density, S.reducedMotion ? 6 : 10, COUNT_CAPS.orbits);
    };

    const projectOrbitPoint = (px, py, pz, ox, oy) => {
        const denom = Math.max(28, S.FOCAL + S.DEPTH_OFFSET + pz);
        const persp = S.FOCAL / denom;
        _proj.x = ox + px * persp;
        _proj.y = oy + py * persp;
        _proj.z = pz;
        _proj.p = persp;
        return _proj;
    };

    const transformOrbitLocal = (r, t, tilt, twist, rotX, rotY) => {
        let x = r * Math.cos(t);
        let y = 0;
        let z = r * Math.sin(t);
        const cT = Math.cos(tilt);
        const sT = Math.sin(tilt);
        let y1 = y * cT - z * sT;
        let z1 = y * sT + z * cT;
        y = y1;
        z = z1;
        const cW = Math.cos(twist);
        const sW = Math.sin(twist);
        let x1 = x * cW + z * sW;
        z1 = -x * sW + z * cW;
        x = x1;
        z = z1;
        const cX = Math.cos(rotX);
        const sX = Math.sin(rotX);
        y1 = y * cX - z * sX;
        z1 = y * sX + z * cX;
        y = y1;
        z = z1;
        const cY = Math.cos(rotY);
        const sY = Math.sin(rotY);
        x1 = x * cY + z * sY;
        z1 = -x * sY + z * cY;
        _local.x = x1;
        _local.y = y;
        _local.z = z1;
        return _local;
    };

    class OrbitSystem {
        constructor(id, fadeIn) {
            this.id = id;
            this.rings = [];
            this.reset(fadeIn);
        }

        reset(fadeIn) {
            const rng = S.createRng();
            this.hero = rng.next() < 0.22;
            this.scaleSeed = this.hero ? 1.55 + rng.next() * 0.95 : 0.72 + rng.next() * 0.7;
            this.radius = (this.hero ? 78 : 48) * this.scaleSeed * S.params.orbits.spread;
            const pad = Math.min(this.radius, 56);
            this.lane = 0;
            this.x = pad + rng.next() * Math.max(1, S.width - pad * 2);
            this.y = pad + rng.next() * Math.max(1, S.docHeight - pad * 2);
            this.baseVx = (rng.next() - 0.5) * 0.08;
            this.baseVy = (rng.next() - 0.5) * 0.08;
            this.vx = this.baseVx;
            this.vy = this.baseVy;
            this.rotX = (rng.next() - 0.5) * 0.9;
            this.rotY = rng.next() * Math.PI * 2;
            this.rotXSpeed = (rng.next() - 0.5) * 0.003;
            this.rotYSpeed = (rng.next() - 0.5) * 0.007;
            this.dragging = false;
            this.highlight = 0;
            const vis = S.colors.visibility;
            this.baseOpacity = vis.moleculeOpacityMin + rng.next() * vis.moleculeOpacityRange + 0.14;
            this.opacity = fadeIn ? 0 : this.baseOpacity;
            const ringCount = this.hero ? 5 + ((rng.next() * 3) | 0) : 3 + ((rng.next() * 3) | 0);
            this.rings = [];
            for (let i = 0; i < ringCount; i++) {
                const electronCount = i === 0 ? 3 + ((rng.next() * 2) | 0) : 2 + ((rng.next() * 3) | 0);
                const phases = [];
                for (let e = 0; e < electronCount; e++) {
                    phases.push((e / electronCount) * Math.PI * 2 + rng.next() * 0.4);
                }
                this.rings.push({
                    radius: (14 + i * (this.hero ? 15 : 11)) * this.scaleSeed,
                    tilt: 0.28 + rng.next() * 1.15,
                    twist: rng.next() * Math.PI * 2,
                    twistSpeed: (rng.next() - 0.5) * 0.004,
                    speed: ((0.007 + rng.next() * 0.01) / Math.sqrt(i + 1)) * (rng.next() < 0.5 ? -1 : 1),
                    phases,
                    hetero: rng.next() < 0.38,
                    band: this.hero && i === ringCount - 1 && rng.next() < 0.55,
                });
            }
        }
    }

    const initOrbits = () => {
        orbitSystems.length = 0;
        const count = getOrbitCount();
        const fadeIn = !quietSpawn && !S.reducedMotion;
        for (let i = 0; i < count; i++) {
            orbitSystems.push(new OrbitSystem(i, fadeIn));
        }
        placeApart(orbitSystems, (sys) => sys.radius * S.params.orbits.spread * 0.55, S.createRng());
    };

    const adjustOrbits = (previousWidth, previousDocHeight) => {
        if (orbitSystems.length > 0 && previousDocHeight > 0 && Math.abs(S.docHeight - previousDocHeight) > 30) {
            const heightRatio = S.docHeight / previousDocHeight;
            for (let i = 0; i < orbitSystems.length; i++) {
                orbitSystems[i].y *= heightRatio;
            }
        }
        if (orbitSystems.length > 0 && previousWidth > 0 && S.width !== previousWidth) {
            const widthRatio = S.width / previousWidth;
            for (let i = 0; i < orbitSystems.length; i++) {
                orbitSystems[i].x *= widthRatio;
            }
        }
        const target = getOrbitCount();
        if (orbitSystems.length < target) {
            let maxId = orbitSystems.reduce((max, p) => (p.id > max ? p.id : max), -1);
            for (let i = 0; i < target - orbitSystems.length; i++) {
                orbitSystems.push(new OrbitSystem(maxId + 1 + i, true));
            }
        } else if (orbitSystems.length > target) {
            orbitSystems.length = target;
        }
    };


    const tickOrbits = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        const speedMul = S.params.orbits.speed;
        const spread = S.params.orbits.spread;
        const mouseR = S.MOUSE_RADIUS * 1.2;
        const samples = S.quality ? S.quality.orbitSamples() : 56;
        S.ctx.lineCap = "round";
        S.ctx.lineJoin = "round";

        for (let i = 0; i < orbitSystems.length; i++) {
            const sys = orbitSystems[i];
            if (sys.opacity < sys.baseOpacity) {
                sys.opacity += (sys.baseOpacity - sys.opacity) * damp.fadeIn;
            }
            if (animate && !sys.dragging) {
                sys.vx += (sys.baseVx - sys.vx) * damp.cruise;
                sys.vy += (sys.baseVy - sys.vy) * damp.cruise;
                if (mouseActive) {
                    const dx = mouseAbsX - sys.x;
                    const dy = mouseAbsY - sys.y;
                    const distSq = dx * dx + dy * dy;
                    const radius = mouseR + sys.radius * spread;
                    if (distSq < radius * radius) {
                        const dist = Math.sqrt(Math.max(distSq, 0.001));
                        const f = 1 - dist / radius;
                        sys.highlight += (Math.min(1, f * 1.4) - sys.highlight) * damp.opacityIn;
                        sys.rotYSpeed += dx * 0.0000009 * f * frame;
                        sys.rotXSpeed -= dy * 0.0000007 * f * frame;
                    } else {
                        sys.highlight += (0 - sys.highlight) * damp.opacityOut;
                    }
                } else {
                    sys.highlight += (0 - sys.highlight) * damp.opacityOut;
                }
                sys.rotX += sys.rotXSpeed * speedMul * frame;
                sys.rotY += sys.rotYSpeed * speedMul * frame;
                sys.x += sys.vx * frame;
                sys.y += sys.vy * frame;
            } else if (sys.dragging) {
                sys.highlight += (1 - sys.highlight) * damp.opacityIn;
                if (animate) {
                    sys.rotY += 0.012 * speedMul * frame;
                }
            }
        }
        if (animate) {
            separateBodies(orbitSystems, (sys) => sys.radius * spread * 0.58, frame, 0.52);
            for (let i = 0; i < orbitSystems.length; i++) {
                bounceBounds(orbitSystems[i], 28);
            }
        }

        for (let i = 0; i < orbitSystems.length; i++) {
            const sys = orbitSystems[i];
            if (animate) {
                for (let r = 0; r < sys.rings.length; r++) {
                    const ring = sys.rings[r];
                    ring.twist += ring.twistSpeed * speedMul * frame;
                    for (let e = 0; e < ring.phases.length; e++) {
                        ring.phases[e] += ring.speed * speedMul * frame;
                    }
                }
            }
            const originY = sys.y - scrollY;
            const visR = sys.radius * spread + 36;
            if (originY < -visR || originY > viewHeight + visR) {
                continue;
            }

            const alpha = sys.opacity * (0.62 + sys.highlight * 0.38);
            const ringColor = sys.highlight > 0.4 ? S.accentColorStr : S.particleColorStr;

            for (let r = 0; r < sys.rings.length; r++) {
                const ring = sys.rings[r];
                const rad = ring.radius * spread;
                S.ctx.strokeStyle = ringColor;
                S.ctx.lineWidth = ring.band ? 2.1 : sys.hero ? 1.05 : 0.8;
                S.ctx.beginPath();
                let moved = false;
                for (let s = 0; s <= samples; s++) {
                    const t = (s / samples) * Math.PI * 2;
                    const local = transformOrbitLocal(rad, t, ring.tilt, ring.twist, sys.rotX, sys.rotY);
                    const proj = projectOrbitPoint(local.x, local.y, local.z, sys.x, originY);
                    const depthA = 0.12 + Math.max(0, 0.55 - local.z / 90) * (0.22 + sys.highlight * 0.2);
                    if (s === 0) {
                        S.ctx.globalAlpha = alpha * depthA;
                        S.ctx.moveTo(proj.x, proj.y);
                        moved = true;
                    } else {
                        S.ctx.lineTo(proj.x, proj.y);
                    }
                }
                if (moved) {
                    S.ctx.stroke();
                }
                if (ring.band) {
                    S.ctx.lineWidth = 0.7;
                    S.ctx.beginPath();
                    for (let s = 0; s <= samples; s++) {
                        const t = (s / samples) * Math.PI * 2;
                        const local = transformOrbitLocal(rad * 1.08, t, ring.tilt, ring.twist, sys.rotX, sys.rotY);
                        const proj = projectOrbitPoint(local.x, local.y, local.z, sys.x, originY);
                        if (s === 0) {
                            S.ctx.moveTo(proj.x, proj.y);
                        } else {
                            S.ctx.lineTo(proj.x, proj.y);
                        }
                    }
                    S.ctx.globalAlpha = alpha * 0.22;
                    S.ctx.stroke();
                }
            }

            orbitDrawBuf.length = 0;
            orbitDrawBuf.push({ kind: "nucleus", z: 0, x: sys.x, y: originY, r: (sys.hero ? 6.4 : 4.8) + sys.highlight * 1.6 });
            for (let r = 0; r < sys.rings.length; r++) {
                const ring = sys.rings[r];
                const rad = ring.radius * spread;
                for (let e = 0; e < ring.phases.length; e++) {
                    const local = transformOrbitLocal(rad, ring.phases[e], ring.tilt, ring.twist, sys.rotX, sys.rotY);
                    const proj = projectOrbitPoint(local.x, local.y, local.z, sys.x, originY);
                    orbitDrawBuf.push({
                        kind: "electron",
                        z: local.z,
                        x: proj.x,
                        y: proj.y,
                        r: Math.max(0.2, (ring.hetero ? 2.8 : 2.2) * proj.p * (sys.hero ? 1.15 : 1)),
                        hetero: ring.hetero,
                        p: proj.p,
                    });
                }
            }
            orbitDrawBuf.sort((a, b) => a.z - b.z);
            for (let d = 0; d < orbitDrawBuf.length; d++) {
                const item = orbitDrawBuf[d];
                const depth = Math.max(0.4, 1 - (item.z + 36) / 140);
                if (item.kind === "nucleus") {
                    const sprite = sys.highlight > 0.4 ? S.sprites.accent : S.sprites.hetero;
                    S.ctx.globalAlpha = Math.min(0.96, alpha + 0.16);
                    S.ctx.drawImage(sprite, item.x - item.r, item.y - item.r, item.r * 2, item.r * 2);
                } else {
                    S.ctx.globalAlpha = alpha * (0.7 + depth * 0.3);
                    S.ctx.fillStyle = item.hetero || sys.highlight > 0.5 ? S.accentColorStr : S.particleColorStr;
                    S.ctx.beginPath();
                    S.ctx.arc(item.x, item.y, Math.max(0.2, item.r), 0, Math.PI * 2);
                    S.ctx.fill();
                }
            }
        }
    };

    return {
        clear() { orbitSystems.length = 0; },
        init(opts) {
            quietSpawn = !!(opts && opts.quiet);
            try { initOrbits(); } finally { quietSpawn = false; }
        },
        adjust(pw, ph) { adjustOrbits(pw, ph); },
        tick(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickOrbits(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest(absX, absY) {
            return nearestHit(orbitSystems, absX, absY, (sys) => sys.radius * S.params.orbits.spread * 0.75 + 16, 28);
        },
        blast(rng, blastItem) {
            for (let i = 0; i < orbitSystems.length; i++) {
                blastItem(orbitSystems[i], (sys, force) => {
                    sys.highlight = Math.min(1, sys.highlight + force * 0.8);
                    sys.rotYSpeed += (rng.next() - 0.5) * force * 0.02;
                    sys.rotXSpeed += (rng.next() - 0.5) * force * 0.012;
                    for (let r = 0; r < sys.rings.length; r++) {
                        sys.rings[r].speed += (rng.next() - 0.5) * force * 0.02;
                    }
                });
            }
            return true;
        },
    };
}
