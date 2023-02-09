import React, { useEffect, useState } from "react";
import { createRenderer } from "./renderer";
import { createStore } from "./store";

const store = createStore();
const renderer = createRenderer();

export function App() {
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    useEffect(() => {
        let mounted = true;
        container?.appendChild(renderer.canvas);

        requestAnimationFrame(function frame() {
            if (mounted) {
                renderer.render(store.update());
                requestAnimationFrame(frame);
            }
        });

        return () => {
            mounted = false;
            container?.removeChild(renderer.canvas);
        };
    }, [container]);
    return (
        <div className="w-screen h-screen flex text-gray-100 bg-gray-800">
            <div className="w-64"></div>
            <div
                ref={setContainer}
                className="flex-1 flex flex-wrap justify-center content-center bg-black"
            />
        </div>
    );
}
