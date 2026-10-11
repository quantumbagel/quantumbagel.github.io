import {
    BLAST_RADIUS,
    BG_ENABLED_KEY,
    BG_MODE_KEY,
    BG_PARAMS_KEY,
    BG_RANDOM_KEY,
    CANVAS_FADE_MS,
    CONTENT_MAX_WIDTH,
    DEPTH_OFFSET,
    FOCAL,
    GUTTER_MIN_WIDTH,
    INTERACTIVE_SELECTOR,
    LAUNCH_SPEED,
    MOBILE_BREAKPOINT,
    MODE_HINTS,
    MODE_LABELS,
    MODES,
    MOUSE_RADIUS,
    PARAM_FIELDS,
    REF_FPS,
} from "./config.js";
import {
    clamp,
    copyDefaultParams,
    createQuality,
    createRng,
    getThemeColors,
    paramIsOverCap,
    pickRandomMode,
    readStoredEnabled,
    readStoredMode,
    readStoredParams,
    readStoredRandom,
    rgbToString,
} from "./core.js";
import { rebuildSprites as makeSprites } from "./sprites.js";
import { loadModeModule } from "./modes.js";

export function initParticleBackground(canvas, options) {
    if (!canvas) {
        return { updateCanvasDimensions: () => {}, scheduleDimensionUpdate: () => {} };
    }
    options = options || {};

    const toggleButton = options.toggleButton || document.getElementById("particle-toggle");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true }) || canvas.getContext("2d");
    canvas.style.contain = "strict";

    const getDocumentScrollHeight = () =>
        Math.max(
            document.body ? document.body.scrollHeight : 0,
            document.documentElement.scrollHeight,
            document.body ? document.body.offsetHeight : 0,
            document.documentElement.offsetHeight,
            document.body ? document.body.clientHeight : 0,
            document.documentElement.clientHeight
        );

    const quality = createQuality();
    const getDpr = () => Math.min(window.devicePixelRatio || 1, quality.dprCap());

    let width = window.innerWidth;
    let height = window.innerHeight;
    let docHeight = getDocumentScrollHeight();
    let dpr = getDpr();
    let animationFrameId = null;
    let stopTimeoutId = null;
    let resizeRaf = null;
    let lastFrameTime = 0;
    let isPageVisible = !document.hidden;
    let reducedMotion = reducedMotionQuery.matches;
    let enabled = readStoredEnabled();
    let randomMode = readStoredRandom();
    let mode = randomMode ? pickRandomMode() : readStoredMode();
    let params = readStoredParams();
    let particleColorStr = "";
    let accentColorStr = "";
    let bgColorStr = "";
    let sprites = { carbon: null, hetero: null, hydrogen: null, accent: null };
    let simReady = false;
    let panelEl = null;
    let persistTimer = null;
    let currentMode = null;
    let loadGen = 0;
    let hoverCheckAt = 0;
    const damp = {
        fadeIn: 1,
        cruise: 1,
        spin: 1,
        pulse: 1,
        opacityOut: 1,
        opacityIn: 1,
    };
    const drag = {
        active: false,
        kind: "",
        target: null,
        offsetX: 0,
        offsetY: 0,
        lastX: 0,
        lastY: 0,
        lastT: 0,
        vx: 0,
        vy: 0,
        moved: 0,
        pointerId: null,
    };
    let longPressTimer = null;
    let hoverGrab = false;
    let pressStartX = 0;
    let pressStartY = 0;
    const pointerTap = {
        interactive: true,
        blasted: false,
        x: 0,
        y: 0,
    };
    const mouse = { x: -1000, y: -1000 };

    if (!enabled) {
        canvas.style.opacity = "0";
    }
    canvas.style.transition = `opacity ${CANVAS_FADE_MS}ms ease`;

    let colors = getThemeColors();
    particleColorStr = rgbToString(colors.particleRgb);
    accentColorStr = rgbToString(colors.hoverAccentRgb);
    bgColorStr = rgbToString(colors.bgRgb);
    sprites = makeSprites(colors);

    const world = {
        get width() { return width; },
        get height() { return height; },
        get docHeight() { return docHeight; },
        get ctx() { return ctx; },
        get params() { return params; },
        get mouse() { return mouse; },
        get colors() { return colors; },
        get particleColorStr() { return particleColorStr; },
        get accentColorStr() { return accentColorStr; },
        get sprites() { return sprites; },
        get reducedMotion() { return reducedMotion; },
        get lastFrameTime() { return lastFrameTime; },
        get enabled() { return enabled; },
        get createRng() { return createRng; },
        get quality() { return quality; },
        FOCAL,
        DEPTH_OFFSET,
        MOBILE_BREAKPOINT,
        MOUSE_RADIUS,
    };

    const applyCanvasSize = () => {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.imageSmoothingEnabled = true;
    };
    applyCanvasSize();

    const clearCanvas = () => {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, width, height);
    };

    const clearSimData = () => {
        if (currentMode && typeof currentMode.clear === "function") {
            currentMode.clear();
        }
        currentMode = null;
        simReady = false;
    };

    const activateMode = async (opts) => {
        const gen = ++loadGen;
        const nextId = mode;
        if (currentMode && typeof currentMode.clear === "function") {
            currentMode.clear();
        }
        currentMode = null;
        simReady = false;
        try {
            const mod = await loadModeModule(nextId);
            if (gen !== loadGen || mode !== nextId) {
                return;
            }
            currentMode = mod.create(world);
            currentMode.init(opts);
            simReady = true;
        } catch (error) {
            if (gen === loadGen) {
                console.error("Failed to load background mode", nextId, error);
            }
        }
    };

    const initCurrentMode = (fadeCanvas) => {
        clearSimData();
        if (fadeCanvas) {
            mouse.x = -1000;
            mouse.y = -1000;
            canvas.style.opacity = "0";
            requestAnimationFrame(() => {
                if (enabled) {
                    canvas.style.opacity = "1";
                }
            });
        }
        return activateMode();
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

        if (sizeChanged && enabled && currentMode && typeof currentMode.adjust === "function") {
            currentMode.adjust(previousWidth, previousDocHeight);
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

    const tickCurrentMode = (frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate) => {
        if (!currentMode) {
            return;
        }
        currentMode.tick(frame, damp, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, animate);
    };

    const drawStatic = () => {
        clearCanvas();
        if (!simReady) {
            return;
        }
        damp.fadeIn = 1;
        damp.cruise = 1;
        damp.spin = 1;
        damp.pulse = 1;
        damp.opacityOut = 1;
        damp.opacityIn = 1;
        tickCurrentMode(1, window.scrollY, window.innerHeight, -1000, -1000, false, false);
    };

    const scheduleNextFrame = () => {
        if (animationFrameId !== null || !enabled) {
            return;
        }
        animationFrameId = requestAnimationFrame(draw);
    };

    const draw = (now) => {
        animationFrameId = null;
        if (!isPageVisible || !enabled) {
            return;
        }
        if (reducedMotion) {
            drawStatic();
            return;
        }
        if (!lastFrameTime) {
            lastFrameTime = now;
        }
        let dt = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        if (dt > 0.05) {
            dt = 0.05;
        } else if (dt <= 0) {
            dt = 1 / REF_FPS;
        }
        quality.sample(dt);
        const frame = dt * REF_FPS;
        damp.fadeIn = 1 - Math.pow(0.95, frame);
        damp.cruise = 1 - Math.pow(0.96, frame);
        damp.spin = 1 - Math.pow(0.975, frame);
        damp.pulse = 1 - Math.pow(0.9, frame);
        damp.opacityOut = 1 - Math.pow(0.9, frame);
        damp.opacityIn = 1 - Math.pow(0.78, frame);

        const nextDpr = getDpr();
        if (nextDpr !== dpr) {
            dpr = nextDpr;
            applyCanvasSize();
        }
        if (quality.shouldRebuild(now) && currentMode && typeof currentMode.adjust === "function") {
            currentMode.adjust(width, docHeight);
            applyFrost();
        }

        clearCanvas();
        if (!simReady) {
            scheduleNextFrame();
            return;
        }

        const scrollY = window.scrollY;
        const viewHeight = window.innerHeight;
        const mouseAbsX = mouse.x;
        const mouseAbsY = mouse.y + scrollY;
        const mouseActive = !drag.active && mouse.x > -500 && mouse.y > -500;
        tickCurrentMode(frame, scrollY, viewHeight, mouseAbsX, mouseAbsY, mouseActive, true);
        ctx.globalAlpha = 1;
        scheduleNextFrame();
    };

    const stopAnimation = (immediate = false) => {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (stopTimeoutId !== null) {
            clearTimeout(stopTimeoutId);
            stopTimeoutId = null;
        }
        const finishStop = () => {
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, width, height);
            canvas.style.opacity = "0";
            clearSimData();
            lastFrameTime = 0;
            stopTimeoutId = null;
        };
        if (immediate) {
            finishStop();
            return;
        }
        canvas.style.opacity = "0";
        stopTimeoutId = setTimeout(finishStop, CANVAS_FADE_MS);
    };

    const startAnimation = () => {
        const wasFading = stopTimeoutId !== null;
        if (stopTimeoutId !== null) {
            clearTimeout(stopTimeoutId);
            stopTimeoutId = null;
        }
        colors = getThemeColors();
        particleColorStr = rgbToString(colors.particleRgb);
        accentColorStr = rgbToString(colors.hoverAccentRgb);
        bgColorStr = rgbToString(colors.bgRgb);
        sprites = makeSprites(colors);
        updateCanvasDimensions();
        lastFrameTime = 0;

        const kick = () => {
            if (reducedMotion) {
                drawStatic();
                return;
            }
            scheduleNextFrame();
        };

        if (!simReady || !wasFading) {
            Promise.resolve(initCurrentMode(true)).then(kick);
        } else {
            canvas.style.opacity = "1";
            kick();
        }
    };

    const handleReducedMotionScroll = () => {
        if (reducedMotion && enabled && simReady) {
            drawStatic();
        }
    };

    const persistParams = () => {
        if (persistTimer) {
            clearTimeout(persistTimer);
        }
        persistTimer = setTimeout(() => {
            localStorage.setItem(BG_PARAMS_KEY, JSON.stringify(params));
            localStorage.setItem(BG_RANDOM_KEY, randomMode ? "on" : "off");
            if (!randomMode) {
                localStorage.setItem(BG_MODE_KEY, mode);
            }
        }, 80);
    };

    const applyFrost = () => {
        const t = params.frost * quality.frostMul();
        const tint = t < 0.04 ? 100 : Math.max(92, Math.round(100 - t * 8));
        document.documentElement.style.setProperty("--page-card-tint", `${tint}%`);
    };

    const applyLiveParams = (changedKey) => {
        applyFrost();
        if (!enabled || !currentMode) {
            return;
        }
        const rebuild = changedKey === "density" || (mode === "life" && changedKey === "size");
        if (typeof currentMode.applyParams === "function") {
            currentMode.applyParams(changedKey);
            return;
        }
        if (rebuild) {
            currentMode.init({ quiet: true });
            return;
        }
        currentMode.adjust(width, docHeight);
    };

    const formatParam = (value) => {
        if (Math.abs(value - Math.round(value)) < 0.001) {
            return String(Math.round(value));
        }
        return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    };

    const paramBounds = (scope, key) => {
        if (scope === "frost") {
            return { min: 0, max: 1, step: 0.05 };
        }
        const fields = PARAM_FIELDS[scope];
        if (!fields) {
            return null;
        }
        for (let i = 0; i < fields.length; i++) {
            if (fields[i].key === key) {
                return fields[i];
            }
        }
        return null;
    };

    const currentParamValue = (scope, key) => {
        if (scope === "frost") {
            return params.frost;
        }
        if (scope && key && params[scope]) {
            return params[scope][key];
        }
        return null;
    };

    const paramRow = (label, value, min, max, step, scope, key, floor) => {
        const keyAttr = key ? ` data-key="${key}"` : "";
        const warn = paramIsOverCap({ min, max }, value);
        const rangeVal = clamp(value, min, max);
        const warnClass = warn ? " bg-sim-row-warn" : "";
        const title = warn ? ' title="Above the supported range — may be slow or unstable."' : "";
        const numMin = floor != null ? ` min="${floor}"` : "";
        return `<div class="bg-sim-row${warnClass}"${title}><span data-label="${label}">${label}<span class="bg-sim-warn-mark">!</span></span><input type="range" min="${min}" max="${max}" step="${step}" value="${rangeVal}" data-scope="${scope}"${keyAttr}><input type="number" step="any" inputmode="decimal"${numMin} value="${formatParam(value)}" data-scope="${scope}"${keyAttr}></div>`;
    };

    const syncParamRowWarn = (row, bounds, value) => {
        if (!row || !bounds) {
            return;
        }
        const warn = paramIsOverCap(bounds, value);
        row.classList.toggle("bg-sim-row-warn", warn);
        if (warn) {
            row.setAttribute("title", "Above the supported range — may be slow or unstable.");
        } else {
            row.removeAttribute("title");
        }
    };

    const setParamValue = (scope, key, value, sourceInput, commit) => {
        const bounds = paramBounds(scope, key);
        if (!bounds) {
            return;
        }
        if (typeof bounds.floor === "number" && value < bounds.floor) {
            value = bounds.floor;
        }
        if (scope === "frost") {
            params.frost = value;
        } else {
            params[scope][key] = value;
        }
        const row = sourceInput && sourceInput.parentElement;
        if (row) {
            syncParamRowWarn(row, bounds, value);
            const range = row.querySelector('input[type="range"]');
            const number = row.querySelector('input[type="number"]');
            if (range) {
                range.value = String(clamp(value, bounds.min, bounds.max));
            }
            if (number && (commit || number !== sourceInput || Number(number.value) !== value)) {
                number.value = formatParam(value);
            }
        }
        persistParams();
        applyLiveParams(key);
    };

    const renderPanel = () => {
        if (!panelEl) {
            return;
        }
        const fields = PARAM_FIELDS[mode];
        let modesHtml = "";
        for (let i = 0; i < MODES.length; i++) {
            const id = MODES[i];
            const pressed = id === mode ? "true" : "false";
            modesHtml += `<button type="button" class="chip-btn" data-mode="${id}" aria-pressed="${pressed}">${MODE_LABELS[id]}</button>`;
        }
        let rows = paramRow("Frost", params.frost, 0, 1, 0.05, "frost");
        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            rows += paramRow(field.label, params[mode][field.key], field.min, field.max, field.step, mode, field.key, field.floor);
        }
        const randomNote = randomMode
            ? `<p class="bg-sim-note">Random is on, so a new simulation is picked each visit.</p>`
            : "";
        const onClass = enabled ? " btn accent small" : " btn small ghost";
        const randomClass = randomMode ? " btn accent small" : " btn small ghost";
        panelEl.innerHTML = `<div class="bg-sim-head"><span class="look-name">Background</span><span class="bg-sim-tools"><button type="button" class="${onClass.trim()}" data-action="toggle" aria-pressed="${enabled ? "true" : "false"}">${enabled ? "On" : "Off"}</button><button type="button" class="${randomClass.trim()}" data-action="random" aria-pressed="${randomMode ? "true" : "false"}">Random</button><button type="button" class="btn small ghost" data-action="again">Again</button><button type="button" class="btn small ghost" data-action="reset">Reset</button><button type="button" class="icon-btn" data-action="close" aria-label="Close">X</button></span></div><div class="bg-sim-modes">${modesHtml}</div>${rows}<p class="bg-sim-hint">${MODE_HINTS[mode]}</p>${randomNote}`;
    };

    const restartBackground = () => {
        if (!enabled) {
            return;
        }
        lastFrameTime = 0;
        Promise.resolve(initCurrentMode(true)).then(() => {
            if (reducedMotion) {
                drawStatic();
                return;
            }
            scheduleNextFrame();
        });
    };

    const resetBackground = () => {
        params = copyDefaultParams();
        persistParams();
        renderPanel();
        applyFrost();
        restartBackground();
    };

    const setMode = (nextMode) => {
        if (MODES.indexOf(nextMode) < 0 || nextMode === mode) {
            renderPanel();
            return;
        }
        mode = nextMode;
        persistParams();
        renderPanel();
        updateToggleLabel();
        if (!enabled) {
            return;
        }
        lastFrameTime = 0;
        Promise.resolve(initCurrentMode(true)).then(() => {
            if (reducedMotion) {
                drawStatic();
                return;
            }
            scheduleNextFrame();
        });
    };

    const setPanelOpen = (open) => {
        if (!panelEl) {
            return;
        }
        panelEl.hidden = !open;
        updateToggleLabel();
    };

    const persistEnabled = () => {
        localStorage.setItem(BG_ENABLED_KEY, enabled ? "on" : "off");
    };

    const setEnabled = (nextEnabled) => {
        enabled = nextEnabled;
        persistEnabled();
        updateToggleLabel();
        renderPanel();
        if (!enabled) {
            stopAnimation();
            return;
        }
        startAnimation();
    };

    const toggleEnabled = () => {
        setEnabled(!enabled);
    };

    const setRandomMode = (nextRandom) => {
        randomMode = !!nextRandom;
        persistParams();
        if (!randomMode) {
            localStorage.setItem(BG_MODE_KEY, mode);
        }
        renderPanel();
    };

    const updateToggleLabel = () => {
        if (!toggleButton) {
            return;
        }
        const open = panelEl && !panelEl.hidden;
        toggleButton.textContent = "Background";
        toggleButton.setAttribute("aria-label", `Background: ${enabled ? "On" : "Off"}`);
        toggleButton.setAttribute("aria-expanded", open ? "true" : "false");
        toggleButton.setAttribute("aria-controls", "bg-sim-panel");
    };

    const ensurePanel = () => {
        if (panelEl) {
            return;
        }
        panelEl = document.createElement("div");
        panelEl.id = "bg-sim-panel";
        panelEl.className = "bg-sim-panel";
        panelEl.hidden = true;
        panelEl.setAttribute("role", "dialog");
        panelEl.setAttribute("aria-label", "Background effects");
        document.body.appendChild(panelEl);
        const handleParamField = (event, commit) => {
            const input = event.target;
            if (!(input instanceof HTMLInputElement) || (input.type !== "range" && input.type !== "number")) {
                return;
            }
            const scope = input.dataset.scope;
            const key = input.dataset.key;
            const raw = input.value.trim();
            if (input.type === "number" && !commit && (raw === "" || raw === "-" || raw === "." || raw === "-.")) {
                return;
            }
            const value = Number(raw);
            if (!Number.isFinite(value)) {
                if (commit) {
                    const current = currentParamValue(scope, key);
                    if (typeof current === "number") {
                        input.value = formatParam(current);
                    }
                }
                return;
            }
            setParamValue(scope, key, value, input, commit || input.type === "range");
        };
        panelEl.addEventListener("input", (event) => handleParamField(event, false));
        panelEl.addEventListener("change", (event) => handleParamField(event, true));
        panelEl.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") {
                return;
            }
            const input = event.target;
            if (input instanceof HTMLInputElement && input.type === "number") {
                handleParamField(event, true);
                input.blur();
            }
        });
        panelEl.addEventListener("click", (event) => {
            event.stopPropagation();
            const actionBtn = event.target.closest("[data-action]");
            if (actionBtn) {
                const action = actionBtn.getAttribute("data-action");
                if (action === "close") setPanelOpen(false);
                else if (action === "toggle") toggleEnabled();
                else if (action === "random") setRandomMode(!randomMode);
                else if (action === "again") restartBackground();
                else if (action === "reset") resetBackground();
                return;
            }
            const button = event.target.closest("[data-mode]");
            if (button) {
                setMode(button.getAttribute("data-mode"));
            }
        });
        renderPanel();
    };

    const hitTest = (absX, absY) => {
        if (!currentMode || typeof currentMode.hitTest !== "function") {
            return null;
        }
        return currentMode.hitTest(absX, absY);
    };

    const beginDrag = (target, clientX, clientY, pointerId) => {
        if (!target || reducedMotion) {
            return;
        }
        drag.active = true;
        drag.kind = mode;
        drag.target = target;
        drag.offsetX = target.x - clientX;
        drag.offsetY = target.y - (clientY + window.scrollY);
        drag.lastX = clientX;
        drag.lastY = clientY;
        drag.lastT = performance.now();
        drag.vx = 0;
        drag.vy = 0;
        drag.moved = 0;
        drag.pointerId = pointerId;
        target.dragging = true;
        target.vx = 0;
        target.vy = 0;
        document.body.classList.add("bg-grabbing");
        document.body.classList.remove("bg-can-grab");
        if (currentMode && typeof currentMode.grab === "function") {
            currentMode.grab(target, clientX, clientY + window.scrollY);
        }
    };

    const moveDrag = (clientX, clientY) => {
        if (!drag.active || !drag.target) {
            return;
        }
        const now = performance.now();
        const dtMove = Math.max(8, now - drag.lastT);
        const nx = clientX + drag.offsetX;
        const ny = clientY + window.scrollY + drag.offsetY;
        drag.vx = ((nx - drag.target.x) / dtMove) * 16.7;
        drag.vy = ((ny - drag.target.y) / dtMove) * 16.7;
        drag.moved += Math.abs(clientX - drag.lastX) + Math.abs(clientY - drag.lastY);
        drag.lastX = clientX;
        drag.lastY = clientY;
        drag.lastT = now;
        drag.target.x = nx;
        drag.target.y = ny;
        if (currentMode && typeof currentMode.dragMove === "function") {
            currentMode.dragMove(drag.target, clientX, clientY + window.scrollY, drag.vx, drag.vy);
        }
    };

    const endDrag = () => {
        if (!drag.active) {
            return false;
        }
        const target = drag.target;
        const moved = drag.moved;
        if (target) {
            target.dragging = false;
            target.vx = clamp(drag.vx, -LAUNCH_SPEED, LAUNCH_SPEED);
            target.vy = clamp(drag.vy, -LAUNCH_SPEED, LAUNCH_SPEED);
            if (currentMode && typeof currentMode.release === "function") {
                currentMode.release(target, target.vx, target.vy);
            }
            if (typeof target.lane === "number") {
                const contentWidth = Math.min(CONTENT_MAX_WIDTH, width);
                const gutter = (width - contentWidth) * 0.5;
                if (width >= GUTTER_MIN_WIDTH && gutter > 70) {
                    target.lane = target.x < gutter + 24 ? -1 : target.x > width - gutter - 24 ? 1 : 0;
                } else {
                    target.lane = 0;
                }
            }
        }
        drag.active = false;
        drag.target = null;
        drag.pointerId = null;
        drag.moved = 0;
        document.body.classList.remove("bg-grabbing");
        return moved > 6;
    };

    const cancelLongPress = () => {
        if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    };

    const blastAt = (clickX, clickY) => {
        if (!enabled || reducedMotion || !currentMode) {
            return;
        }
        const blastRadiusSq = BLAST_RADIUS * BLAST_RADIUS;
        const rng = createRng();
        const blastItem = (item, extra) => {
            if (!item || typeof item.x !== "number" || typeof item.y !== "number") {
                return;
            }
            const dx = item.x - clickX;
            const dy = item.y - clickY;
            const distSq = dx * dx + dy * dy;
            if (distSq >= blastRadiusSq || distSq <= 0.01) {
                return;
            }
            const dist = Math.sqrt(distSq);
            const force = (BLAST_RADIUS - dist) / BLAST_RADIUS;
            const push = force * force * 14;
            const inv = 1 / dist;
            if (typeof item.vx === "number") {
                item.vx += dx * inv * push;
            }
            if (typeof item.vy === "number") {
                item.vy += dy * inv * push;
            }
            if (extra) {
                extra(item, force, dx, dy, inv);
            }
        };
        currentMode.blast(rng, blastItem, clickX, clickY);
    };

    const clearMouse = () => {
        mouse.x = -1000;
        mouse.y = -1000;
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
        ensurePanel();
        applyFrost();
        renderPanel();
        if (!enabled) {
            stopAnimation(true);
            return;
        }
        startAnimation();
    };

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    }, { passive: true });
    window.addEventListener("mouseleave", clearMouse);
    document.addEventListener("mouseout", (e) => {
        if (!e.relatedTarget) {
            clearMouse();
        }
    });
    window.addEventListener("blur", clearMouse);
    window.addEventListener("touchmove", (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });
    window.addEventListener("touchend", clearMouse);

    window.addEventListener("click", (e) => {
        if (pointerTap.blasted) {
            pointerTap.blasted = false;
            return;
        }
        if (e.target.closest(INTERACTIVE_SELECTOR)) {
            return;
        }
        if (!enabled || reducedMotion) {
            return;
        }
        blastAt(e.clientX, e.clientY + window.scrollY);
    });

    const themeObserver = new MutationObserver(() => {
        colors = getThemeColors();
        particleColorStr = rgbToString(colors.particleRgb);
        accentColorStr = rgbToString(colors.hoverAccentRgb);
        bgColorStr = rgbToString(colors.bgRgb);
        sprites = makeSprites(colors);
        if (reducedMotion && enabled && simReady) {
            drawStatic();
        }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    document.addEventListener("visibilitychange", () => {
        isPageVisible = !document.hidden;
        if (isPageVisible && enabled && !reducedMotion) {
            lastFrameTime = 0;
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

    window.addEventListener("pointerdown", (e) => {
        pointerTap.interactive = !!e.target.closest(INTERACTIVE_SELECTOR);
        pointerTap.blasted = false;
        pointerTap.x = e.clientX;
        pointerTap.y = e.clientY;
        if (!enabled || reducedMotion || pointerTap.interactive) {
            return;
        }
        const absX = e.clientX;
        const absY = e.clientY + window.scrollY;
        const target = hitTest(absX, absY);
        if (!target) {
            return;
        }
        if (width >= GUTTER_MIN_WIDTH) {
            beginDrag(target, e.clientX, e.clientY, e.pointerId);
            e.preventDefault();
            return;
        }
        cancelLongPress();
        pressStartX = e.clientX;
        pressStartY = e.clientY;
        const sx = e.clientX;
        const sy = e.clientY;
        const id = e.pointerId;
        longPressTimer = setTimeout(() => {
            longPressTimer = null;
            beginDrag(target, sx, sy, id);
        }, 380);
    });

    window.addEventListener("pointermove", (e) => {
        if (longPressTimer !== null) {
            if (Math.abs(e.clientX - pressStartX) + Math.abs(e.clientY - pressStartY) > 10) {
                cancelLongPress();
            }
        }
        if (drag.active) {
            moveDrag(e.clientX, e.clientY);
            e.preventDefault();
            return;
        }
        if (!enabled || reducedMotion || width < GUTTER_MIN_WIDTH) {
            if (hoverGrab) {
                document.body.classList.remove("bg-can-grab");
                hoverGrab = false;
            }
            return;
        }
        const now = performance.now();
        if (now - hoverCheckAt < 32) {
            return;
        }
        hoverCheckAt = now;
        const over = hitTest(e.clientX, e.clientY + window.scrollY);
        if (over && !hoverGrab) {
            document.body.classList.add("bg-can-grab");
            hoverGrab = true;
        } else if (!over && hoverGrab) {
            document.body.classList.remove("bg-can-grab");
            hoverGrab = false;
        }
    }, { passive: false });

    const finishPointer = (e) => {
        cancelLongPress();
        const draggedFar = endDrag();
        if (!e || e.type === "pointercancel") {
            pointerTap.blasted = true;
            return;
        }
        if (draggedFar || pointerTap.interactive || pointerTap.blasted) {
            pointerTap.blasted = true;
            return;
        }
        if (!enabled || reducedMotion) {
            return;
        }
        const x = e.clientX != null ? e.clientX : pointerTap.x;
        const y = e.clientY != null ? e.clientY : pointerTap.y;
        blastAt(x, y + window.scrollY);
        pointerTap.blasted = true;
    };

    window.addEventListener("pointerup", finishPointer);
    window.addEventListener("pointercancel", finishPointer);

    if (toggleButton) {
        toggleButton.addEventListener("click", (e) => {
            e.stopPropagation();
            ensurePanel();
            renderPanel();
            setPanelOpen(panelEl.hidden);
        });
    }

    applyFrost();
    ensurePanel();

    if (document.readyState === "complete") {
        initializeParticlesWhenReady();
    } else {
        window.addEventListener("load", initializeParticlesWhenReady);
    }

    return {
        updateCanvasDimensions,
        scheduleDimensionUpdate,
        setEnabled,
        openPanel: () => {
            ensurePanel();
            renderPanel();
            setPanelOpen(true);
        },
    };
}
