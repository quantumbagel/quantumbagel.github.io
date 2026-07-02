(function () {
    "use strict";

    const BG_ENABLED_KEY = "particle-background-enabled";
    const MOBILE_BREAKPOINT = 768;
    const MOBILE_DENSITY = 0.55;
    const CONNECTION_DISTANCE = 68;
    const GRID_CELL_SIZE = 72;
    const CANVAS_FADE_MS = 450;
    const INTERACTIVE_SELECTOR = "a, button, input, textarea, select, label, [role='button'], .project-card, .modal-close-btn";

    function createRng(seed) {
        let state = seed >>> 0;
        return {
            next() {
                state = (state + 0x6d2b79f5) >>> 0;
                let t = state;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            },
        };
    }

    function hashSeed(width, docHeight) {
        return (0xc0ffee ^ Math.floor(width) * 73856093 ^ Math.floor(docHeight) * 19349663) >>> 0;
    }

    // Baked from templates/index.html theme tokens (oklch values in site CSS).
    const BAKED_PALETTES = {
        light: {
            particleRgb: { r: 46, g: 46, b: 46 },       // --color-accent-2 oklch(18.15% 0 0)
            hoverAccentRgb: { r: 200, g: 68, b: 48 },   // --color-accent oklch(50.2% .27 29)
        },
        dark: {
            particleRgb: { r: 212, g: 212, b: 217 },    // --color-global-text oklch(83.54% 0 264)
            hoverAccentRgb: { r: 72, g: 212, b: 230 },  // --color-accent oklch(73.5% .22 199)
        },
    };

    function rgbToString(rgb) {
        return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
    }

    function lerpRgb(current, target, amount) {
        return {
            r: current.r + (target.r - current.r) * amount,
            g: current.g + (target.g - current.g) * amount,
            b: current.b + (target.b - current.b) * amount,
        };
    }

    function readStoredEnabled() {
        const stored = localStorage.getItem(BG_ENABLED_KEY);
        if (stored === "off" || stored === "false") {
            return false;
        }
        if (stored === "on" || stored === "true") {
            return true;
        }

        const legacy = localStorage.getItem("particle-intensity");
        if (legacy === "off") {
            return false;
        }
        return true;
    }

    function initParticleBackground(canvas, options) {
        if (!canvas) {
            return { updateCanvasDimensions: () => {}, scheduleDimensionUpdate: () => {} };
        }

        const toggleButton = options.toggleButton || document.getElementById("particle-toggle");
        const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

        const ctx = canvas.getContext("2d");
        const getDocumentScrollHeight = () =>
            Math.max(
                document.body ? document.body.scrollHeight : 0,
                document.documentElement.scrollHeight,
                document.body ? document.body.offsetHeight : 0,
                document.documentElement.offsetHeight,
                document.body ? document.body.clientHeight : 0,
                document.documentElement.clientHeight
            );
        const getDpr = () => Math.min(window.devicePixelRatio || 1, 2);

        let width = window.innerWidth;
        let height = window.innerHeight;
        let docHeight = getDocumentScrollHeight();
        let dpr = getDpr();
        let particlesInitialized = false;
        let animationFrameId = null;
        let resizeRaf = null;
        let isPageVisible = !document.hidden;
        let reducedMotion = reducedMotionQuery.matches;
        let baseSeed = hashSeed(width, docHeight);
        let enabled = readStoredEnabled();

        if (!enabled) {
            canvas.style.opacity = "0";
        }
        canvas.style.transition = `opacity ${CANVAS_FADE_MS}ms ease`;

        let mouse = { x: -1000, y: -1000 };

        const isDarkMode = () => document.documentElement.classList.contains("dark");

        const getVisibilityProfile = () => {
            if (isDarkMode()) {
                return {
                    particleOpacityMin: 0.12,
                    particleOpacityRange: 0.08,
                    lineAlpha: 0.1,
                    hoverLineAlpha: 0.55,
                    hoverOpacityBoost: 0.55,
                    hoverRadiusScale: 1.3,
                    depthMin: 0.75,
                };
            }
            return {
                particleOpacityMin: 0.22,
                particleOpacityRange: 0.1,
                lineAlpha: 0.2,
                hoverLineAlpha: 0.65,
                hoverOpacityBoost: 0.6,
                hoverRadiusScale: 1.25,
                depthMin: 0.88,
            };
        };

        const getThemeColors = () => {
            const palette = isDarkMode() ? BAKED_PALETTES.dark : BAKED_PALETTES.light;
            return {
                particleRgb: { ...palette.particleRgb },
                hoverAccentRgb: { ...palette.hoverAccentRgb },
                visibility: getVisibilityProfile(),
            };
        };

        let colors = getThemeColors();

        const applyCanvasSize = () => {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        applyCanvasSize();

        class SpatialHashGrid {
            constructor(gridWidth, gridHeight, cellSize) {
                this.width = gridWidth;
                this.height = gridHeight;
                this.cellSize = cellSize;
                this.cols = Math.ceil(gridWidth / cellSize);
                this.rows = Math.ceil(gridHeight / cellSize);
                this.grid = {};
            }

            clear() {
                this.grid = {};
            }

            getKey(x, y) {
                const cx = Math.floor(x / this.cellSize);
                const cy = Math.floor(y / this.cellSize);
                return `${cx},${cy}`;
            }

            insert(particle) {
                const key = this.getKey(particle.x, particle.y);
                if (!this.grid[key]) {
                    this.grid[key] = [];
                }
                this.grid[key].push(particle);
            }

            getNearby(particle) {
                const cx = Math.floor(particle.x / this.cellSize);
                const cy = Math.floor(particle.y / this.cellSize);
                const neighbors = [];

                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const key = `${cx + dx},${cy + dy}`;
                        const cell = this.grid[key];
                        if (cell) {
                            for (let i = 0; i < cell.length; i++) {
                                if (cell[i] !== particle) {
                                    neighbors.push(cell[i]);
                                }
                            }
                        }
                    }
                }
                return neighbors;
            }
        }

        const grid = new SpatialHashGrid(width, docHeight, GRID_CELL_SIZE);
        const particles = [];

        const getTargetParticleCount = () => {
            if (!enabled) {
                return 0;
            }
            const area = width * docHeight;
            const mobileFactor = width < MOBILE_BREAKPOINT ? MOBILE_DENSITY : 1;
            const densityFactor = reducedMotion ? 0.35 : 1;
            const density = 0.0004 * densityFactor * mobileFactor;
            return Math.min(3000, Math.max(reducedMotion ? 120 : 250, Math.floor(area * density)));
        };

        class Particle {
            constructor(id, fadeIn = false) {
                this.id = id;
                this.colorRgb = { ...colors.particleRgb };
                this.colorTarget = colors.particleRgb;
                this.reset(true, fadeIn);
            }

            reset(_initial = false, fadeIn = false) {
                const rng = createRng(baseSeed + this.id * 997);
                this.x = rng.next() * width;
                this.y = rng.next() * docHeight;
                this.baseVx = (rng.next() - 0.5) * 0.35;
                this.baseVy = (rng.next() - 0.5) * 0.35;
                this.vx = this.baseVx;
                this.vy = this.baseVy;
                this.radius = rng.next() * 1.5 + 1;
                const visibility = colors.visibility || getVisibilityProfile();
                this.baseOpacity = rng.next() * visibility.particleOpacityRange + visibility.particleOpacityMin;
                this.opacity = fadeIn ? 0 : this.baseOpacity;
                this.colorTarget = colors.particleRgb;
                this.colorRgb = { ...colors.particleRgb };
                this.highlighted = false;
            }

            setColorTarget(targetRgb) {
                this.colorTarget = targetRgb;
            }

            updateColor() {
                this.colorRgb = lerpRgb(this.colorRgb, this.colorTarget, 0.12);
            }

            enforceBounds() {
                if (this.x < 0) {
                    this.x = 0;
                    this.vx = -this.vx;
                    this.baseVx = -this.baseVx;
                }
                if (this.x > width) {
                    this.x = width;
                    this.vx = -this.vx;
                    this.baseVx = -this.baseVx;
                }
                if (this.y < 0) {
                    this.y = 0;
                    this.vy = -this.vy;
                    this.baseVy = -this.baseVy;
                }
                if (this.y > docHeight) {
                    this.y = docHeight;
                    this.vy = -this.vy;
                    this.baseVy = -this.baseVy;
                }
            }

            update(mouseAbsX, mouseAbsY, mouseActive) {
                if (this.opacity < this.baseOpacity) {
                    this.opacity += (this.baseOpacity - this.opacity) * 0.05;
                }

                this.vx += (this.baseVx - this.vx) * 0.04;
                this.vy += (this.baseVy - this.vy) * 0.04;

                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const maxSpeed = 4.0;
                if (speed > maxSpeed) {
                    this.vx = (this.vx / speed) * maxSpeed;
                    this.vy = (this.vy / speed) * maxSpeed;
                }

                this.x += this.vx;
                this.y += this.vy;

                const dx = mouseAbsX - this.x;
                const dy = mouseAbsY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const forceRadius = 120;
                const nearMouse = mouseActive && dist < forceRadius;

                if (nearMouse) {
                    const force = (forceRadius - dist) / forceRadius;
                    const angle = Math.atan2(dy, dx);

                    this.x -= Math.cos(angle) * force * 0.9;
                    this.y -= Math.sin(angle) * force * 0.9;
                    this.highlighted = true;
                    this.colorRgb = { ...colors.hoverAccentRgb };
                    this.colorTarget = colors.hoverAccentRgb;
                    const hoverBoost = colors.visibility.hoverOpacityBoost;
                    this.opacity = Math.min(0.9, this.baseOpacity + force * hoverBoost);
                } else {
                    this.highlighted = false;
                    this.setColorTarget(colors.particleRgb);
                    this.updateColor();
                    this.opacity += (this.baseOpacity - this.opacity) * 0.08;
                }

                this.enforceBounds();
            }

            getDepthFactor(scrollY, viewHeight) {
                const viewCenterY = scrollY + viewHeight * 0.5;
                const distFromView = Math.abs(this.y - viewCenterY);
                const falloff = Math.max(viewHeight, docHeight * 0.35);
                const depthMin = (colors.visibility || getVisibilityProfile()).depthMin;
                return Math.max(depthMin, 1 - distFromView / falloff * (1 - depthMin));
            }

            draw(scrollY, viewHeight) {
                const depth = this.getDepthFactor(scrollY, viewHeight);
                const visibility = colors.visibility || getVisibilityProfile();
                const screenY = this.y - scrollY;
                const radiusScale = this.highlighted ? visibility.hoverRadiusScale : 1;
                ctx.beginPath();
                ctx.arc(
                    this.x,
                    screenY,
                    this.radius * (0.85 + depth * 0.15) * radiusScale,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = rgbToString(this.highlighted ? colors.hoverAccentRgb : this.colorRgb);
                ctx.globalAlpha = this.highlighted
                    ? Math.min(0.95, this.opacity * (0.85 + depth * 0.15))
                    : this.opacity * (0.65 + depth * 0.35);
                ctx.fill();
            }
        }

        const adjustParticles = (previousWidth, previousDocHeight) => {
            const targetCount = getTargetParticleCount();

            if (
                particlesInitialized &&
                particles.length > 0 &&
                previousDocHeight > 0 &&
                Math.abs(docHeight - previousDocHeight) > 30
            ) {
                const heightRatio = docHeight / previousDocHeight;
                for (let i = 0; i < particles.length; i++) {
                    particles[i].y *= heightRatio;
                }
            }

            if (particlesInitialized && particles.length > 0 && previousWidth > 0 && width !== previousWidth) {
                const widthRatio = width / previousWidth;
                for (let i = 0; i < particles.length; i++) {
                    particles[i].x *= widthRatio;
                }
            }

            if (particles.length < targetCount) {
                const diff = targetCount - particles.length;
                let maxId = particles.reduce((max, p) => (p.id > max ? p.id : max), -1);
                for (let i = 0; i < diff; i++) {
                    particles.push(new Particle(maxId + 1 + i, true));
                }
            } else if (particles.length > targetCount) {
                particles.length = targetCount;
            }
        };

        const initParticles = () => {
            particles.length = 0;
            baseSeed = hashSeed(width, docHeight);
            const targetCount = getTargetParticleCount();
            for (let i = 0; i < targetCount; i++) {
                particles.push(new Particle(i, true));
            }
            particlesInitialized = targetCount > 0;
        };

        const updateCanvasDimensions = () => {
            const currentScrollHeight = getDocumentScrollHeight();
            const currentWidth = window.innerWidth;
            const currentHeight = window.innerHeight;
            const currentDpr = getDpr();
            const previousWidth = width;
            const previousDocHeight = docHeight;

            let sizeChanged = false;
            if (width !== currentWidth || height !== currentHeight || dpr !== currentDpr) {
                width = currentWidth;
                height = currentHeight;
                dpr = currentDpr;
                applyCanvasSize();
                sizeChanged = true;
            }
            if (Math.abs(docHeight - currentScrollHeight) > 30) {
                docHeight = currentScrollHeight;
                sizeChanged = true;
            }

            if (sizeChanged) {
                grid.width = width;
                grid.height = docHeight;
                grid.cols = Math.ceil(width / grid.cellSize);
                grid.rows = Math.ceil(docHeight / grid.cellSize);
                if (particlesInitialized || enabled) {
                    adjustParticles(previousWidth, previousDocHeight);
                }
            }
        };

        const scheduleDimensionUpdate = () => {
            if (resizeRaf !== null) {
                return;
            }
            resizeRaf = requestAnimationFrame(() => {
                resizeRaf = null;
                updateCanvasDimensions();
            });
        };

        const strokeLineBatch = (segments, color, maxAlpha) => {
            if (segments.length === 0) {
                return;
            }
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = color;
            for (let i = 0; i < segments.length; i += 5) {
                const dist = segments[i + 4];
                const ratio = 1 - dist / CONNECTION_DISTANCE;
                ctx.globalAlpha = Math.max(0, ratio * maxAlpha);
                ctx.beginPath();
                ctx.moveTo(segments[i], segments[i + 1]);
                ctx.lineTo(segments[i + 2], segments[i + 3]);
                ctx.stroke();
            }
        };

        const clearCanvas = () => {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = "source-over";
            ctx.clearRect(0, 0, width, height);
        };

        const drawStatic = () => {
            clearCanvas();

            if (!particlesInitialized) {
                return;
            }

            const scrollY = window.scrollY;
            const viewHeight = window.innerHeight;

            for (let i = 0; i < particles.length; i++) {
                particles[i].draw(scrollY, viewHeight);
            }
        };

        const draw = () => {
            animationFrameId = null;

            if (!isPageVisible || !enabled) {
                return;
            }

            if (reducedMotion) {
                drawStatic();
                return;
            }

            clearCanvas();

            if (!particlesInitialized) {
                scheduleNextFrame();
                return;
            }

            const scrollY = window.scrollY;
            const viewHeight = window.innerHeight;
            const padding = 100;
            const mouseAbsX = mouse.x;
            const mouseAbsY = mouse.y + scrollY;
            const mouseActive = mouse.x > -500 && mouse.y > -500;

            const visibleParticles = [];

            for (let i = 0; i < particles.length; i++) {
                particles[i].update(mouseAbsX, mouseAbsY, mouseActive);
            }

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const screenY = p.y - scrollY;
                if (screenY >= -padding && screenY <= viewHeight + padding) {
                    visibleParticles.push(p);
                }
            }

            grid.clear();
            for (let i = 0; i < visibleParticles.length; i++) {
                grid.insert(visibleParticles[i]);
            }

            for (let i = 0; i < visibleParticles.length; i++) {
                visibleParticles[i].density = grid.getNearby(visibleParticles[i]).length;
            }

            const textLineSegments = [];
            const accentLineSegments = [];

            for (let i = 0; i < visibleParticles.length; i++) {
                const p1 = visibleParticles[i];
                const neighbors = grid.getNearby(p1);

                for (let n = 0; n < neighbors.length; n++) {
                    const p2 = neighbors[n];
                    if (p2.id <= p1.id) {
                        continue;
                    }

                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    const minDistance = 55;
                    if (dist < minDistance && dist > 0.1) {
                        const force = (minDistance - dist) / minDistance;
                        const densityFactor = 1 + (p1.density + p2.density) * 0.25;
                        const pushStrength = force * 0.8 * densityFactor;
                        const pushX = (dx / dist) * pushStrength;
                        const pushY = (dy / dist) * pushStrength;

                        p1.x += pushX;
                        p1.y += pushY;
                        p2.x -= pushX;
                        p2.y -= pushY;

                        p1.vx += pushX * 0.15;
                        p1.vy += pushY * 0.15;
                        p2.vx -= pushX * 0.15;
                        p2.vy -= pushY * 0.15;
                    }

                    if (dist < CONNECTION_DISTANCE && (p1.highlighted || p2.highlighted)) {
                        accentLineSegments.push(p1.x, p1.y - scrollY, p2.x, p2.y - scrollY, dist);
                    } else if (dist < CONNECTION_DISTANCE) {
                        textLineSegments.push(p1.x, p1.y - scrollY, p2.x, p2.y - scrollY, dist);
                    }
                }
            }

            for (let i = 0; i < particles.length; i++) {
                particles[i].enforceBounds();
            }

            strokeLineBatch(textLineSegments, rgbToString(colors.particleRgb), colors.visibility.lineAlpha);
            strokeLineBatch(
                accentLineSegments,
                rgbToString(colors.hoverAccentRgb),
                colors.visibility.hoverLineAlpha
            );

            ctx.globalAlpha = 1;
            for (let i = 0; i < visibleParticles.length; i++) {
                visibleParticles[i].draw(scrollY, viewHeight);
            }

            scheduleNextFrame();
        };

        const scheduleNextFrame = () => {
            if (animationFrameId !== null || !enabled) {
                return;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        const stopAnimation = (immediate = false) => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }

            const finishStop = () => {
                ctx.globalAlpha = 1;
                ctx.clearRect(0, 0, width, height);
                canvas.style.opacity = "0";
                particlesInitialized = false;
                particles.length = 0;
            };

            if (immediate) {
                finishStop();
                return;
            }

            canvas.style.opacity = "0";
            setTimeout(finishStop, CANVAS_FADE_MS);
        };

        const startAnimation = () => {
            colors = getThemeColors();
            updateCanvasDimensions();
            initParticles();
            mouse.x = -1000;
            mouse.y = -1000;
            canvas.style.opacity = "0";
            requestAnimationFrame(() => {
                canvas.style.opacity = "1";
            });
            if (reducedMotion) {
                drawStatic();
                return;
            }
            scheduleNextFrame();
        };

        const handleReducedMotionScroll = () => {
            if (reducedMotion && particlesInitialized && enabled) {
                drawStatic();
            }
        };

        const persistEnabled = () => {
            localStorage.setItem(BG_ENABLED_KEY, enabled ? "on" : "off");
        };

        const setEnabled = (nextEnabled) => {
            enabled = nextEnabled;
            persistEnabled();
            updateToggleLabel();

            if (!enabled) {
                stopAnimation();
                return;
            }

            startAnimation();
        };

        const toggleEnabled = () => {
            setEnabled(!enabled);
        };

        const updateToggleLabel = () => {
            if (!toggleButton) {
                return;
            }
            const label = enabled ? "On" : "Off";
            toggleButton.textContent = `Background/${label}`;
            toggleButton.setAttribute("aria-label", `Background: ${label}`);
        };

        const initializeParticlesWhenReady = async () => {
            try {
                if (document.fonts && document.fonts.ready) {
                    await Promise.race([
                        document.fonts.ready,
                        new Promise((resolve) => setTimeout(resolve, 2000)),
                    ]);
                }
            } catch (_error) {
                // Continue even if font loading fails.
            }

            persistEnabled();
            updateToggleLabel();

            if (!enabled) {
                stopAnimation(true);
                return;
            }

            startAnimation();
        };

        window.addEventListener("mousemove", (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        window.addEventListener("mouseleave", () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        window.addEventListener(
            "touchmove",
            (e) => {
                if (e.touches.length > 0) {
                    mouse.x = e.touches[0].clientX;
                    mouse.y = e.touches[0].clientY;
                }
            },
            { passive: true }
        );

        window.addEventListener("touchend", () => {
            mouse.x = -1000;
            mouse.y = -1000;
        });

        window.addEventListener("click", (e) => {
            if (e.target.closest(INTERACTIVE_SELECTOR)) {
                return;
            }
            if (!enabled || reducedMotion) {
                return;
            }

            const clickX = e.clientX;
            const clickY = e.clientY + window.scrollY;
            const blastRadius = 250;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                const dx = p.x - clickX;
                const dy = p.y - clickY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < blastRadius) {
                    const force = (blastRadius - dist) / blastRadius;
                    const angle = Math.atan2(dy, dx);
                    const push = force * 14;

                    p.vx = Math.cos(angle) * push;
                    p.vy = Math.sin(angle) * push;
                    p.opacity = Math.min(0.75, p.baseOpacity + force * 0.3);
                }
            }
        });

        const themeObserver = new MutationObserver(() => {
            colors = getThemeColors();
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                if (p.highlighted) {
                    p.setColorTarget(colors.hoverAccentRgb);
                    p.colorRgb = { ...colors.hoverAccentRgb };
                } else {
                    p.setColorTarget(colors.particleRgb);
                    p.colorRgb = { ...colors.particleRgb };
                }
            }
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        document.addEventListener("visibilitychange", () => {
            isPageVisible = !document.hidden;
            if (isPageVisible && enabled && !reducedMotion) {
                scheduleNextFrame();
            }
        });

        reducedMotionQuery.addEventListener("change", (event) => {
            reducedMotion = event.matches;
            if (!enabled) {
                return;
            }
            startAnimation();
        });

        window.addEventListener("resize", scheduleDimensionUpdate);
        window.addEventListener("scroll", handleReducedMotionScroll, { passive: true });
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", scheduleDimensionUpdate);
            window.visualViewport.addEventListener("scroll", scheduleDimensionUpdate);
        }

        if (typeof ResizeObserver !== "undefined" && document.body) {
            const resizeObserver = new ResizeObserver(() => {
                scheduleDimensionUpdate();
            });
            resizeObserver.observe(document.body);
        }

        if (toggleButton) {
            toggleButton.addEventListener("click", () => {
                toggleEnabled();
            });
        }

        if (document.readyState === "complete") {
            initializeParticlesWhenReady();
        } else {
            window.addEventListener("load", initializeParticlesWhenReady);
        }

        return {
            updateCanvasDimensions,
            scheduleDimensionUpdate,
            setEnabled,
        };
    }

    window.initParticleBackground = initParticleBackground;
})();
