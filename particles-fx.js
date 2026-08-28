(function (root) {
    "use strict";

    root.ParticleBG = root.ParticleBG || {};

    root.ParticleBG.createFx = function (S) {
        const netParticles = [];
        const orbitSystems = [];
        const orbitDrawBuf = [];
        const stars = [];
        let starWarp = 0;
        const epicycles = [];
        const harmonics = [];
        const auroraLayers = [];
        const auroraRumples = [];
        const pendulums = [];
        const crystals = [];
        const boids = [];
        const fieldParticles = [];
        const fieldGusts = [];
        let fieldTime = 0;
        const rainCols = [];
        let rainRows = 0;
        let rainCell = 15;
        const PATH_CAP = 360;
        let quietSpawn = false;
        const netGrid = {
            cellSize: 88,
            cols: 1,
            rows: 1,
            cells: [[]],
            occupied: [],
        };
        const flockGrid = {
            cellSize: 92,
            cols: 1,
            rows: 1,
            cells: [[]],
            occupied: [],
        };

        const bounceBounds = (item, pad) => {
            const p = pad == null ? 24 : pad;
            if (typeof item.vx !== "number" || typeof item.vy !== "number") {
                return;
            }
            if (item.x < p) {
                item.x = p;
                if (item.vx < 0) {
                    item.vx = -item.vx * 0.85;
                }
            } else if (item.x > S.width - p) {
                item.x = S.width - p;
                if (item.vx > 0) {
                    item.vx = -item.vx * 0.85;
                }
            }
            if (item.y < p) {
                item.y = p;
                if (item.vy < 0) {
                    item.vy = -item.vy * 0.85;
                }
            } else if (item.y > S.docHeight - p) {
                item.y = S.docHeight - p;
                if (item.vy > 0) {
                    item.vy = -item.vy * 0.85;
                }
            }
        };

        const separateBodies = (items, radiusOf, frame, strength) => {
            const n = items.length;
            if (n < 2) {
                return;
            }
            const force = strength == null ? 0.42 : strength;
            for (let i = 0; i < n; i++) {
                const a = items[i];
                if (a.dragging) {
                    continue;
                }
                const ra = radiusOf(a);
                for (let j = i + 1; j < n; j++) {
                    const b = items[j];
                    if (b.dragging) {
                        continue;
                    }
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const min = ra + radiusOf(b);
                    const distSq = dx * dx + dy * dy;
                    if (distSq >= min * min) {
                        continue;
                    }
                    let dist = Math.sqrt(distSq);
                    let nx;
                    let ny;
                    if (distSq < 0.0001) {
                        const ang = (i + 1) * 2.399963 + j;
                        nx = Math.cos(ang);
                        ny = Math.sin(ang);
                        dist = 0.01;
                    } else {
                        nx = dx / dist;
                        ny = dy / dist;
                    }
                    const overlap = (min - dist) / min;
                    const push = overlap * overlap * force * frame;
                    const px = nx * push;
                    const py = ny * push;
                    a.x += px;
                    a.y += py;
                    b.x -= px;
                    b.y -= py;
                    if (typeof a.vx === "number" && typeof b.vx === "number") {
                        a.vx += px * 0.22;
                        a.vy += py * 0.22;
                        b.vx -= px * 0.22;
                        b.vy -= py * 0.22;
                    }
                }
            }
        };

        const placeApart = (items, radiusOf, rng) => {
            for (let i = 0; i < items.length; i++) {
                const a = items[i];
                const ra = radiusOf(a);
                const pad = Math.max(18, Math.min(ra, 56));
                for (let attempt = 0; attempt < 16; attempt++) {
                    let ok = true;
                    for (let j = 0; j < i; j++) {
                        const b = items[j];
                        const dx = a.x - b.x;
                        const dy = a.y - b.y;
                        const need = ra + radiusOf(b);
                        if (dx * dx + dy * dy < need * need) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        break;
                    }
                    a.x = pad + rng.next() * Math.max(1, S.width - pad * 2);
                    a.y = pad + rng.next() * Math.max(1, S.docHeight - pad * 2);
                }
            }
        };

        const nearestHit = (items, absX, absY, radiusOf, minR) => {
            let best = null;
            let bestD = 1e9;
            const floorR = minR == null ? 18 : minR;
            for (let i = 0; i < items.length; i++) {
                const it = items[i];
                const dx = it.x - absX;
                const dy = it.y - absY;
                const r = Math.max(floorR, radiusOf ? radiusOf(it) : floorR);
                const d = dx * dx + dy * dy;
                if (d < r * r && d < bestD) {
                    bestD = d;
                    best = it;
                }
            }
            return best;
        };

        const rebuildHashGrid = (grid, items, cellSize, getXY) => {
            const cell = cellSize || grid.cellSize;
            grid.cellSize = cell;
            grid.cols = Math.max(1, Math.ceil(S.width / cell));
            grid.rows = Math.max(1, Math.ceil(S.docHeight / cell));
            const count = grid.cols * grid.rows;
            if (grid.cells.length !== count) {
                grid.cells = new Array(count);
                for (let i = 0; i < count; i++) {
                    grid.cells[i] = [];
                }
            } else {
                for (let i = 0; i < grid.occupied.length; i++) {
                    grid.cells[grid.occupied[i]].length = 0;
                }
            }
            grid.occupied.length = 0;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const pos = getXY ? getXY(item) : item;
                let cx = (pos.x / cell) | 0;
                let cy = (pos.y / cell) | 0;
                if (cx < 0) cx = 0;
                else if (cx >= grid.cols) cx = grid.cols - 1;
                if (cy < 0) cy = 0;
                else if (cy >= grid.rows) cy = grid.rows - 1;
                const index = cy * grid.cols + cx;
                if (grid.cells[index].length === 0) {
                    grid.occupied.push(index);
                }
                grid.cells[index].push(item);
            }
        };

        const getNetworkCount = () => {
            if (!S.enabled) {
                return 0;
            }
            const area = S.width * S.docHeight;
            const mobile = S.width < S.MOBILE_BREAKPOINT ? 0.5 : 1;
            const density = 0.00017 * S.params.network.density * (S.reducedMotion ? 0.38 : 1) * mobile;
            return Math.min(1600, Math.max(S.reducedMotion ? 40 : 70, Math.floor(area * density)));
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
            const fadeIn = !quietSpawn && !S.reducedMotion;
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
                const perView = S.reducedMotion ? 5 : 8;
                return Math.min(96, Math.max(2, Math.round(perView * pages * densityMul)));
            }
            const area = S.width * S.docHeight;
            const density = 0.000032 * (S.reducedMotion ? 0.45 : 1) * densityMul;
            return Math.min(220, Math.max(S.reducedMotion ? 6 : 10, Math.floor(area * density)));
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


        const tickNetwork = (frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
            const connectDist = 68 * S.params.network.links;
            const connectSq = connectDist * connectDist;
            const hoverConnect = 86 * S.params.network.links;
            const hoverSq = hoverConnect * hoverConnect;
            const sep = 62;
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
                            const push = f * f * 0.28 * frame * S.params.network.mouse;
                            p.vx += (dx / dist) * push;
                            p.vy += (dy / dist) * push;
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
                            if (distSq < sepSq && !p1.dragging && !p2.dragging) {
                                let dist = Math.sqrt(Math.max(distSq, 0.0001));
                                let nx;
                                let ny;
                                if (distSq < 0.0001) {
                                    const ang = (p1.id + 1) * 2.399963 + p2.id;
                                    nx = Math.cos(ang);
                                    ny = Math.sin(ang);
                                } else {
                                    nx = dx / dist;
                                    ny = dy / dist;
                                }
                                const overlap = (sep - dist) / sep;
                                const push = (overlap * 0.7 + overlap * overlap * 1.8) * frame;
                                p1.x += nx * push;
                                p1.y += ny * push;
                                p2.x -= nx * push;
                                p2.y -= ny * push;
                                p1.vx += nx * push * 0.4;
                                p1.vy += ny * push * 0.4;
                                p2.vx -= nx * push * 0.4;
                                p2.vy -= ny * push * 0.4;
                            }
                            if (distSq >= maxSq || distSq < 0.01) {
                                continue;
                            }
                            const dist = Math.sqrt(distSq);
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
            }
            if (animate) {
                separateBodies(orbitSystems, (sys) => sys.radius * spread * 0.58, frame, 0.52);
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
            const n = Math.floor(520 * S.params.stars.density * mobile * (S.reducedMotion ? 0.4 : 1));
            return Math.min(1200, Math.max(S.reducedMotion ? 50 : 90, n));
        };

        const resetStar = (star, rng, fromFar) => {
            star.x = rng.next() * 1.9 - 0.95;
            star.y = rng.next() * 1.5 - 0.75;
            star.z = fromFar ? 1 : rng.next() * 0.82 + 0.16;
            star.pz = star.z;
            star.hot = rng.next() < 0.08;
            star.boost = 0;
            star.sx = 0;
            star.sy = 0;
            return star;
        };

        const initStars = () => {
            stars.length = 0;
            starWarp = 0;
            const rng = S.createRng();
            const count = getStarCount();
            for (let i = 0; i < count; i++) {
                stars.push(resetStar({ x: 0, y: 0, z: 1, pz: 1, hot: false, sx: 0, sy: 0 }, rng, false));
            }
        };

        const adjustStars = () => {
            const target = getStarCount();
            const rng = S.createRng();
            if (stars.length < target) {
                while (stars.length < target) {
                    stars.push(resetStar({ x: 0, y: 0, z: 1, pz: 1, hot: false, boost: 0, sx: 0, sy: 0 }, rng, false));
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
                if (star.z <= 0.045) {
                    resetStar(star, rng, true);
                }
                const k = focal / star.z;
                const x = cx + star.x * k;
                const y = cy + star.y * k;
                star.sx = x;
                star.sy = y;
                if (x < -40 || x > S.width + 40 || y < -40 || y > S.height + 40) {
                    if (animate) {
                        resetStar(star, rng, true);
                    }
                    continue;
                }
                const depth = 1 - star.z;
                S.ctx.globalAlpha = 0.32 + depth * 0.68;
                if (streak > 0.04 && animate) {
                    const pk = focal / Math.max(star.pz, star.z);
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
            if (path.length >= 2) {
                const dx = x - path[path.length - 2];
                const dy = y - path[path.length - 1];
                if (dx * dx + dy * dy > 90 * 90) {
                    path.length = 0;
                }
            }
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
            const minN = Math.max(1, Math.round(perView * (S.reducedMotion ? 0.2 : 0.28)));
            return Math.min(maxTotal, Math.max(minN, n));
        };

        const getEpicycleCount = () => pagesCount(12, 240, S.params.epicycles.density);
        const getHarmonicCount = () => pagesCount(12, 220, S.params.harmonograph.density);
        const getPendulumCount = () => pagesCount(11, 200, S.params.pendulum.density);
        const getCrystalCount = () => pagesCount(14, 240, S.params.crystal.density);
        const getFlockCount = () => pagesCount(110, 1400, S.params.flock.density);
        const getFieldCount = () => pagesCount(170, 2000, S.params.field.density);
        const getAuroraCount = () => Math.min(28, Math.max(3, Math.round(10 * S.params.aurora.density * (S.reducedMotion ? 0.5 : 1))));
        const getRainCount = () => Math.min(280, Math.max(10, Math.round((S.width / 12) * S.params.rain.density * (S.width < S.MOBILE_BREAKPOINT ? 0.7 : 1))));

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
                    bounceBounds(sys, Math.max(24, sys.radius * 0.25));
                }
            }
            if (animate) {
                separateBodies(epicycles, (sys) => sys.radius * 0.5 + 16, frame, 0.48);
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

        const initHarmonics = () => {
            harmonics.length = 0;
            const rng = S.createRng();
            const n = getHarmonicCount();
            for (let i = 0; i < n; i++) {
                harmonics.push({
                    x: 40 + rng.next() * Math.max(1, S.width - 80),
                    y: 40 + rng.next() * Math.max(1, S.docHeight - 80),
                    vx: (rng.next() - 0.5) * 0.07,
                    vy: (rng.next() - 0.5) * 0.07,
                    ax: 40 + rng.next() * 70,
                    ay: 30 + rng.next() * 55,
                    wx: 0.011 + rng.next() * 0.02,
                    wy: 0.013 + rng.next() * 0.022,
                    px: rng.next() * Math.PI * 2,
                    py: rng.next() * Math.PI * 2,
                    t: rng.next() * 18,
                    kick: 0,
                    unwind: 0,
                    path: [],
                    accent: rng.next() < 0.45,
                    dragging: false,
                });
            }
            placeApart(harmonics, (h) => Math.max(h.ax, h.ay) + 16, rng);
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
                if (animate && !h.dragging) {
                    h.vx *= Math.pow(0.985, frame);
                    h.vy *= Math.pow(0.985, frame);
                    const mag = Math.hypot(h.vx, h.vy);
                    if (mag > 0.55) {
                        h.vx = (h.vx / mag) * 0.55;
                        h.vy = (h.vy / mag) * 0.55;
                    }
                    h.x += h.vx * frame;
                    h.y += h.vy * frame;
                    bounceBounds(h, Math.max(h.ax, h.ay) * 0.55 + 16);
                }
            }
            if (animate) {
                separateBodies(harmonics, () => 26, frame, 0.32);
            }
            for (let i = 0; i < harmonics.length; i++) {
                const h = harmonics[i];
                if (animate) {
                    if (h.unwind > 0.002 && h.t > 55) {
                        h.t += (55 - h.t) * (1 - Math.pow(0.88, frame * h.unwind));
                        h.unwind *= Math.pow(0.91, frame);
                    } else {
                        h.unwind = 0;
                    }
                    h.t += speed * frame;
                    h.kick *= Math.pow(0.985, frame);
                    if (h.kick < 0.002) {
                        h.kick = 0;
                    }
                    const amp = Math.min(1.15, Math.exp(-decay * h.t) + (h.kick || 0));
                    h.penX = h.x + Math.sin(h.wx * h.t + h.px) * h.ax * amp;
                    h.penY = h.y + Math.sin(h.wy * h.t + h.py) * h.ay * amp;
                    if (amp > 0.02) {
                        pushPath(h.path, h.penX, h.penY, PATH_CAP);
                    }
                }
                const vis = h.y - scrollY;
                const pad = Math.max(h.ax, h.ay) + 28;
                if (vis < -pad || vis > viewHeight + pad) {
                    continue;
                }
                drawFadePath(h.path, h.accent ? S.accentColorStr : S.particleColorStr, 0.5, 1.05, scrollY);
            }
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
                for (let x = 0; x <= S.width; x += 5) {
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

        const tickPendulums = (frame, scrollY, viewHeight, animate) => {
            const speed = S.params.pendulum.speed;
            const g = 0.28 * S.params.pendulum.energy;
            const dt = 0.16 * frame * speed;
            for (let i = 0; i < pendulums.length; i++) {
                const p = pendulums[i];
                if (animate && !p.dragging) {
                    p.x += p.vx * frame;
                    p.y += p.vy * frame;
                    bounceBounds(p, p.l1 + p.l2 + 8);
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
                            if (distSq >= bobRSq || distSq < 0.01) {
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
            }
            for (let i = 0; i < pendulums.length; i++) {
                const p = pendulums[i];
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
                    vx: (rng.next() - 0.5) * 0.09,
                    vy: (rng.next() - 0.5) * 0.09,
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
            }
            if (animate) {
                separateBodies(crystals, (c) => 32 * c.scale * size + 12, frame, 0.5);
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
                rebuildHashGrid(flockGrid, boids, 92);
                const cell = flockGrid.cellSize;
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
                    let bx = (b.x / cell) | 0;
                    let by = (b.y / cell) | 0;
                    if (bx < 0) bx = 0;
                    else if (bx >= flockGrid.cols) bx = flockGrid.cols - 1;
                    if (by < 0) by = 0;
                    else if (by >= flockGrid.rows) by = flockGrid.rows - 1;
                    const xMin = bx > 0 ? bx - 1 : 0;
                    const xMax = bx + 1 < flockGrid.cols ? bx + 1 : flockGrid.cols - 1;
                    const yMin = by > 0 ? by - 1 : 0;
                    const yMax = by + 1 < flockGrid.rows ? by + 1 : flockGrid.rows - 1;
                    for (let ny = yMin; ny <= yMax; ny++) {
                        for (let nx = xMin; nx <= xMax; nx++) {
                            const bucket = flockGrid.cells[ny * flockGrid.cols + nx];
                            for (let c = 0; c < bucket.length; c++) {
                                const o = bucket[c];
                                if (o === b) {
                                    continue;
                                }
                                const dx = o.x - b.x;
                                const dy = o.y - b.y;
                                const dSq = dx * dx + dy * dy;
                                if (dSq > 90 * 90 || dSq < 0.01) {
                                    continue;
                                }
                                const d = Math.sqrt(dSq);
                                n += 1;
                                ax += o.vx;
                                ay += o.vy;
                                cx += o.x;
                                cy += o.y;
                                if (d < 26) {
                                    const push = (26 - d) / 26;
                                    sx -= (dx / d) * (0.7 + push * 1.8);
                                    sy -= (dy / d) * (0.7 + push * 1.8);
                                }
                            }
                        }
                    }
                    if (n > 0) {
                        ax = ax / n - b.vx;
                        ay = ay / n - b.vy;
                        cx = cx / n - b.x;
                        cy = cy / n - b.y;
                        b.vx += ax * 0.04 * coh + cx * 0.003 * coh + sx * 0.16;
                        b.vy += ay * 0.04 * coh + cy * 0.003 * coh + sy * 0.16;
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
            return { fx: gy, fy: -gx };
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
                    p.life += frame;
                    let wrapped = false;
                    if (p.x < 0) {
                        p.x += S.width;
                        wrapped = true;
                    } else if (p.x > S.width) {
                        p.x -= S.width;
                        wrapped = true;
                    }
                    if (p.y < 0) {
                        p.y += S.docHeight;
                        wrapped = true;
                    } else if (p.y > S.docHeight) {
                        p.y -= S.docHeight;
                        wrapped = true;
                    }
                    if (p.life > p.maxLife) {
                        p.x = Math.random() * S.width;
                        p.y = Math.random() * S.docHeight;
                        p.vx = 0;
                        p.vy = 0;
                        p.life = 0;
                        p.maxLife = 90 + Math.random() * 110;
                        resetFieldPath(p);
                    } else if (wrapped || Math.abs(p.x - ox) > 70 || Math.abs(p.y - oy) > 70) {
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

        const RAIN_GLYPHS = "0123456789ABCDEF<>/\\|=+*#$%-.:";
        const rainGlyph = (rng) => RAIN_GLYPHS.charAt(((rng ? rng.next() : Math.random()) * RAIN_GLYPHS.length) | 0);

        const rainStamp = (col, row, life) => {
            if (row < 0 || row >= col.glyphs.length) {
                return;
            }
            col.glyphs[row] = rainGlyph();
            col.life[row] = life == null ? 1 : life;
        };

        const initRain = () => {
            rainCols.length = 0;
            const rng = S.createRng();
            rainCell = 15;
            rainRows = Math.max(10, Math.ceil(S.height / rainCell) + 1);
            const n = getRainCount();
            const gap = Math.max(rainCell, S.width / Math.max(n, 1));
            for (let i = 0; i < n; i++) {
                const glyphs = new Array(rainRows);
                const life = new Float32Array(rainRows);
                for (let r = 0; r < rainRows; r++) {
                    glyphs[r] = rainGlyph(rng);
                    life[r] = 0;
                }
                const head = rng.next() * (rainRows + 8) - 4;
                const trail = 14 + ((rng.next() * 16) | 0);
                const headRow = Math.floor(head);
                for (let t = 0; t < trail; t++) {
                    const row = headRow - t;
                    if (row >= 0 && row < rainRows) {
                        glyphs[row] = rainGlyph(rng);
                        life[row] = Math.max(0.08, 1 - t / trail);
                    }
                }
                rainCols.push({
                    x: (i + 0.5) * gap,
                    glyphs,
                    life,
                    head,
                    speed: 0.16 + rng.next() * 0.24,
                    accent: rng.next() < 0.28,
                    wait: 0,
                });
            }
        };

        const adjustRain = () => {
            const rows = Math.max(10, Math.ceil(S.height / rainCell) + 1);
            if (rainCols.length !== getRainCount() || rainRows !== rows) {
                initRain();
            }
        };

        const tickRain = (frame, animate) => {
            const speedMul = S.params.rain.speed;
            const lenMul = Math.max(0.35, S.params.rain.length);
            const cell = rainCell;
            const rows = rainRows;
            const decay = Math.pow(0.9, frame / lenMul);
            S.ctx.font = "13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
            S.ctx.textAlign = "center";
            S.ctx.textBaseline = "top";
            for (let i = 0; i < rainCols.length; i++) {
                const col = rainCols[i];
                if (animate) {
                    if (col.wait > 0) {
                        col.wait -= frame;
                    } else {
                        const prev = col.head;
                        col.head += col.speed * speedMul * frame * 1.7;
                        const from = Math.floor(prev);
                        const to = Math.floor(col.head);
                        if (to > from) {
                            for (let r = from + 1; r <= to; r++) {
                                rainStamp(col, r, 1);
                            }
                        }
                        if (col.head >= rows) {
                            col.head = -4 - Math.random() * 12;
                            col.wait = 1.5 + Math.random() * 9;
                            col.speed = 0.16 + Math.random() * 0.24;
                        }
                    }
                    const flicker = 0.035 * frame;
                    for (let r = 0; r < rows; r++) {
                        const a = col.life[r];
                        if (a <= 0) {
                            continue;
                        }
                        const next = a * decay;
                        col.life[r] = next < 0.03 ? 0 : next;
                        if (next > 0.08 && Math.random() < flicker) {
                            col.glyphs[r] = rainGlyph();
                        }
                    }
                }
                const headRow = Math.floor(col.head);
                for (let r = 0; r < rows; r++) {
                    const a = col.life[r];
                    if (a <= 0) {
                        continue;
                    }
                    const gy = r * cell;
                    if (gy > S.height + 4) {
                        continue;
                    }
                    const isHead = r === headRow && col.wait <= 0;
                    S.ctx.globalAlpha = isHead ? Math.min(0.92, 0.55 + a * 0.4) : 0.12 + a * 0.5;
                    S.ctx.fillStyle = isHead || (col.accent && a > 0.72) ? S.accentColorStr : S.particleColorStr;
                    S.ctx.fillText(col.glyphs[r], col.x, gy);
                }
            }
        };

        const LIFE_GLIDER = [
            [0, 1],
            [1, 2],
            [2, 0],
            [2, 1],
            [2, 2],
        ];
        const LIFE_RPENT = [
            [1, 0],
            [2, 0],
            [0, 1],
            [1, 1],
            [1, 2],
        ];
        const LIFE_LWSS = [
            [0, 1],
            [0, 3],
            [1, 0],
            [2, 0],
            [3, 0],
            [3, 3],
            [4, 0],
            [4, 1],
            [4, 2],
        ];
        const life = {
            cols: 0,
            rows: 0,
            cur: null,
            next: null,
            age: null,
            acc: 0,
        };

        const lifeCellSize = () => {
            const size = (S.params.life && S.params.life.size) || 1;
            return Math.max(5, Math.round(10 / Math.max(0.45, size)));
        };

        const lifeIndex = (x, y) => {
            const cols = life.cols;
            const rows = life.rows;
            let gx = x % cols;
            let gy = y % rows;
            if (gx < 0) gx += cols;
            if (gy < 0) gy += rows;
            return gy * cols + gx;
        };

        const lifeSet = (x, y, alive) => {
            if (!life.cur) {
                return;
            }
            const i = lifeIndex(x, y);
            life.cur[i] = alive ? 1 : 0;
            if (alive) {
                life.age[i] = 1;
            }
        };

        const stampLife = (pattern, ox, oy, rot) => {
            for (let i = 0; i < pattern.length; i++) {
                let px = pattern[i][0];
                let py = pattern[i][1];
                if (rot === 1) {
                    const t = px;
                    px = -py;
                    py = t;
                } else if (rot === 2) {
                    px = -px;
                    py = -py;
                } else if (rot === 3) {
                    const t = px;
                    px = py;
                    py = -t;
                }
                lifeSet(ox + px, oy + py, true);
            }
        };

        const seedLife = () => {
            if (!life.cur) {
                return;
            }
            const rng = S.createRng();
            const n = life.cols * life.rows;
            const fill = Math.min(0.32, 0.11 * S.params.life.density);
            life.cur.fill(0);
            life.age.fill(0);
            for (let i = 0; i < n; i++) {
                if (rng.next() < fill) {
                    life.cur[i] = 1;
                    life.age[i] = 1 + ((rng.next() * 10) | 0);
                }
            }
            const stamps = 6 + ((rng.next() * 8 * S.params.life.density) | 0);
            for (let s = 0; s < stamps; s++) {
                const ox = (rng.next() * life.cols) | 0;
                const oy = (rng.next() * life.rows) | 0;
                const rot = (rng.next() * 4) | 0;
                const pick = rng.next();
                if (pick < 0.4) {
                    stampLife(LIFE_GLIDER, ox, oy, rot);
                } else if (pick < 0.75) {
                    stampLife(LIFE_RPENT, ox, oy, rot);
                } else {
                    stampLife(LIFE_LWSS, ox, oy, rot);
                }
            }
            life.acc = 0;
        };

        const rebuildLife = (reseed) => {
            const cell = lifeCellSize();
            const cols = Math.max(24, Math.ceil(S.width / cell));
            const rows = Math.max(16, Math.ceil(S.height / cell));
            if (!reseed && life.cur && life.cols === cols && life.rows === rows) {
                return;
            }
            life.cols = cols;
            life.rows = rows;
            const n = cols * rows;
            life.cur = new Uint8Array(n);
            life.next = new Uint8Array(n);
            life.age = new Uint8Array(n);
            seedLife();
        };

        const initLife = () => {
            rebuildLife(true);
        };

        const adjustLife = () => {
            rebuildLife(false);
        };

        const stepLife = () => {
            const cols = life.cols;
            const rows = life.rows;
            const cur = life.cur;
            const next = life.next;
            const age = life.age;
            for (let y = 0; y < rows; y++) {
                const y0 = y === 0 ? rows - 1 : y - 1;
                const y2 = y === rows - 1 ? 0 : y + 1;
                const r0 = y0 * cols;
                const r1 = y * cols;
                const r2 = y2 * cols;
                for (let x = 0; x < cols; x++) {
                    const x0 = x === 0 ? cols - 1 : x - 1;
                    const x2 = x === cols - 1 ? 0 : x + 1;
                    const neighbors =
                        cur[r0 + x0] +
                        cur[r0 + x] +
                        cur[r0 + x2] +
                        cur[r1 + x0] +
                        cur[r1 + x2] +
                        cur[r2 + x0] +
                        cur[r2 + x] +
                        cur[r2 + x2];
                    const i = r1 + x;
                    const alive = cur[i];
                    const live = alive ? neighbors === 2 || neighbors === 3 : neighbors === 3;
                    next[i] = live ? 1 : 0;
                    if (live) {
                        age[i] = alive ? (age[i] < 254 ? age[i] + 1 : 254) : 1;
                    } else {
                        age[i] = 0;
                    }
                }
            }
            life.cur = next;
            life.next = cur;
        };

        const stampLifeAt = (px, py, rng) => {
            if (!life.cur || life.cols < 2) {
                return;
            }
            const gx = Math.round((px / Math.max(S.width, 1)) * life.cols);
            const gy = Math.round((py / Math.max(S.height, 1)) * life.rows);
            const rot = (rng.next() * 4) | 0;
            stampLife(LIFE_RPENT, gx, gy, rot);
            stampLife(LIFE_GLIDER, gx + 4, gy - 2, rot);
            const soup = 8 + ((rng.next() * 10) | 0);
            for (let i = 0; i < soup; i++) {
                lifeSet(gx + ((rng.next() * 7) | 0) - 3, gy + ((rng.next() * 7) | 0) - 3, true);
            }
            if (rng.next() < 0.45) {
                stampLife(LIFE_LWSS, gx - 6, gy + 3, (rot + 1) & 3);
            }
        };

        const tickLife = (frame, animate) => {
            if (!life.cur) {
                initLife();
            }
            if (animate) {
                life.acc += frame * S.params.life.speed;
                while (life.acc >= 7.5) {
                    life.acc -= 7.5;
                    stepLife();
                }
            }
            const cols = life.cols;
            const rows = life.rows;
            const cur = life.cur;
            const age = life.age;
            const cw = S.width / cols;
            const ch = S.height / rows;
            const pad = Math.max(1, Math.min(cw, ch) * 0.12);
            for (let y = 0; y < rows; y++) {
                const row = y * cols;
                const y0 = (y * ch + pad) | 0;
                const y1 = ((y + 1) * ch - pad) | 0;
                const h = Math.max(1, y1 - y0);
                for (let x = 0; x < cols; x++) {
                    const i = row + x;
                    if (!cur[i]) {
                        continue;
                    }
                    const x0 = (x * cw + pad) | 0;
                    const x1 = ((x + 1) * cw - pad) | 0;
                    const w = Math.max(1, x1 - x0);
                    const young = age[i] < 6;
                    S.ctx.globalAlpha = young ? 0.72 : 0.28 + Math.min(0.34, age[i] * 0.012);
                    S.ctx.fillStyle = young ? S.accentColorStr : S.particleColorStr;
                    S.ctx.fillRect(x0, y0, w, h);
                }
            }
        };

        return {
            clear() {
                netParticles.length = 0;
                orbitSystems.length = 0;
                stars.length = 0;
                starWarp = 0;
                epicycles.length = 0;
                harmonics.length = 0;
                auroraLayers.length = 0;
                auroraRumples.length = 0;
                pendulums.length = 0;
                crystals.length = 0;
                boids.length = 0;
                fieldParticles.length = 0;
                fieldGusts.length = 0;
                fieldTime = 0;
                rainCols.length = 0;
                life.cur = null;
                life.next = null;
                life.age = null;
                life.cols = 0;
                life.rows = 0;
                life.acc = 0;
            },
            init(mode, opts) {
                quietSpawn = !!(opts && opts.quiet);
                try {
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
                    else if (mode === "life") initLife();
                } finally {
                    quietSpawn = false;
                }
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
                else if (mode === "life") adjustLife();
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
                else if (mode === "field") tickField(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
                else if (mode === "rain") tickRain(frame, animate);
                else if (mode === "life") tickLife(frame, animate);
            },
            hitTest(mode, absX, absY) {
                if (mode === "stars" || mode === "aurora" || mode === "rain" || mode === "field" || mode === "life") {
                    return null;
                }
                if (mode === "network") {
                    return nearestHit(netParticles, absX, absY, (p) => p.radius * 4 + 18, 32);
                }
                if (mode === "orbits") {
                    return nearestHit(orbitSystems, absX, absY, (sys) => sys.radius * S.params.orbits.spread * 0.75 + 16, 28);
                }
                if (mode === "epicycles") {
                    return nearestHit(epicycles, absX, absY, (sys) => sys.radius * 0.7 + 22, 28);
                }
                if (mode === "harmonograph") {
                    return nearestHit(harmonics, absX, absY, (h) => Math.max(h.ax, h.ay) + 20, 28);
                }
                if (mode === "pendulum") {
                    return nearestHit(pendulums, absX, absY, () => 26, 26);
                }
                if (mode === "crystal") {
                    return nearestHit(crystals, absX, absY, (c) => 38 * c.scale * S.params.crystal.size + 14, 28);
                }
                if (mode === "flock") {
                    return nearestHit(boids, absX, absY, () => 26, 26);
                }
                return null;
            },
            blast(mode, rng, blastItem, clickX, clickY) {
                const radius = 420;
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
                }
                if (mode === "epicycles") {
                    for (let i = 0; i < epicycles.length; i++) {
                        blastItem(epicycles[i], (sys, force) => {
                            for (let a = 0; a < sys.arms.length; a++) {
                                sys.arms[a].w += (rng.next() - 0.5) * 0.04 * force;
                            }
                        });
                    }
                    return true;
                }
                if (mode === "harmonograph") {
                    for (let i = 0; i < harmonics.length; i++) {
                        const h = harmonics[i];
                        const dx = h.x - clickX;
                        const dy = h.y - clickY;
                        const distSq = dx * dx + dy * dy;
                        if (distSq >= radius * radius || distSq <= 0.01) {
                            continue;
                        }
                        const dist = Math.sqrt(distSq);
                        const force = 1 - dist / radius;
                        h.unwind = Math.min(1, (h.unwind || 0) + 0.35 + force * 0.65);
                        h.kick = Math.min(0.28, (h.kick || 0) + 0.03 + force * 0.1);
                    }
                    return true;
                }
                if (mode === "aurora") {
                    const sx = clickX;
                    const sy = clickY - window.scrollY;
                    const sign = rng.next() < 0.5 ? -1 : 1;
                    if (auroraRumples.length > 10) {
                        auroraRumples.splice(0, auroraRumples.length - 10);
                    }
                    auroraRumples.push({
                        x: sx,
                        y: sy,
                        amp: (70 + rng.next() * 50) * sign,
                        sigma: 55 + rng.next() * 35,
                        freq: 0.028 + rng.next() * 0.03,
                        phase: rng.next() * Math.PI * 2,
                        w: 0.07 + rng.next() * 0.1,
                        life: 1,
                        grow: 0,
                    });
                    auroraRumples.push({
                        x: sx + (rng.next() - 0.5) * 28,
                        y: sy + (rng.next() - 0.5) * 18,
                        amp: (28 + rng.next() * 22) * -sign,
                        sigma: 22 + rng.next() * 16,
                        freq: 0.07 + rng.next() * 0.06,
                        phase: rng.next() * Math.PI * 2,
                        w: 0.12 + rng.next() * 0.16,
                        life: 1,
                        grow: 0,
                    });
                    return true;
                }
                if (mode === "pendulum") {
                    for (let i = 0; i < pendulums.length; i++) {
                        const p = pendulums[i];
                        const pts = [p.x, p.y, p.x1, p.y1, p.x2, p.y2];
                        let bestD = 1e9;
                        let bx = p.x;
                        let by = p.y;
                        for (let k = 0; k < pts.length; k += 2) {
                            if (typeof pts[k] !== "number") {
                                continue;
                            }
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
                    for (let i = 0; i < fieldParticles.length; i++) blastItem(fieldParticles[i]);
                    fieldGusts.push({
                        x: clickX,
                        y: clickY,
                        life: 1,
                        radius: 240,
                        spin: rng.next() < 0.5 ? -1 : 1,
                    });
                    return true;
                }
                if (mode === "rain") {
                    return true;
                }
                if (mode === "life") {
                    stampLifeAt(clickX, clickY - window.scrollY, rng);
                    return true;
                }
                return false;
            },
        };
    };
})(window);
