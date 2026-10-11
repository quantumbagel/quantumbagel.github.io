import { initParticleBackground } from "./engine.js";

function bootParticles() {
    const canvas = document.getElementById("interactive-bg");
    if (!canvas || window.particleApi) {
        return window.particleApi || null;
    }

    const api = initParticleBackground(canvas, {
        toggleButton: document.getElementById("particle-toggle"),
    });
    window.initParticleBackground = initParticleBackground;
    window.particleApi = api;
    window.dispatchEvent(new CustomEvent("particles-ready", { detail: api }));
    return api;
}

window.initParticleBackground = initParticleBackground;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootParticles);
} else {
    bootParticles();
}
