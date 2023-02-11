import Stats from "stats.js";
import { Vector2 } from "three";

const PARTICLE_COUNT = 1024 * 4;
const MIN_DIST = 8;
const MAX_DIST = 24;

const COLORS = ["#fff", "#0f0", "#f00"];

const FORCE_MATRIX: number[][] = [
    [1, -1, 1],
    [1, 1, 0.2],
    [-1, 1, -1],
    //...
];
const WORLD_SIZE = 512;
const TILE_SIZE = 32;
const TILE_MAP_SIZE = Math.ceil(WORLD_SIZE / TILE_SIZE);

{
    if (TILE_SIZE < MAX_DIST) {
        throw new Error(`TILE_SIZE smaller than MAX_DIST!`);
    }

    for (let i = 0; i < COLORS.length; i++) {
        for (let j = 0; j < COLORS.length; j++) {
            if (
                FORCE_MATRIX[i] === undefined ||
                FORCE_MATRIX[i][j] === undefined
            ) {
                throw new Error("FORCE_MATRIX is empty!");
            }
        }
    }
}

main();

function main() {
    const particles = createParticles();

    const tileMap: readonly number[][] = (() => {
        const tileMap = [];
        for (let y = 0; y < TILE_MAP_SIZE; y++) {
            for (let x = 0; x < TILE_MAP_SIZE; x++) {
                tileMap[y * TILE_MAP_SIZE + x] = [];
            }
        }
        return tileMap;
    })();

    const stats = new Stats();
    const canvas = document.createElement("canvas");
    canvas.width = WORLD_SIZE;
    canvas.height = WORLD_SIZE;
    document.body.appendChild(canvas);
    document.body.appendChild(stats.dom);

    const systems = [
        function attractionSystem() {
            const vector2D = new Vector2();

            for (let id1 = 0; id1 < particles.size; id1++) {
                const tileX = Math.floor(particles.pos_x[id1] / TILE_SIZE);
                const tileY = Math.floor(particles.pos_y[id1] / TILE_SIZE);

                particles.vel_x[id1] = 0;
                particles.vel_y[id1] = 0;

                for (let offsetY = -1; offsetY <= 1; offsetY++) {
                    for (let offsetX = -1; offsetX <= 1; offsetX++) {
                        const x = tileX + offsetX;
                        const y = tileY + offsetY;
                        if (x < 0 || y < 0) continue;
                        if (x >= TILE_MAP_SIZE || y >= TILE_MAP_SIZE) continue;

                        const tile = tileMap[y * TILE_MAP_SIZE + x];
                        for (let j = 0; j < tile.length; j++) {
                            const id2 = tile[j];
                            attractParticle(id1, id2);
                        }
                    }
                }

                particles.vel_x[id1] *= 0.01;
                particles.vel_y[id1] *= 0.01;
            }

            function attractParticle(id1: number, id2: number) {
                const x1 = particles.pos_x[id1];
                const y1 = particles.pos_y[id1];

                const x2 = particles.pos_x[id2];
                const y2 = particles.pos_y[id2];

                const a = x1 - x2;
                const b = y1 - y2;

                const dist = Math.sqrt(a * a + b * b);
                if (dist > MAX_DIST) {
                    return;
                }

                vector2D.x = x2 - x1;
                vector2D.y = y2 - y1;
                vector2D.normalize();

                let force = 1;
                if (dist < MIN_DIST) {
                    force = -(1 - dist / MIN_DIST);
                    force *= 5;
                } else {
                    const c1 = particles.color[id1];
                    const c2 = particles.color[id2];
                    force = (MAX_DIST / dist) * FORCE_MATRIX[c1][c2];
                }

                particles.vel_x[id1] += vector2D.x * force;
                particles.vel_y[id1] += vector2D.y * force;
            }
        },

        function applyVelocity() {
            for (let id = 0; id < particles.size; id++) {
                particles.pos_x[id] += particles.vel_x[id];
                particles.pos_y[id] += particles.vel_y[id];
            }
        },

        function wallWarp() {
            const pad = 1;

            for (let id = 0; id < particles.size; id++) {
                if (particles.pos_x[id] <= pad) {
                    particles.pos_x[id] = WORLD_SIZE - pad;
                } else if (particles.pos_x[id] >= WORLD_SIZE - pad) {
                    particles.pos_x[id] = pad;
                }

                if (particles.pos_y[id] <= pad) {
                    particles.pos_y[id] = WORLD_SIZE - pad;
                } else if (particles.pos_y[id] >= WORLD_SIZE - pad) {
                    particles.pos_y[id] = pad;
                }
            }
        },

        function updateTileMap() {
            for (let i = 0; i < tileMap.length; i++) {
                tileMap[i].length = 0;
            }

            for (let id = 0; id < particles.size; id++) {
                const x = Math.floor(particles.pos_x[id] / TILE_SIZE);
                const y = Math.floor(particles.pos_y[id] / TILE_SIZE);
                tileMap[y * TILE_MAP_SIZE + x].push(id);
            }
        },

        function clearCanvas() {
            const ctx = canvas.getContext("2d")!;
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        },

        function renderParticles() {
            const ctx = canvas.getContext("2d")!;
            for (let id = 0; id < particles.size; id++) {
                ctx.fillStyle = COLORS[particles.color[id]];
                ctx.fillRect(particles.pos_x[id], particles.pos_y[id], 2, 2);
            }
        },

        // function renderTileMap() {
        //     const ctx = canvas.getContext("2d")!;
        //     ctx.fillStyle = "white";
        //     ctx.strokeStyle = "#222";
        //     for (let y = 0; y < TILE_MAP_SIZE; y++) {
        //         for (let x = 0; x < TILE_MAP_SIZE; x++) {
        //             ctx.strokeRect(
        //                 x * TILE_SIZE,
        //                 y * TILE_SIZE,
        //                 TILE_SIZE,
        //                 TILE_SIZE,
        //             );

        //             ctx.fillText(
        //                 tileMap[y * TILE_MAP_SIZE + x].length.toString(),
        //                 x * TILE_SIZE,
        //                 y * TILE_SIZE,
        //             );
        //         }
        //     }
        // },
    ];

    requestAnimationFrame(function frame() {
        stats.begin();
        systems.forEach((system) => system());
        stats.end();
        requestAnimationFrame(frame);
    });
}

type Particles = ReturnType<typeof createParticles>;
function createParticles() {
    const particles = Object.freeze({
        size: PARTICLE_COUNT,
        color: new Uint8Array(PARTICLE_COUNT),
        pos_x: new Float32Array(PARTICLE_COUNT),
        pos_y: new Float32Array(PARTICLE_COUNT),
        vel_x: new Float32Array(PARTICLE_COUNT),
        vel_y: new Float32Array(PARTICLE_COUNT),
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.color[i] = Math.floor(Math.random() * COLORS.length);
        particles.pos_x[i] = Math.random() * WORLD_SIZE;
        particles.pos_y[i] = Math.random() * WORLD_SIZE;
    }

    return particles;
}
