import Stats from "stats.js";
import { randFloat } from "three/src/math/MathUtils";

/**
 * CONSTANTS
 */
const WORLD_MIN = 0;
const WORLD_MAX = 512;
const WORLD_RANGE = WORLD_MAX - WORLD_MIN;
const MAX_PARTICLE_COUNT = 1024;

/**
 * STATE
 */
let particleCount = 2;

/**
 * PARTICLES
 */
const pos_x = new Float32Array(MAX_PARTICLE_COUNT);
const pos_y = new Float32Array(MAX_PARTICLE_COUNT);
for (let id = 0; id < MAX_PARTICLE_COUNT; id++) {
    pos_x[id] = randFloat(WORLD_MIN, WORLD_MAX);
    pos_y[id] = randFloat(WORLD_MIN, WORLD_MAX);
}

/**
 * RENDERING
 */
const canvas = document.createElement("canvas");
canvas.width = WORLD_RANGE;
canvas.height = WORLD_RANGE;

const stats = new Stats();
document.getElementById("particles")?.appendChild(canvas);
document.getElementById("particles")?.appendChild(stats.dom);

requestAnimationFrame(function update() {
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
});
