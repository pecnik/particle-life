import React, { useEffect, useState } from "react";
import { createParticles } from "./particles";

const particles = createParticles();

export function App() {
    const [container, setContainer] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        let mounted = true;
        container?.appendChild(particles.dom);
        requestAnimationFrame(function update() {
            if (mounted) {
                particles.update();
                requestAnimationFrame(update);
            }
        });

        return () => {
            mounted = false;
            container?.removeChild(particles.dom);
        };
    }, [container]);

    return (
        <div className="flex flex-row w-screen h-screen overflow-hidden">
            <div
                ref={setContainer}
                className="flex-1 overflow-auto flex flex-wrap justify-center content-center"
            />
            <div className="w-80 bg-gray-900">Menu</div>
        </div>
    );
}
