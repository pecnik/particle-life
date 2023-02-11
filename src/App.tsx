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
        <div>
            <div
                ref={setContainer}
                className="absolute inset-0 flex flex-wrap justify-center content-center"
            />
        </div>
    );
}
