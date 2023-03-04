import { Vector2 } from "three";
import { clamp } from "three/src/math/MathUtils";

const MAX_COUNT = 1024;
const WORLD_SIZE = 512;
const CELL_SIZE = 16;

const grid: number[][][] = [];
for (let y = 0; y < WORLD_SIZE / CELL_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < WORLD_SIZE / CELL_SIZE; x++) {
        grid[y][x] = [];
    }
}

const color_id = new Uint8Array(MAX_COUNT);
const pos_x = new Float32Array(MAX_COUNT);
const pos_y = new Float32Array(MAX_COUNT);
const vel_x = new Float32Array(MAX_COUNT);
const vel_y = new Float32Array(MAX_COUNT);

const state = {
    colors: [] as readonly string[],
    forces: [] as readonly number[][],
    particleCount: 0,
    minDist: 16,
    maxDist: 32,
};

const canvas = document.createElement("canvas");

const systems = [
    function updateGrid() {
        const cellCount = Math.floor(WORLD_SIZE / CELL_SIZE);

        // Clear gird
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y].length; x++) {
                grid[y][x].length = 0;
            }
        }

        // Populate gird
        for (let id = 0; id < state.particleCount; id++) {
            const x = Math.floor(pos_x[id] / CELL_SIZE);
            const y = Math.floor(pos_y[id] / CELL_SIZE);

            const r = Math.ceil(state.maxDist / CELL_SIZE);

            const min_x = Math.max(x - r, 0);
            const max_x = Math.min(x + r, cellCount - 1);
            const min_y = Math.max(y - r, 0);
            const max_y = Math.min(y + r, cellCount - 1);

            for (let y = min_y; y < max_y; y++) {
                for (let x = min_x; x < max_x; x++) {
                    grid[y][x].push(id);
                }
            }
        }
    },

    function attractionSystem() {
        const minDist = state.minDist;
        const maxDist = state.maxDist;
        const maxDistSq = state.maxDist ** 2;

        const p1 = new Vector2();
        const p2 = new Vector2();
        const dir = new Vector2();

        for (let id1 = 0; id1 < state.particleCount; id1++) {
            const x = Math.floor(pos_x[id1] / CELL_SIZE);
            const y = Math.floor(pos_y[id1] / CELL_SIZE);

            vel_x[id1] = 0;
            vel_y[id1] = 0;

            grid[y][x].forEach((id2) => {
                p1.set(pos_x[id1], pos_y[id1]);
                p2.set(pos_x[id2], pos_y[id2]);
                if (p1.distanceToSquared(p2) > maxDistSq) {
                    return;
                }

                dir.x = p2.x - p1.x;
                dir.y = p2.y - p1.y;
                dir.normalize();

                const dist = p1.distanceTo(p2);
                if (dist < minDist) {
                    dir.multiplyScalar(-(minDist - dist));
                } else {
                    dir.multiplyScalar(maxDist / (maxDist - (dist - minDist)));
                }

                const c1 = color_id[id1];
                const c2 = color_id[id2];
                vel_x[id1] += dir.x * state.forces[c1][c2];
                vel_y[id1] += dir.y * state.forces[c1][c2];
            });
        }
    },

    function applyFriction() {
        for (let id = 0; id < state.particleCount; id++) {
            // vel_x[id] *= 0.9;
            // vel_y[id] *= 0.9;
        }
    },

    function applyVelocity() {
        for (let id = 0; id < state.particleCount; id++) {
            pos_x[id] += vel_x[id];
            pos_y[id] += vel_y[id];

            pos_x[id] = clamp(pos_x[id], 0, WORLD_SIZE - 1);
            pos_y[id] = clamp(pos_y[id], 0, WORLD_SIZE - 1);
        }
    },

    function drawParticles() {
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let id = 0; id < state.particleCount; id++) {
            ctx.fillStyle = state.colors[color_id[id]];
            ctx.fillRect(pos_x[id], pos_y[id], 4, 4);
        }
    },

    function drawWorldWrap() {
        const ctx = canvas.getContext("2d")!;
        const cols = Math.ceil(canvas.width / WORLD_SIZE);
        const rows = Math.ceil(canvas.height / WORLD_SIZE);

        ctx.globalAlpha = 0.5;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (y === 0 && x === 0) continue;
                ctx.drawImage(
                    canvas,

                    // Frame
                    0,
                    0,
                    WORLD_SIZE,
                    WORLD_SIZE,

                    // Dest
                    x * WORLD_SIZE,
                    y * WORLD_SIZE,
                    WORLD_SIZE,
                    WORLD_SIZE,
                );
            }
        }
        ctx.globalAlpha = 1;
    },
];

{
    document.getElementById("particles")?.appendChild(canvas);
    window.addEventListener("resize", resize);
    resize();

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    requestAnimationFrame(function update() {
        systems.forEach((system) => system());
        requestAnimationFrame(update);
    });
}

export interface ParticleConfig {
    colors: readonly string[];
    forces: readonly number[][];
    particleCount: number;
    maxDist: number;
    minDist: number;
}

export function updateParticleSimulation(props: ParticleConfig) {
    state.colors = props.colors;
    state.forces = props.forces;
    state.maxDist = props.maxDist;
    state.minDist = props.minDist;

    props.particleCount = Math.min(props.particleCount, MAX_COUNT);
    if (state.particleCount > props.particleCount) {
        state.particleCount = props.particleCount;
    } else {
        while (state.particleCount < props.particleCount) {
            color_id[state.particleCount] = Math.random() * state.colors.length;
            pos_x[state.particleCount] = Math.random() * WORLD_SIZE;
            pos_y[state.particleCount] = Math.random() * WORLD_SIZE;
            state.particleCount++;
        }
    }
}
