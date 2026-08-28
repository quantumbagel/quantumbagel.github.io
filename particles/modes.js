const MODE_LOADERS = {
    molecules: () => import("./modes/molecules.js"),
    network: () => import("./modes/network.js"),
    orbits: () => import("./modes/orbits.js"),
    stars: () => import("./modes/stars.js"),
    epicycles: () => import("./modes/epicycles.js"),
    aurora: () => import("./modes/aurora.js"),
    pendulum: () => import("./modes/pendulum.js"),
    crystal: () => import("./modes/crystal.js"),
    flock: () => import("./modes/flock.js"),
    field: () => import("./modes/field.js"),
    rain: () => import("./modes/rain.js"),
    life: () => import("./modes/life.js"),
};

const cache = Object.create(null);

export function loadModeModule(id) {
    const loader = MODE_LOADERS[id];
    if (!loader) {
        return Promise.reject(new Error(`Unknown background mode: ${id}`));
    }
    if (!cache[id]) {
        cache[id] = loader();
    }
    return cache[id];
}
