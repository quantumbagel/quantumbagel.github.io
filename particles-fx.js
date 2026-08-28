(function (root) {
    "use strict";

    root.ParticleBG = root.ParticleBG || {};

    root.ParticleBG.createFx = function (S) {
        const netParticles = [];
        const orbitSystems = [];
        const orbitDrawBuf = [];
        const stars = [];
        const epicycles = [];
        const harmonics = [];
        const auroraLayers = [];
        const pendulums = [];
        const crystals = [];
        const boids = [];
        const fieldParticles = [];
        const rainCols = [];
        const PATH_CAP = 360;
        const netGrid = {
            cellSize: 88,
            cols: 1,
            rows: 1,
            cells: [[]],
            occupied: [],
        };

        const getNetworkCount = () => {
            if (!S.enabled) {
                return 0;
            }
            const area = S.width * S.docHeight;
            const mobile = S.width < S.MOBILE_BREAKPOINT ? 0.5 : 1;
            const density = 0.00013 * S.params.network.density * (S.reducedMotion ? 0.38 : 1) * mobile;
            return Math.min(820, Math.max(S.reducedMotion ? 70 : 120, Math.floor(area * density)));
        };

        class NetParticle {
            constructor(id, fadeIn) {
                this.id = id;
                this.reset(fadeIn);
            }

            reset(fadeIn) {
                const rng = S.createRng();
                this.x = rng.next() * S.width;
                this.y = rng.next() * S.docHeight;
                const speed = 0.28 * S.params.network.speed;
                this.baseVx = (rng.next() - 0.5) * speed;
                this.baseVy = (rng.next() - 0.5) * speed;
                this.vx = this.baseVx;
                this.vy = this.baseVy;
                this.radius = rng.next() * 1.4 + 0.9;
                const vis = S.colors.visibility;
                this.baseOpacity = rng.next() * vis.moleculeOpacityRange + vis.moleculeOpacityMin + 0.08;
                this.opacity = fadeIn ? 0 : this.baseOpacity;
                this.highlighted = false;
                this.dragging = false;
            }
        }

        const initNetwork = () => {
            netParticles.length = 0;
            const count = getNetworkCount();
            const fadeIn = !S.reducedMotion;
            for (let i = 0; i < count; i++) {
                netParticles.push(new NetParticle(i, fadeIn));
            }
        };

        const adjustNetwork = (previousWidth, previousDocHeight) => {
            if (netParticles.length > 0 && previousDocHeight > 0 && Math.abs(S.docHeight - previousDocHeight) > 30) {
                const heightRatio = S.docHeight / previousDocHeight;
                for (let i = 0; i < netParticles.length; i++) {
                    netParticles[i].y *= heightRatio;
                }
            }
            if (netParticles.length > 0 && previousWidth > 0 && S.width !== previousWidth) {
                const widthRatio = S.width / previousWidth;
                for (let i = 0; i < netParticles.length; i++) {
                    netParticles[i].x *= widthRatio;
                }
            }
            const target = getNetworkCount();
            if (netParticles.length < target) {
                let maxId = netParticles.reduce((max, p) => (p.id > max ? p.id : max), -1);
                for (let i = 0; i < target - netParticles.length; i++) {
                    netParticles.push(new NetParticle(maxId + 1 + i, true));
                }
            } else if (netParticles.length > target) {
                netParticles.length = target;
            }
        };

        const rebuildNetGrid = (viewHeight, scrollY) => {
            const cell = netGrid.cellSize;
            netGrid.cols = Math.max(1, Math.ceil(S.width / cell));
            netGrid.rows = Math.max(1, Math.ceil((viewHeight + 280) / cell));
            const count = netGrid.cols * netGrid.rows;
            if (netGrid.cells.length !== count) {
                netGrid.cells = new Array(count);
                for (let i = 0; i < count; i++) {
                    netGrid.cells[i] = [];
                }
            } else {
                for (let i = 0; i < netGrid.occupied.length; i++) {
                    netGrid.cells[netGrid.occupied[i]].length = 0;
                }
            }
            netGrid.occupied.length = 0;
            const pad = 140;
            for (let i = 0; i < netParticles.length; i++) {
                const p = netParticles[i];
                const sy = p.y - scrollY;
                if (sy < -pad || sy > viewHeight + pad) {
                    continue;
                }
                let cx = (p.x / cell) | 0;
                let cy = ((sy + 140) / cell) | 0;
                if (cx < 0) cx = 0;
                else if (cx >= netGrid.cols) cx = netGrid.cols - 1;
                if (cy < 0) cy = 0;
                else if (cy >= netGrid.rows) cy = netGrid.rows - 1;
                const index = cy * netGrid.cols + cx;
                if (netGrid.cells[index].length === 0) {
                    netGrid.occupied.push(index);
                }
                netGrid.cells[index].push(p);
            }
        };

        const getOrbitCount = () => {
            if (!S.enabled) {
                return 0;
            }
            const viewH = Math.max(S.height, 1);
            const pages = Math.max(1, S.docHeight / viewH);
            const densityMul = S.params.orbits.density;
            if (S.width < S.MOBILE_BREAKPOINT) {
                const perView = S.reducedMotion ? 3 : 5;
                return Math.min(48, Math.max(perView, Math.round(perView * pages * densityMul)));
            }
            const area = S.width * S.docHeight;
            const density = 0.000028 * (S.reducedMotion ? 0.45 : 1) * densityMul;
            return Math.min(80, Math.max(S.reducedMotion ? 8 : 16, Math.floor(area * density)));
        };

        const projectOrbitPoint = (px, py, pz, ox, oy) => {
            const persp = S.FOCAL / (S.FOCAL + S.DEPTH_OFFSET + pz);
            return {
                x: ox + px * persp,
                y: oy + py * persp,
                z: pz,
                p: persp,
            };
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
            return { x: x1, y, z: z1 };
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
                const ringCount = this.hero ? 4 + ((rng.next() * 3) | 0) : 2 + ((rng.next() * 3) | 0);
                this.rings = [];
                for (let i = 0; i < ringCount; i++) {
                    const electronCount = i === 0 ? 2 + ((rng.next() * 2) | 0) : 1 + ((rng.next() * 2) | 0);
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
            const fadeIn = !S.reducedMotion;
            for (let i = 0; i < count; i++) {
                orbitSystems.push(new OrbitSystem(i, fadeIn));
            }
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


        const tickNetwork = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
            const connectDist = 68 * S.params.network.links;
            const connectSq = connectDist * connectDist;
            const hoverConnect = 86 * S.params.network.links;
            const hoverSq = hoverConnect * hoverConnect;
            const sep = 36;
            const sepSq = sep * sep;
            const mouseR = S.MOUSE_RADIUS * S.params.network.mouse;
            const mouseSq = mouseR * mouseR;
            const speedMul = S.params.network.speed;
            const pad = 140;

            for (let i = 0; i < netParticles.length; i++) {
                const p = netParticles[i];
                if (p.opacity < p.baseOpacity) {
                    p.opacity += (p.baseOpacity - p.opacity) * damp.fadeIn;
                }
                if (animate && !p.dragging) {
                    p.vx += (p.baseVx * speedMul - p.vx) * damp.cruise;
                    p.vy += (p.baseVy * speedMul - p.vy) * damp.cruise;
                    if (mouseActive && S.params.network.mouse > 0.01) {
                        const dx = p.x - mouseAbsX;
                        const dy = p.y - mouseAbsY;
                        const distSq = dx * dx + dy * dy;
                        if (distSq < mouseSq && distSq > 0.01) {
                            const dist = Math.sqrt(distSq);
                            const f = 1 - dist / mouseR;
                            p.vx += (dx / dist) * f * 0.9 * frame * S.params.network.mouse;
                            p.vy += (dy / dist) * f * 0.9 * frame * S.params.network.mouse;
                            p.highlighted = true;
                            p.opacity += (Math.min(0.9, p.baseOpacity + f * 0.5) - p.opacity) * damp.opacityIn;
                        } else {
                            p.highlighted = false;
                            p.opacity += (p.baseOpacity - p.opacity) * damp.opacityOut;
                        }
                    } else {
                        p.highlighted = false;
                        p.opacity += (p.baseOpacity - p.opacity) * damp.opacityOut;
                    }
                    p.x += p.vx * frame;
                    p.y += p.vy * frame;
                    if (p.x < 0) {
                        p.x = 0;
                        p.vx = Math.abs(p.vx) * 0.85;
                    } else if (p.x > S.width) {
                        p.x = S.width;
                        p.vx = -Math.abs(p.vx) * 0.85;
                    }
                    if (p.y < 0) {
                        p.y = 0;
                        p.vy = Math.abs(p.vy) * 0.85;
                    } else if (p.y > S.docHeight) {
                        p.y = S.docHeight;
                        p.vy = -Math.abs(p.vy) * 0.85;
                    }
                } else if (p.dragging) {
                    p.highlighted = true;
                    p.opacity = Math.min(0.95, p.baseOpacity + 0.4);
                }
            }

            rebuildNetGrid(viewHeight, scrollY);
            S.ctx.lineCap = "round";
            S.ctx.lineWidth = 0.55;
            const vis = S.colors.visibility;
            for (let i = 0; i < netParticles.length; i++) {
                const p1 = netParticles[i];
                const sy1 = p1.y - scrollY;
                if (sy1 < -pad || sy1 > viewHeight + pad) {
                    continue;
                }
                let cx = (p1.x / netGrid.cellSize) | 0;
                let cy = ((sy1 + 140) / netGrid.cellSize) | 0;
                if (cx < 0) cx = 0;
                else if (cx >= netGrid.cols) cx = netGrid.cols - 1;
                if (cy < 0) cy = 0;
                else if (cy >= netGrid.rows) cy = netGrid.rows - 1;
                const xMin = cx > 0 ? cx - 1 : 0;
                const xMax = cx + 1 < netGrid.cols ? cx + 1 : netGrid.cols - 1;
                const yMin = cy > 0 ? cy - 1 : 0;
                const yMax = cy + 1 < netGrid.rows ? cy + 1 : netGrid.rows - 1;
                for (let ny = yMin; ny <= yMax; ny++) {
                    for (let nx = xMin; nx <= xMax; nx++) {
                        const cell = netGrid.cells[ny * netGrid.cols + nx];
                        for (let c = 0; c < cell.length; c++) {
                            const p2 = cell[c];
                            if (p2.id <= p1.id) {
                                continue;
                            }
                            const dx = p1.x - p2.x;
                            const dy = p1.y - p2.y;
                            const distSq = dx * dx + dy * dy;
                            const hoverPair = p1.highlighted || p2.highlighted;
                            const maxSq = hoverPair ? hoverSq : connectSq;
                            if (distSq >= maxSq || distSq < 0.01) {
                                continue;
                            }
                            const dist = Math.sqrt(distSq);
                            if (distSq < sepSq && !p1.dragging && !p2.dragging) {
                                const overlap = (sep - dist) / sep;
                                const push = overlap * overlap * 0.3 * frame;
                                const inv = 1 / dist;
                                p1.x += dx * inv * push;
                                p1.y += dy * inv * push;
                                p2.x -= dx * inv * push;
                                p2.y -= dy * inv * push;
                            }
                            S.ctx.strokeStyle = hoverPair ? S.accentColorStr : S.particleColorStr;
                            S.ctx.globalAlpha = (1 - dist / Math.sqrt(maxSq)) * (hoverPair ? vis.hoverBondAlpha : vis.bondAlpha);
                            S.ctx.beginPath();
                            S.ctx.moveTo(p1.x, sy1);
                            S.ctx.lineTo(p2.x, p2.y - scrollY);
                            S.ctx.stroke();
                        }
                    }
                }
            }

            for (let i = 0; i < netParticles.length; i++) {
                const p = netParticles[i];
                const sy = p.y - scrollY;
                if (sy < -20 || sy > viewHeight + 20) {
                    continue;
                }
                S.ctx.globalAlpha = p.opacity;
                S.ctx.fillStyle = p.highlighted ? S.accentColorStr : S.particleColorStr;
                S.ctx.beginPath();
                S.ctx.arc(p.x, sy, p.radius * (p.highlighted ? 1.35 : 1), 0, Math.PI * 2);
                S.ctx.fill();
            }
        };

        const tickOrbits = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
            const speedMul = S.params.orbits.speed;
            const spread = S.params.orbits.spread;
            const mouseR = S.MOUSE_RADIUS * 1.2;
            const samples = 56;
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
                    const pad = 28;
                    if (sys.x < pad) {
                        sys.x = pad;
                        sys.vx = Math.abs(sys.vx) * 0.85;
                    } else if (sys.x > S.width - pad) {
                        sys.x = S.width - pad;
                        sys.vx = -Math.abs(sys.vx) * 0.85;
                    }
                    if (sys.y < pad) {
                        sys.y = pad;
                        sys.vy = Math.abs(sys.vy) * 0.85;
                    } else if (sys.y > S.docHeight - pad) {
                        sys.y = S.docHeight - pad;
                        sys.vy = -Math.abs(sys.vy) * 0.85;
                    }
                } else if (sys.dragging) {
                    sys.highlight += (1 - sys.highlight) * damp.opacityIn;
                    if (animate) {
                        sys.rotY += 0.012 * speedMul * frame;
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
                    if (animate) {
                        ring.twist += ring.twistSpeed * speedMul * frame;
                    }
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
                        if (animate) {
                            ring.phases[e] += ring.speed * speedMul * frame;
                        }
                        const local = transformOrbitLocal(rad, ring.phases[e], ring.tilt, ring.twist, sys.rotX, sys.rotY);
                        const proj = projectOrbitPoint(local.x, local.y, local.z, sys.x, originY);
                        orbitDrawBuf.push({
                            kind: "electron",
                            z: local.z,
                            x: proj.x,
                            y: proj.y,
                            r: (ring.hetero ? 2.8 : 2.2) * proj.p * (sys.hero ? 1.15 : 1),
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
                        S.ctx.arc(item.x, item.y, item.r, 0, Math.PI * 2);
                        S.ctx.fill();
                    }
                }
            }
        };

        const getStarCount = () => {
            if (!S.enabled) {
                return 0;
            }
            const mobile = S.width < S.MOBILE_BREAKPOINT ? 0.55 : 1;
            const n = Math.floor(340 * S.params.stars.density * mobile * (S.reducedMotion ? 0.4 : 1));
            return Math.min(560, Math.max(S.reducedMotion ? 80 : 160, n));
        };

        const resetStar = (star, rng, fromFar) => {
            star.x = rng.next() * 1.9 - 0.95;
            star.y = rng.next() * 1.5 - 0.75;
            star.z = fromFar ? 1 : rng.next() * 0.82 + 0.16;
            star.pz = star.z;
            star.hot = rng.next() < 0.08;
            return star;
        };

        const initStars = () => {
            stars.length = 0;
            const rng = S.createRng();
            const count = getStarCount();
            for (let i = 0; i < count; i++) {
                stars.push(resetStar({ x: 0, y: 0, z: 1, pz: 1, hot: false }, rng, false));
            }
        };

        const adjustStars = () => {
            const target = getStarCount();
            const rng = S.createRng();
            if (stars.length < target) {
                while (stars.length < target) {
                    stars.push(resetStar({ x: 0, y: 0, z: 1, pz: 1, hot: false }, rng, false));
                }
            } else if (stars.length > target) {
                stars.length = target;
            }
        };

        const tickStars = (frame, animate) => {
            const speed = 0.0075 * S.params.stars.speed * (animate ? frame : 0);
            const streak = S.params.stars.streak;
            const cx = S.width * 0.5 + (S.mouse.x > -500 ? (S.mouse.x - S.width * 0.5) * 0.12 : 0);
            const cy = S.height * 0.5 + (S.mouse.y > -500 ? (S.mouse.y - S.height * 0.5) * 0.12 : 0);
            const focal = Math.min(S.width, S.height) * 0.62;
            const rng = S.createRng();
            S.ctx.lineCap = "round";
            for (let i = 0; i < stars.length; i++) {
                const star = stars[i];
                star.pz = star.z;
                if (animate) {
                    star.z -= speed * (0.45 + star.z);
                }
                if (star.z <= 0.045) {
                    resetStar(star, rng, true);
                }
                const k = focal / star.z;
                const x = cx + star.x * k;
                const y = cy + star.y * k;
                if (x < -40 || x > S.width + 40 || y < -40 || y > S.height + 40) {
                    if (animate) {
                        resetStar(star, rng, true);
                    }
                    continue;
                }
                const depth = 1 - star.z;
                S.ctx.globalAlpha = 0.32 + depth * 0.68;
                if (streak > 0.04 && animate) {
                    const pk = focal / Math.max(star.pz, star.z + speed);
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

        const pushPath = (path, x, y, maxPts) => {
            path.push(x, y);
            const cap = (maxPts || PATH_CAP) * 2;
            if (path.length > cap) {
                path.splice(0, path.length - cap);
            }
        };

        const drawFadePath = (path, color, alpha, lineW, scrollY) => {
            if (path.length < 4) {
                return;
            }
            S.ctx.strokeStyle = color;
            S.ctx.lineCap = "round";
            S.ctx.lineJoin = "round";
            S.ctx.lineWidth = lineW;
            S.ctx.globalAlpha = alpha;
            S.ctx.beginPath();
            S.ctx.moveTo(path[0], path[1] - scrollY);
            for (let i = 2; i < path.length; i += 2) {
                S.ctx.lineTo(path[i], path[i + 1] - scrollY);
            }
            S.ctx.stroke();
        };

        const pagesCount = (perView, maxTotal, densityMul) => {
            const pages = Math.max(1, S.docHeight / Math.max(S.height, 1));
            const mobile = S.width < S.MOBILE_BREAKPOINT ? 0.65 : 1;
            const n = Math.round(perView * pages * (densityMul || 1) * mobile * (S.reducedMotion ? 0.5 : 1));
            return Math.min(maxTotal, Math.max(S.reducedMotion ? Math.max(2, (perView * 0.5) | 0) : perView, n));
        };

        const getEpicycleCount = () => pagesCount(5, 70, S.params.epicycles.density);
        const getHarmonicCount = () => pagesCount(5, 60, S.params.harmonograph.density);
        const getPendulumCount = () => pagesCount(5, 50, S.params.pendulum.density);
        const getCrystalCount = () => pagesCount(5, 60, S.params.crystal.density);
        const getFlockCount = () => pagesCount(70, 700, S.params.flock.density);
        const getFieldCount = () => pagesCount(110, 900, S.params.field.density);
        const getAuroraCount = () => Math.min(14, Math.max(4, Math.round(7 * S.params.aurora.density * (S.reducedMotion ? 0.5 : 1))));
        const getRainCount = () => Math.min(90, Math.max(18, Math.round((S.width / 18) * S.params.rain.density * (S.width < S.MOBILE_BREAKPOINT ? 0.7 : 1))));

        const scaleDocY = (items, previousDocHeight) => {
            if (previousDocHeight > 0 && Math.abs(S.docHeight - previousDocHeight) > 30) {
                const ratio = S.docHeight / previousDocHeight;
                for (let i = 0; i < items.length; i++) {
                    if (typeof items[i].y === "number") {
                        items[i].y *= ratio;
                    }
                }
            }
        };

        const scaleDocX = (items, previousWidth) => {
            if (previousWidth > 0 && S.width !== previousWidth) {
                const ratio = S.width / previousWidth;
                for (let i = 0; i < items.length; i++) {
                    if (typeof items[i].x === "number") {
                        items[i].x *= ratio;
                    }
                }
            }
        };

        const initEpicycles = () => {
            epicycles.length = 0;
            const rng = S.createRng();
            const n = getEpicycleCount();
            for (let i = 0; i < n; i++) {
                const armN = 3 + ((rng.next() * 3 * S.params.epicycles.arms) | 0);
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
                    arms,
                    path: [],
                    radius: rSum,
                    accent: rng.next() < 0.4,
                });
            }
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
                let x = sys.x;
                let y = sys.y;
                const sy0 = sys.y - scrollY;
                if (sy0 < -sys.radius - 40 || sy0 > viewHeight + sys.radius + 40) {
                    continue;
                }
                let px = x;
                let py = y;
                for (let a = 0; a < sys.arms.length; a++) {
                    const arm = sys.arms[a];
                    if (animate) {
                        arm.p += arm.w * speed * frame;
                    }
                    const nx = x + Math.cos(arm.p) * arm.r;
                    const ny = y + Math.sin(arm.p) * arm.r;
                    S.ctx.strokeStyle = S.particleColorStr;
                    S.ctx.globalAlpha = 0.12;
                    S.ctx.lineWidth = 0.7;
                    S.ctx.beginPath();
                    S.ctx.arc(x - 0, y - scrollY, Math.abs(arm.r), 0, Math.PI * 2);
                    S.ctx.stroke();
                    S.ctx.globalAlpha = 0.22;
                    S.ctx.beginPath();
                    S.ctx.moveTo(x, y - scrollY);
                    S.ctx.lineTo(nx, ny - scrollY);
                    S.ctx.stroke();
                    x = nx;
                    y = ny;
                    px = nx;
                    py = ny;
                }
                if (animate) {
                    pushPath(sys.path, px, py, PATH_CAP);
                }
                drawFadePath(sys.path, sys.accent ? S.accentColorStr : S.particleColorStr, 0.55, 1.15, scrollY);
                S.ctx.globalAlpha = 0.85;
                S.ctx.fillStyle = sys.accent ? S.accentColorStr : S.particleColorStr;
                S.ctx.beginPath();
                S.ctx.arc(px, py - scrollY, 2.2, 0, Math.PI * 2);
                S.ctx.fill();
            }
        };

        const initHarmonics = () => {
            harmonics.length = 0;
            const rng = S.createRng();
            const n = getHarmonicCount();
            for (let i = 0; i < n; i++) {
                harmonics.push({
                    x: 40 + rng.next() * Math.max(1, S.width - 80),
                    y: 40 + rng.next() * Math.max(1, S.docHeight - 80),
                    ax: 40 + rng.next() * 70,
                    ay: 30 + rng.next() * 55,
                    wx: 0.011 + rng.next() * 0.02,
                    wy: 0.013 + rng.next() * 0.022,
                    px: rng.next() * Math.PI * 2,
                    py: rng.next() * Math.PI * 2,
                    t: rng.next() * 40,
                    path: [],
                    accent: rng.next() < 0.45,
                });
            }
        };

        const adjustHarmonics = (pw, ph) => {
            scaleDocX(harmonics, pw);
            scaleDocY(harmonics, ph);
            const target = getHarmonicCount();
            if (harmonics.length < target) {
                initHarmonics();
            } else if (harmonics.length > target) {
                harmonics.length = target;
            }
        };

        const tickHarmonics = (frame, scrollY, viewHeight, animate) => {
            const speed = S.params.harmonograph.speed;
            const decay = 0.0009 + (1 - S.params.harmonograph.decay) * 0.0028;
            for (let i = 0; i < harmonics.length; i++) {
                const h = harmonics[i];
                const vis = h.y - scrollY;
                if (vis < -140 || vis > viewHeight + 140) {
                    continue;
                }
                if (animate) {
                    h.t += speed * frame;
                    const damp = Math.exp(-decay * h.t);
                    if (damp < 0.08) {
                        h.t = 0;
                        h.path.length = 0;
                        h.px = Math.random() * Math.PI * 2;
                        h.py = Math.random() * Math.PI * 2;
                    }
                    const x = h.x + Math.sin(h.wx * h.t + h.px) * h.ax * Math.max(damp, 0.08);
                    const y = h.y + Math.sin(h.wy * h.t + h.py) * h.ay * Math.max(damp, 0.08);
                    pushPath(h.path, x, y, PATH_CAP);
                }
                drawFadePath(h.path, h.accent ? S.accentColorStr : S.particleColorStr, 0.5, 1.05, scrollY);
            }
        };

        const initAurora = () => {
            auroraLayers.length = 0;
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
            const mx = S.mouse.x > -500 ? (S.mouse.x / Math.max(S.width, 1) - 0.5) : 0;
            const my = S.mouse.y > -500 ? (S.mouse.y / Math.max(S.height, 1) - 0.5) : 0;
            S.ctx.lineCap = "round";
            for (let i = 0; i < auroraLayers.length; i++) {
                const layer = auroraLayers[i];
                if (animate) {
                    layer.p1 += layer.w1 * speed * frame;
                    layer.p2 += layer.w2 * speed * frame;
                }
                const baseY = S.height * (0.18 + layer.y * 0.62) + my * 30;
                S.ctx.strokeStyle = layer.accent ? S.accentColorStr : S.particleColorStr;
                S.ctx.lineWidth = layer.width;
                S.ctx.globalAlpha = 0.16 + (i / Math.max(auroraLayers.length, 1)) * 0.16;
                S.ctx.beginPath();
                for (let x = 0; x <= S.width; x += 5) {
                    const y =
                        baseY +
                        Math.sin(x * layer.f1 + layer.p1 + mx * 1.4) * layer.a1 * spread +
                        Math.sin(x * layer.f2 + layer.p2 - mx) * layer.a2 * spread;
                    if (x === 0) {
                        S.ctx.moveTo(x, y);
                    } else {
                        S.ctx.lineTo(x, y);
                    }
                }
                S.ctx.stroke();
            }
        };

        const initPendulums = () => {
            pendulums.length = 0;
            const rng = S.createRng();
            const n = getPendulumCount();
            for (let i = 0; i < n; i++) {
                pendulums.push({
                    x: 40 + rng.next() * Math.max(1, S.width - 80),
                    y: 50 + rng.next() * Math.max(1, S.docHeight - 120),
                    l1: 36 + rng.next() * 22,
                    l2: 28 + rng.next() * 20,
                    a1: Math.PI * (0.6 + rng.next() * 0.8),
                    a2: Math.PI * (0.4 + rng.next() * 1.1),
                    w1: (rng.next() - 0.5) * 0.04,
                    w2: (rng.next() - 0.5) * 0.04,
                    path: [],
                    accent: rng.next() < 0.5,
                });
            }
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

        const tickPendulums = (frame, scrollY, viewHeight, animate) => {
            const speed = S.params.pendulum.speed;
            const g = 0.28 * S.params.pendulum.energy;
            const dt = 0.16 * frame * speed;
            for (let i = 0; i < pendulums.length; i++) {
                const p = pendulums[i];
                const vis = p.y - scrollY;
                if (vis < -160 || vis > viewHeight + 160) {
                    if (animate) {
                        const a1 = p.a1;
                        const a2 = p.a2;
                        const w1 = p.w1;
                        const w2 = p.w2;
                        const l1 = p.l1;
                        const l2 = p.l2;
                        const den = 2 - Math.cos(2 * (a1 - a2));
                        const aw1 = (-g * (2 * Math.sin(a1) - Math.sin(a1 - 2 * a2)) - 2 * Math.sin(a1 - a2) * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(a1 - a2))) / (l1 * den);
                        const aw2 = (2 * Math.sin(a1 - a2) * (w1 * w1 * l1 + g * Math.cos(a1) + w2 * w2 * l2 * Math.cos(a1 - a2))) / (l2 * den);
                        p.w1 += aw1 * dt;
                        p.w2 += aw2 * dt;
                        p.a1 += p.w1 * dt;
                        p.a2 += p.w2 * dt;
                    }
                    continue;
                }
                if (animate) {
                    const a1 = p.a1;
                    const a2 = p.a2;
                    const w1 = p.w1;
                    const w2 = p.w2;
                    const l1 = p.l1;
                    const l2 = p.l2;
                    const den = 2 - Math.cos(2 * (a1 - a2));
                    const aw1 = (-g * (2 * Math.sin(a1) - Math.sin(a1 - 2 * a2)) - 2 * Math.sin(a1 - a2) * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(a1 - a2))) / (l1 * den);
                    const aw2 = (2 * Math.sin(a1 - a2) * (w1 * w1 * l1 + g * Math.cos(a1) + w2 * w2 * l2 * Math.cos(a1 - a2))) / (l2 * den);
                    p.w1 += aw1 * dt;
                    p.w2 += aw2 * dt;
                    p.w1 *= 0.9992;
                    p.w2 *= 0.9992;
                    p.a1 += p.w1 * dt;
                    p.a2 += p.w2 * dt;
                }
                const x1 = p.x + Math.sin(p.a1) * p.l1;
                const y1 = p.y + Math.cos(p.a1) * p.l1;
                const x2 = x1 + Math.sin(p.a2) * p.l2;
                const y2 = y1 + Math.cos(p.a2) * p.l2;
                if (animate) {
                    pushPath(p.path, x2, y2, PATH_CAP);
                }
                drawFadePath(p.path, p.accent ? S.accentColorStr : S.particleColorStr, 0.42, 1, scrollY);
                S.ctx.strokeStyle = S.particleColorStr;
                S.ctx.globalAlpha = 0.35;
                S.ctx.lineWidth = 1;
                S.ctx.beginPath();
                S.ctx.moveTo(p.x, p.y - scrollY);
                S.ctx.lineTo(x1, y1 - scrollY);
                S.ctx.lineTo(x2, y2 - scrollY);
                S.ctx.stroke();
                S.ctx.globalAlpha = 0.8;
                S.ctx.fillStyle = S.particleColorStr;
                S.ctx.beginPath();
                S.ctx.arc(x1, y1 - scrollY, 2.1, 0, Math.PI * 2);
                S.ctx.fill();
                S.ctx.fillStyle = p.accent ? S.accentColorStr : S.particleColorStr;
                S.ctx.beginPath();
                S.ctx.arc(x2, y2 - scrollY, 2.6, 0, Math.PI * 2);
                S.ctx.fill();
            }
        };

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
                crystals.push({
                    x: 40 + rng.next() * Math.max(1, S.width - 80),
                    y: 40 + rng.next() * Math.max(1, S.docHeight - 80),
                    vx: (rng.next() - 0.5) * 0.08,
                    vy: (rng.next() - 0.5) * 0.08,
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

        const tickCrystals = (frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
            const speed = S.params.crystal.speed;
            const size = S.params.crystal.size;
            S.ctx.lineCap = "round";
            for (let i = 0; i < crystals.length; i++) {
                const c = crystals[i];
                if (animate && !c.dragging) {
                    c.rotX += c.rotVx * speed * frame;
                    c.rotY += c.rotVy * speed * frame;
                    c.rotZ += c.rotVz * speed * frame;
                    c.x += c.vx * frame;
                    c.y += c.vy * frame;
                    if (c.x < 24) {
                        c.x = 24;
                        c.vx = Math.abs(c.vx);
                    } else if (c.x > S.width - 24) {
                        c.x = S.width - 24;
                        c.vx = -Math.abs(c.vx);
                    }
                    if (c.y < 24) {
                        c.y = 24;
                        c.vy = Math.abs(c.vy);
                    } else if (c.y > S.docHeight - 24) {
                        c.y = S.docHeight - 24;
                        c.vy = -Math.abs(c.vy);
                    }
                    if (mouseActive) {
                        const dx = mouseAbsX - c.x;
                        const dy = mouseAbsY - c.y;
                        const d = Math.hypot(dx, dy);
                        if (d < 120) {
                            c.highlight += (1 - c.highlight) * 0.12;
                            c.rotVy += dx * 0.00002 * frame;
                        } else {
                            c.highlight *= 0.92;
                        }
                    } else {
                        c.highlight *= 0.92;
                    }
                } else if (c.dragging) {
                    c.highlight = 1;
                    if (animate) {
                        c.rotY += 0.02 * speed * frame;
                    }
                }
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
                const proj = [];
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
                    const persp = S.FOCAL / (S.FOCAL + S.DEPTH_OFFSET + z1);
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
                    for (let j = 0; j < boids.length; j++) {
                        if (j === i) {
                            continue;
                        }
                        const o = boids[j];
                        const dx = o.x - b.x;
                        const dy = o.y - b.y;
                        const dSq = dx * dx + dy * dy;
                        if (dSq > 85 * 85 || dSq < 0.01) {
                            continue;
                        }
                        const d = Math.sqrt(dSq);
                        n += 1;
                        ax += o.vx;
                        ay += o.vy;
                        cx += o.x;
                        cy += o.y;
                        if (d < 22) {
                            sx -= dx / d;
                            sy -= dy / d;
                        }
                    }
                    if (n > 0) {
                        ax = ax / n - b.vx;
                        ay = ay / n - b.vy;
                        cx = cx / n - b.x;
                        cy = cy / n - b.y;
                        b.vx += ax * 0.04 * coh + cx * 0.003 * coh + sx * 0.12;
                        b.vy += ay * 0.04 * coh + cy * 0.003 * coh + sy * 0.12;
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
                    if (b.x < 0) {
                        b.x += S.width;
                    } else if (b.x > S.width) {
                        b.x -= S.width;
                    }
                    if (b.y < 0) {
                        b.y += S.docHeight;
                    } else if (b.y > S.docHeight) {
                        b.y -= S.docHeight;
                    }
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

        const initField = () => {
            fieldParticles.length = 0;
            const rng = S.createRng();
            const n = getFieldCount();
            for (let i = 0; i < n; i++) {
                fieldParticles.push({
                    x: rng.next() * S.width,
                    y: rng.next() * S.docHeight,
                    px: 0,
                    py: 0,
                    life: rng.next(),
                });
            }
        };

        const adjustField = (pw, ph) => {
            scaleDocX(fieldParticles, pw);
            scaleDocY(fieldParticles, ph);
            const target = getFieldCount();
            if (fieldParticles.length < target) {
                initField();
            } else if (fieldParticles.length > target) {
                fieldParticles.length = target;
            }
        };

        const tickField = (frame, scrollY, viewHeight, animate) => {
            const speed = S.params.field.speed;
            const swirl = S.params.field.swirl;
            const t = (S.lastFrameTime || 0) * 0.001;
            S.ctx.lineCap = "round";
            S.ctx.strokeStyle = S.particleColorStr;
            S.ctx.lineWidth = 1.25;
            for (let i = 0; i < fieldParticles.length; i++) {
                const p = fieldParticles[i];
                const fx = Math.sin((p.y * 0.012 + t) * swirl) + Math.cos((p.x * 0.008 - t * 0.7) * swirl);
                const fy = Math.cos((p.x * 0.012 - t) * swirl) + Math.sin((p.y * 0.009 + t * 0.6) * swirl);
                if (animate) {
                    p.x += fx * 1.35 * speed * frame;
                    p.y += fy * 1.35 * speed * frame;
                    p.life += 0.01 * frame;
                    if (p.x < 0) {
                        p.x += S.width;
                    } else if (p.x > S.width) {
                        p.x -= S.width;
                    }
                    if (p.y < 0) {
                        p.y += S.docHeight;
                    } else if (p.y > S.docHeight) {
                        p.y -= S.docHeight;
                    }
                }
                const sy = p.y - scrollY;
                if (sy < -24 || sy > viewHeight + 24) {
                    continue;
                }
                S.ctx.globalAlpha = 0.28 + (Math.sin(p.life) * 0.5 + 0.5) * 0.32;
                S.ctx.beginPath();
                S.ctx.moveTo(p.x - fx * 5.5, sy - fy * 5.5);
                S.ctx.lineTo(p.x + fx * 5.5, sy + fy * 5.5);
                S.ctx.stroke();
            }
        };

        const RAIN_GLYPHS = "01.-/\\|";
        const initRain = () => {
            rainCols.length = 0;
            const rng = S.createRng();
            const n = getRainCount();
            const gap = Math.max(10, S.width / n);
            for (let i = 0; i < n; i++) {
                const len = 8 + ((rng.next() * 10) | 0);
                const glyphs = [];
                for (let g = 0; g < len; g++) {
                    glyphs.push(RAIN_GLYPHS.charAt((rng.next() * RAIN_GLYPHS.length) | 0));
                }
                rainCols.push({
                    x: (i + 0.5) * gap + (rng.next() - 0.5) * 6,
                    y: rng.next() * S.height,
                    speed: 1.1 + rng.next() * 1.8,
                    glyphs,
                    head: rng.next() < 0.2,
                });
            }
        };

        const adjustRain = () => {
            if (Math.abs(rainCols.length - getRainCount()) > 2) {
                initRain();
            }
        };

        const tickRain = (frame, animate) => {
            const speed = S.params.rain.speed;
            const lenMul = S.params.rain.length;
            S.ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
            S.ctx.textAlign = "center";
            S.ctx.textBaseline = "top";
            for (let i = 0; i < rainCols.length; i++) {
                const col = rainCols[i];
                if (animate) {
                    col.y += col.speed * speed * frame * 1.8;
                }
                const step = 14 * lenMul;
                const total = col.glyphs.length * step;
                if (col.y - total > S.height) {
                    col.y = -(Math.random() * 80 + 20);
                }
                for (let g = 0; g < col.glyphs.length; g++) {
                    const gy = col.y - g * step;
                    if (gy < -16 || gy > S.height + 16) {
                        continue;
                    }
                    const head = g === 0;
                    S.ctx.globalAlpha = head ? 0.85 : Math.max(0.12, 0.55 - g * 0.06);
                    S.ctx.fillStyle = head || col.head ? S.accentColorStr : S.particleColorStr;
                    S.ctx.fillText(col.glyphs[g], col.x, gy);
                }
            }
        };


        return {
            clear() {
                netParticles.length = 0;
                orbitSystems.length = 0;
                stars.length = 0;
                epicycles.length = 0;
                harmonics.length = 0;
                auroraLayers.length = 0;
                pendulums.length = 0;
                crystals.length = 0;
                boids.length = 0;
                fieldParticles.length = 0;
                rainCols.length = 0;
            },
            init(mode) {
                if (mode === "network") initNetwork();
                else if (mode === "orbits") initOrbits();
                else if (mode === "stars") initStars();
                else if (mode === "epicycles") initEpicycles();
                else if (mode === "harmonograph") initHarmonics();
                else if (mode === "aurora") initAurora();
                else if (mode === "pendulum") initPendulums();
                else if (mode === "crystal") initCrystals();
                else if (mode === "flock") initFlock();
                else if (mode === "field") initField();
                else if (mode === "rain") initRain();
            },
            adjust(mode, previousWidth, previousDocHeight) {
                if (mode === "network") adjustNetwork(previousWidth, previousDocHeight);
                else if (mode === "orbits") adjustOrbits(previousWidth, previousDocHeight);
                else if (mode === "stars") adjustStars();
                else if (mode === "epicycles") adjustEpicycles(previousWidth, previousDocHeight);
                else if (mode === "harmonograph") adjustHarmonics(previousWidth, previousDocHeight);
                else if (mode === "aurora") adjustAurora();
                else if (mode === "pendulum") adjustPendulums(previousWidth, previousDocHeight);
                else if (mode === "crystal") adjustCrystals(previousWidth, previousDocHeight);
                else if (mode === "flock") adjustFlock(previousWidth, previousDocHeight);
                else if (mode === "field") adjustField(previousWidth, previousDocHeight);
                else if (mode === "rain") adjustRain();
            },
            tick(mode, frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
                if (mode === "network") tickNetwork(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
                else if (mode === "orbits") tickOrbits(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
                else if (mode === "stars") tickStars(frame, animate);
                else if (mode === "epicycles") tickEpicycles(frame, scrollY, viewHeight, animate);
                else if (mode === "harmonograph") tickHarmonics(frame, scrollY, viewHeight, animate);
                else if (mode === "aurora") tickAurora(frame, animate);
                else if (mode === "pendulum") tickPendulums(frame, scrollY, viewHeight, animate);
                else if (mode === "crystal") tickCrystals(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
                else if (mode === "flock") tickFlock(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
                else if (mode === "field") tickField(frame, scrollY, viewHeight, animate);
                else if (mode === "rain") tickRain(frame, animate);
            },
            hitTest(mode, absX, absY) {
                if (mode === "stars" || mode === "aurora" || mode === "rain" || mode === "harmonograph" || mode === "epicycles" || mode === "field") {
                    return null;
                }
                if (mode === "network") {
                    let best = null;
                    let bestD = 22 * 22;
                    for (let i = 0; i < netParticles.length; i++) {
                        const p = netParticles[i];
                        const dx = p.x - absX;
                        const dy = p.y - absY;
                        const d = dx * dx + dy * dy;
                        if (d < bestD) {
                            bestD = d;
                            best = p;
                        }
                    }
                    return best;
                }
                if (mode === "orbits") {
                    let best = null;
                    let bestD = 1e9;
                    for (let i = 0; i < orbitSystems.length; i++) {
                        const sys = orbitSystems[i];
                        const dx = sys.x - absX;
                        const dy = sys.y - absY;
                        const r = sys.radius * S.params.orbits.spread * 0.7 + 14;
                        const d = dx * dx + dy * dy;
                        if (d < r * r && d < bestD) {
                            bestD = d;
                            best = sys;
                        }
                    }
                    return best;
                }
                if (mode === "crystal") {
                    let best = null;
                    let bestD = 1e9;
                    for (let i = 0; i < crystals.length; i++) {
                        const c = crystals[i];
                        const dx = c.x - absX;
                        const dy = c.y - absY;
                        const r = 36 * c.scale * S.params.crystal.size + 12;
                        const d = dx * dx + dy * dy;
                        if (d < r * r && d < bestD) {
                            bestD = d;
                            best = c;
                        }
                    }
                    return best;
                }
                if (mode === "flock") {
                    let best = null;
                    let bestD = 18 * 18;
                    for (let i = 0; i < boids.length; i++) {
                        const b = boids[i];
                        const d = (b.x - absX) * (b.x - absX) + (b.y - absY) * (b.y - absY);
                        if (d < bestD) {
                            bestD = d;
                            best = b;
                        }
                    }
                    return best;
                }
                return null;
            },
            blast(mode, rng, blastItem) {
                if (mode === "network") {
                    for (let i = 0; i < netParticles.length; i++) blastItem(netParticles[i]);
                    return true;
                }
                if (mode === "orbits") {
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
                }
                if (mode === "stars") {
                    for (let i = 0; i < stars.length; i++) {
                        stars[i].z = Math.max(0.05, stars[i].z - rng.next() * 0.35);
                        stars[i].hot = rng.next() < 0.35 || stars[i].hot;
                    }
                    return true;
                }
                if (mode === "epicycles") {
                    for (let i = 0; i < epicycles.length; i++) {
                        const sys = epicycles[i];
                        for (let a = 0; a < sys.arms.length; a++) {
                            sys.arms[a].p += (rng.next() - 0.5) * 1.8;
                            sys.arms[a].w += (rng.next() - 0.5) * 0.01;
                        }
                        sys.path.length = 0;
                    }
                    return true;
                }
                if (mode === "harmonograph") {
                    for (let i = 0; i < harmonics.length; i++) {
                        harmonics[i].t = 0;
                        harmonics[i].path.length = 0;
                        harmonics[i].wx *= 0.7 + rng.next() * 0.6;
                        harmonics[i].wy *= 0.7 + rng.next() * 0.6;
                    }
                    return true;
                }
                if (mode === "aurora") {
                    for (let i = 0; i < auroraLayers.length; i++) {
                        auroraLayers[i].p1 += (rng.next() - 0.5) * 2;
                        auroraLayers[i].p2 += (rng.next() - 0.5) * 2;
                    }
                    return true;
                }
                if (mode === "pendulum") {
                    for (let i = 0; i < pendulums.length; i++) {
                        blastItem(pendulums[i], (p, force) => {
                            p.w1 += (rng.next() - 0.5) * force * 0.18;
                            p.w2 += (rng.next() - 0.5) * force * 0.22;
                        });
                    }
                    return true;
                }
                if (mode === "crystal") {
                    for (let i = 0; i < crystals.length; i++) {
                        blastItem(crystals[i], (c, force) => {
                            c.rotVx += (rng.next() - 0.5) * force * 0.08;
                            c.rotVy += (rng.next() - 0.5) * force * 0.1;
                            c.highlight = Math.min(1, c.highlight + force);
                        });
                    }
                    return true;
                }
                if (mode === "flock") {
                    for (let i = 0; i < boids.length; i++) blastItem(boids[i]);
                    return true;
                }
                if (mode === "field") {
                    for (let i = 0; i < fieldParticles.length; i++) {
                        const p = fieldParticles[i];
                        p.x += (rng.next() - 0.5) * 40;
                        p.y += (rng.next() - 0.5) * 40;
                    }
                    return true;
                }
                if (mode === "rain") {
                    for (let i = 0; i < rainCols.length; i++) {
                        rainCols[i].speed += rng.next() * 2.2;
                        rainCols[i].y += rng.next() * 40;
                    }
                    return true;
                }
                return false;
            },
        };
    };
})(window);
