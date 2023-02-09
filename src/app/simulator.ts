export interface Particle {
    readonly colorIndex: number;
    readonly position: { x: number; y: number };
}

export interface SimulatorProps {
    readonly particleColors: number;
    readonly particleCount: number;
    readonly worldWidth: number;
    readonly worldHeight: number;
}

export function createSimulator({
    particleColors,
    particleCount,
    worldWidth,
    worldHeight,
}: SimulatorProps) {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            colorIndex: Math.floor(Math.random() * particleColors),
            position: {
                x: Math.random() * worldWidth,
                y: Math.random() * worldHeight,
            },
        });
    }

    const update = () => {
        // ...
    };

    return Object.freeze({
        particles,
        update,
    });
}
