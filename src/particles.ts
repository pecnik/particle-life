import Stats from "stats.js";
import { Vector2 } from "three";
import { clamp, randFloat, randInt } from "three/src/math/MathUtils";

/**
 * CONSTANTS
 */
export const WORLD_MIN = 0;
export const WORLD_MAX = 512;
export const WORLD_RANGE = WORLD_MAX - WORLD_MIN;
export const MAX_COLOR_COUNT = 16;
export const MIN_PARTICLE_COUNT = 0;
export const MAX_PARTICLE_COUNT = 4096;

/**
 * STORE
 */
export const store = createStore();

/**
 * PARTICLES
 */
const color_id = new Uint8Array(MAX_PARTICLE_COUNT);
const pos_x = new Float32Array(MAX_PARTICLE_COUNT);
const pos_y = new Float32Array(MAX_PARTICLE_COUNT);
const vel_x = new Float32Array(MAX_PARTICLE_COUNT);
const vel_y = new Float32Array(MAX_PARTICLE_COUNT);
for (let id = 0; id < MAX_PARTICLE_COUNT; id++) {
    color_id[id] = randInt(0, store.getState().colors.length - 1);
    pos_x[id] = randFloat(WORLD_MIN, WORLD_MAX);
    pos_y[id] = randFloat(WORLD_MIN, WORLD_MAX);
}

/**
 * UTILS
 */
function worldWrap(val: number) {
    while (val >= WORLD_MAX) val -= WORLD_RANGE;
    while (val <= WORLD_MIN) val += WORLD_RANGE;
    return val;
}

function worldShortDist(a: number, b: number) {
    const d1 = worldWrap(a - b);
    const d2 = worldWrap(b - a);
    if (d1 < d2) {
        return d1;
    } else {
        return -d2;
    }
}

function clampVelocity(x: number, maxVel = 1.0) {
    return (x * maxVel) / (x + 1);
}

export function getAttractionForce(
    dist: number,
    force: number,
    minDist: number,
    maxDist: number,
) {
    if (dist > maxDist) {
        return 0;
    }

    if (dist < minDist) {
        return -(1 - dist / minDist);
    }

    maxDist -= minDist;
    dist -= minDist;

    if (dist > maxDist / 2) {
        return (1 - dist / maxDist) * force;
    }
    return (dist / maxDist) * force;
}

/**
 * RENDERING
 */
const canvas = document.createElement("canvas");
const stats = new Stats();
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.getElementById("particles")?.appendChild(canvas);
document.getElementById("particles")?.appendChild(stats.dom);
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

requestAnimationFrame(function update() {
    stats.begin();
    requestAnimationFrame(update);

    const {
        forces,
        particleCount,
        particleRenderSize,
        maxAttrDist,
        minAttrDist,
    } = store.getState();

    // Attraction force
    const dir = new Vector2();
    for (let id1 = 0; id1 < particleCount; id1++) {
        vel_x[id1] = 0;
        vel_y[id1] = 0;

        for (let id2 = 0; id2 < particleCount; id2++) {
            if (id1 === id2) continue;

            let dist_x = worldShortDist(pos_x[id1], pos_x[id2]);
            let dist_y = worldShortDist(pos_y[id1], pos_y[id2]);
            if (Math.abs(dist_x) > maxAttrDist) continue;
            if (Math.abs(dist_y) > maxAttrDist) continue;

            dir.x = dist_x;
            dir.y = dist_y;

            const dist = dir.length();

            const color1 = color_id[id1];
            const color2 = color_id[id2];
            const force = getAttractionForce(
                dist,
                forces[color1][color2],
                minAttrDist,
                maxAttrDist,
            );

            dir.normalize();

            vel_x[id1] -= dir.x * force;
            vel_y[id1] -= dir.y * force;
        }

        dir.x = vel_x[id1];
        dir.y = vel_y[id1];

        const length = clampVelocity(dir.length());
        dir.normalize();

        vel_x[id1] = dir.x * length;
        vel_y[id1] = dir.y * length;
    }

    // Apply velocity
    for (let id = 0; id < particleCount; id++) {
        pos_x[id] = worldWrap(pos_x[id] + vel_x[id]);
        pos_y[id] = worldWrap(pos_y[id] + vel_y[id]);
    }

    // Clear canvas
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw particles
    const { colors } = store.getState();
    for (let id = 0; id < particleCount; id++) {
        ctx.fillStyle = colors[color_id[id]];
        ctx.fillRect(
            pos_x[id],
            pos_y[id],
            particleRenderSize,
            particleRenderSize,
        );
    }

    {
        const ctx = canvas.getContext("2d")!;
        const cols = Math.ceil(canvas.width / WORLD_RANGE);
        const rows = Math.ceil(canvas.height / WORLD_RANGE);

        ctx.globalAlpha = 1.0;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (y === 0 && x === 0) continue;
                ctx.drawImage(
                    canvas,

                    // Frame
                    0,
                    0,
                    WORLD_RANGE,
                    WORLD_RANGE,

                    // Dest
                    x * WORLD_RANGE,
                    y * WORLD_RANGE,
                    WORLD_RANGE,
                    WORLD_RANGE,
                );
            }
        }
        ctx.globalAlpha = 1;
    }

    stats.end();
});

interface State {
    readonly forces: readonly (readonly number[])[];
    readonly colors: readonly string[];
    readonly particleCount: number;
    readonly particleRenderSize: number;
    readonly maxAttrDist: number;
    readonly minAttrDist: number;
}

function createStore() {
    const subscriptions = new Set<Function>();

    let state: State = {
        colors: [
            "#EB3B5A",
            "#05C46B",
            "#0FBCF9",
            "#FBC531",
            // "#E0FFFF",
            // "#F0E68C",
            // "#FFEFD5",
            // "#ADFF2F",
        ],
        forces: initForces(),
        particleCount: 512,
        particleRenderSize: 2,
        maxAttrDist: 32,
        minAttrDist: 8,
    };

    function initForces() {
        const result: number[][] = [];
        for (let row = 0; row < MAX_COLOR_COUNT; row++) {
            result[row] = [];
            for (let col = 0; col < MAX_COLOR_COUNT; col++) {
                result[row][col] = randFloat(-1, 1);
            }
        }

        return result;
    }

    return {
        getState() {
            return state;
        },
        setState(newState: Partial<State>) {
            state = { ...state, ...newState };
            subscriptions.forEach((notify) => notify());
            console.log(newState);
        },
        subscribe(notify: Function) {
            subscriptions.add(notify);
            return () => {
                subscriptions.delete(notify);
            };
        },
    };
}
