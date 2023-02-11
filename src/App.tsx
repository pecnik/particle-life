import React, { useEffect, useState, useSyncExternalStore } from "react";
import { createParticleLife } from "./particles";

const particles = createParticleLife();

export function App() {
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const state = useSyncExternalStore(
        particles.store.subscribe,
        particles.store.snapshot,
    );

    useEffect(() => {
        let mounted = true;
        container?.appendChild(particles.canvas);
        container?.appendChild(particles.stats.dom);
        requestAnimationFrame(function update() {
            if (mounted) {
                particles.update();
                requestAnimationFrame(update);
            }
        });

        return () => {
            mounted = false;
            container?.removeChild(particles.canvas);
            container?.removeChild(particles.stats.dom);
        };
    }, [container]);

    return (
        <div className="flex flex-row w-screen h-screen overflow-hidden">
            <div
                ref={setContainer}
                className="flex-1 overflow-auto flex flex-wrap justify-center content-center"
            />

            {/* Main menu */}
            <div className="w-80 bg-gray-900">
                <div className="p-4 flex flex-col">
                    <label>Particle count - {state.particleCount}</label>
                    <input
                        className="w-full"
                        type="range"
                        min={32}
                        max={1024 * 10}
                        value={state.particleCount}
                        onChange={(ev) => {
                            particles.store.setState({
                                particleCount: ev.target.valueAsNumber,
                            });
                        }}
                    />
                </div>

                <div className="p-4 flex flex-col">
                    <label>Min distance - {state.minDist}</label>
                    <input
                        className="w-full"
                        type="range"
                        min={4}
                        max={32}
                        value={state.minDist}
                        onChange={(ev) => {
                            particles.store.setState({
                                minDist: ev.target.valueAsNumber,
                            });
                        }}
                    />
                </div>

                <div className="p-4 flex flex-col">
                    <label>Max distance - {state.maxDist}</label>
                    <input
                        className="w-full"
                        type="range"
                        min={state.minDist}
                        max={64}
                        value={state.maxDist}
                        onChange={(ev) => {
                            particles.store.setState({
                                maxDist: ev.target.valueAsNumber,
                            });
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
