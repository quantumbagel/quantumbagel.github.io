import { SPRITE_SIZE } from "./config.js";
import { mixRgb } from "./core.js";

export function makeAtomSprite(rgb, highlight, pixelSize) {
    const size = Math.max(SPRITE_SIZE, Math.round(pixelSize || SPRITE_SIZE));
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext("2d");
    const cx = size * 0.5;
    const cy = size * 0.5;
    const r = size * 0.5 - 1;
    const R = rgb.r;
    const G = rgb.g;
    const B = rgb.b;
    const lightT = highlight ? 0.78 : 0.62;
    const light = {
        r: Math.min(255, Math.round(R + (255 - R) * lightT)),
        g: Math.min(255, Math.round(G + (255 - G) * lightT)),
        b: Math.min(255, Math.round(B + (255 - B) * lightT)),
    };
    const dark = {
        r: Math.round(R * 0.22),
        g: Math.round(G * 0.22),
        b: Math.round(B * 0.22),
    };
    const midDark = {
        r: Math.round(R * 0.52),
        g: Math.round(G * 0.52),
        b: Math.round(B * 0.52),
    };
    const grd = g.createRadialGradient(cx - r * 0.32, cy - r * 0.34, r * 0.06, cx + r * 0.08, cy + r * 0.1, r);
    grd.addColorStop(0, `rgb(${light.r}, ${light.g}, ${light.b})`);
    grd.addColorStop(0.32, `rgb(${Math.round(R)}, ${Math.round(G)}, ${Math.round(B)})`);
    grd.addColorStop(0.72, `rgb(${midDark.r}, ${midDark.g}, ${midDark.b})`);
    grd.addColorStop(1, `rgb(${dark.r}, ${dark.g}, ${dark.b})`);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = highlight ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.42)";
    g.beginPath();
    g.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.22, r * 0.15, -0.5, 0, Math.PI * 2);
    g.fill();
    return canvas;
}

export function rebuildSprites(colors, dpr) {
    const pixelSize = Math.round(SPRITE_SIZE * Math.max(1, dpr || 1));
    return {
        carbon: makeAtomSprite(colors.particleRgb, false, pixelSize),
        hydrogen: makeAtomSprite(mixRgb(colors.particleRgb, { r: 255, g: 255, b: 255 }, 0.18), false, pixelSize),
        hetero: makeAtomSprite(colors.hoverAccentRgb, false, pixelSize),
        accent: makeAtomSprite(colors.hoverAccentRgb, true, pixelSize),
    };
}
