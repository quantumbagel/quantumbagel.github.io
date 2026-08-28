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
    const netParticles = [];
    const netGrid = createHashGrid(88);

    const getNetworkCount = () => {
        if (!S.enabled) {
            return 0;
        }
        const area = S.width * S.docHeight;
        const mobile = S.width < S.MOBILE_BREAKPOINT ? 0.5 : 1;
        const density = 0.00017 * S.params.network.density * (S.reducedMotion ? 0.38 : 1) * mobile * (S.quality ? S.quality.densityMul() : 1);
        return clampCount(area * density, S.reducedMotion ? 40 : 70, COUNT_CAPS.network);
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
                bounceBounds(p, 8);
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

        if (animate) {
            for (let i = 0; i < netParticles.length; i++) {
                bounceBounds(netParticles[i], 8);
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

    return {
        clear() { netParticles.length = 0; },
        init(opts) {
            quietSpawn = !!(opts && opts.quiet);
            try { initNetwork(); } finally { quietSpawn = false; }
        },
        adjust(pw, ph) { adjustNetwork(pw, ph); },
        tick(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) {
            tickNetwork(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
        },
        hitTest(absX, absY) {
            return nearestHit(netParticles, absX, absY, (p) => p.radius * 4 + 18, 32);
        },
        blast(_rng, blastItem) {
            for (let i = 0; i < netParticles.length; i++) blastItem(netParticles[i]);
            return true;
        },
    };
}
