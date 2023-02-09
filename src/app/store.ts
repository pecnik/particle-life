import { Vector2 } from "three";

export interface State {
    readonly particles: readonly Particle[];
    readonly forceMatrix: readonly number[][];
    readonly worldWidth: number;
    readonly worldHeight: number;
}

export interface Particle {
    readonly color: number;
    readonly position: Vector2;
}

export function createStore() {
    const subscribers = new Set<Function>();

    let state = initState();

    const vector2 = new Vector2();
    const updateParticle = (particle: Particle) => {
        let forceX = 0;
        let forceY = 0;
        state.particles.forEach((peer) => {
            const dist = particle.position.distanceTo(peer.position);
            const force = getForce(dist);

            vector2
                .copy(particle.position)
                .sub(peer.position)
                .normalize()
                .multiplyScalar(-force);

            forceX += vector2.x;
            forceY += vector2.y;
        });

        particle.position.x += forceX * 0.1;
        particle.position.y += forceY * 0.1;
    };

    return {
        update(): readonly Particle[] {
            state.particles.forEach(updateParticle);
            return state.particles;
        },
        snapshot(): State {
            return state;
        },
        subscribe(notify: Function) {
            subscribers.add(notify);
            return () => {
                return subscribers.delete(notify);
            };
        },
    };
}

function initState(): State {
    const particles: Particle[] = [];
    const forceMatrix: number[][] = [];
    const worldWidth: number = 512;
    const worldHeight: number = 512;

    for (let i = 0; i < 32; i++) {
        particles.push({
            color: 0,
            position: new Vector2(
                Math.random() * worldWidth,
                Math.random() * worldHeight,
            ),
        });
    }

    return {
        particles,
        forceMatrix,
        worldWidth,
        worldHeight,
    };
}

function getForce(dist: number, minDist = 16, atrDist = 64) {
    if (dist < minDist) {
        return dist / minDist - 1;
    }

    dist -= minDist;

    if (dist > atrDist * 2) {
        return 0;
    }

    if (dist < atrDist) {
        return dist / atrDist;
    }

    return 1 - dist / atrDist + 1;
}
