import Stats from "stats.js";
import { Vector2 } from "three";

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

export function createParticleLife() {
    const store = createStore();

    let tilemap: number[][] = [];
    let particles = createParticles(0);
    store.subscribe((state, prevState) => {
        if (state.particleCount !== prevState.particleCount) {
            particles = createParticles(state.particleCount);

            tilemap.length = 0;
            for (let y = 0; y < TILE_MAP_SIZE; y++) {
                for (let x = 0; x < TILE_MAP_SIZE; x++) {
                    tilemap[y * TILE_MAP_SIZE + x] = [];
                }
            }

            console.log(`Update particle count`);
        }
    });

    const stats = new Stats();
    const canvas = document.createElement("canvas");
    canvas.width = WORLD_SIZE;
    canvas.height = WORLD_SIZE;

    const systems = [
        function attractionSystem() {
            const vector2D = new Vector2();
            const { minDist: MIN_DIST, maxDist: MAX_DIST } = store.snapshot();

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

                        const tile = tilemap[y * TILE_MAP_SIZE + x];
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
            for (let i = 0; i < tilemap.length; i++) {
                tilemap[i].length = 0;
            }

            for (let id = 0; id < particles.size; id++) {
                const x = Math.floor(particles.pos_x[id] / TILE_SIZE);
                const y = Math.floor(particles.pos_y[id] / TILE_SIZE);
                tilemap[y * TILE_MAP_SIZE + x].push(id);
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
                ctx.fillRect(particles.pos_x[id], particles.pos_y[id], 1, 1);
            }
        },
    ];

    function update() {
        stats.begin();
        systems.forEach((system) => system());
        stats.end();
    }

    // Set init conditions
    store.setState({
        particleCount: 1024,
        minDist: 8,
        maxDist: 32,
    });

    return { store, stats, canvas, update };
}

{
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

interface State {
    readonly particleCount: number;
    readonly minDist: number;
    readonly maxDist: number;
}

function createStore() {
    let state: State = {
        particleCount: 0,
        minDist: 0,
        maxDist: 0,
    };

    type Callback = (s: State, ns: State) => void;
    const subscribers = new Set<Callback>();

    return {
        snapshot(): State {
            return state;
        },
        subscribe(notify: Callback) {
            subscribers.add(notify);
            return () => {
                subscribers.delete(notify);
            };
        },
        setState(nextState: Partial<State>) {
            const prevState = state;
            state = { ...state, ...nextState };
            subscribers.forEach((notify) => notify(state, prevState));
        },
    };
}

function createParticles(particleCount: number) {
    const particles = Object.freeze({
        size: particleCount,
        color: new Uint8Array(particleCount),
        pos_x: new Float32Array(particleCount),
        pos_y: new Float32Array(particleCount),
        vel_x: new Float32Array(particleCount),
        vel_y: new Float32Array(particleCount),
    });

    for (let i = 0; i < particleCount; i++) {
        particles.color[i] = Math.floor(Math.random() * COLORS.length);
        particles.pos_x[i] = Math.random() * WORLD_SIZE;
        particles.pos_y[i] = Math.random() * WORLD_SIZE;
    }

    return particles;
}
