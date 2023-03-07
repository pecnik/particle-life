import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { randFloat } from "three/src/math/MathUtils";
import {
    getAttractionForce,
    MAX_PARTICLE_COUNT,
    MIN_PARTICLE_COUNT,
    store,
} from "./particles";

export function App() {
    const colors = useColors();
    const [row, setRow] = useState(0);
    const [col, setCol] = useState(0);

    const {
        particleCount,
        minAttrDist: minDist,
        maxAttrDist: maxDist,
    } = useSyncExternalStore(store.subscribe, store.getState);

    return (
        <div className="absolute top-4 right-4 bottom-4 overflow-y-auto p-4 border border-gray-600 bg-gray-900">
            <div className="mb-4">
                <ColorMatrix
                    colors={colors}
                    selectedRow={row}
                    selectedCol={col}
                    onChange={(row, col) => {
                        setRow(row);
                        setCol(col);
                    }}
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Attraction"
                    min={-1}
                    max={1}
                    step={0.001}
                    value={colors.getForce(row, col)}
                    onChange={(value) => colors.setForce(row, col, value)}
                    labelFraction
                />
                <ForceGraph
                    force={colors.getForce(row, col)}
                    minDist={minDist}
                    maxDist={maxDist}
                />

                <button
                    onClick={colors.randomize}
                    className={[
                        "transition-all",
                        "mt-4 py-1 px-2 text-center",
                        "w-full",
                        "rounded",
                        "text-gray-200 hover:text-gray-100",
                        "bg-gray-600 hover:bg-gray-500 active:bg-gray-700",
                    ].join(" ")}
                >
                    Randomize
                </button>
            </div>

            <hr className="my-4 border-gray-700" />

            <div className="py-2">
                <Slider
                    label="Particle count"
                    min={MIN_PARTICLE_COUNT}
                    max={MAX_PARTICLE_COUNT}
                    value={particleCount}
                    onChange={(particleCount) => {
                        store.setState({ particleCount });
                    }}
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Max distance"
                    min={16}
                    max={128}
                    step={0.001}
                    value={maxDist}
                    onChange={(maxAttrDist) => store.setState({ maxAttrDist })}
                    labelFraction
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Min distance"
                    min={1}
                    max={16}
                    step={0.001}
                    value={minDist}
                    onChange={(minAttrDist) => store.setState({ minAttrDist })}
                    labelFraction
                />
            </div>
        </div>
    );
}

function Slider({
    label,
    value,
    onChange,
    min,
    max,
    step,
    labelFraction,
}: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    labelFraction?: boolean;
}) {
    return (
        <div>
            <label className="w-full flex justify-between text-sm text-gray-400">
                <span>{label}</span>
                <span>{labelFraction ? value.toFixed(2) : value}</span>
            </label>
            <input
                className="w-full"
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(ev) => {
                    onChange(ev.target.valueAsNumber);
                }}
            />
        </div>
    );
}

function ColorMatrix({
    colors,
    selectedRow,
    selectedCol,
    onChange = () => {},
}: {
    colors: ReturnType<typeof useColors>;
    selectedRow?: number;
    selectedCol?: number;
    onChange?: (row: number, col: number) => void;
}) {
    return (
        <div className="flex flex-col gap-1">
            {/* Header */}
            <div className="flex flex-row gap-1">
                <div className="w-8 h-8" />
                {colors.colors.map((color) => (
                    <div
                        key={color}
                        style={{ backgroundColor: color }}
                        className="w-8 h-8 opacity-75"
                    />
                ))}
            </div>
            {colors.colors.map((color, row) => (
                <div key={color} className="h-8 flex flex-row gap-1">
                    <div
                        key={color}
                        style={{ backgroundColor: color }}
                        className="w-8 h-8 opacity-75"
                    />
                    {colors.colors.map((color, col) => {
                        const force = colors.getForce(row, col);
                        return (
                            <button
                                key={color}
                                onClick={() => onChange(row, col)}
                                className={
                                    row === selectedRow && col === selectedCol
                                        ? "w-8 h-8 border border-gray-500"
                                        : "w-8 h-8 border border-gray-700 hover:border-gray-500"
                                }
                            >
                                <div
                                    className="w-full h-full"
                                    style={{
                                        opacity: Math.abs(force).toFixed(2),
                                        backgroundColor:
                                            force < 0 ? "red" : "green",
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function ForceGraph({
    force,
    minDist,
    maxDist,
}: {
    force: number;
    minDist: number;
    maxDist: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const width = 196;
    const height = 64;

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;

        // Clear
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        // X-Axis
        ctx.strokeStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.closePath();

        // X-Axis
        ctx.fillStyle = "red";

        for (let x = 0; x < width; x++) {
            const attr = getAttractionForce(x, force, minDist, maxDist);
            const y = attr * (height / 2) + height / 2;
            ctx.fillRect(x, y, 4, 4);
        }
    }, [canvasRef, force, minDist, maxDist]);

    return <canvas ref={canvasRef} width={width} height={height} />;
}

function useColors() {
    const { colors, forces } = useSyncExternalStore(
        store.subscribe,
        store.getState,
    );

    return useMemo(() => {
        const getForce = (row: number, col: number) => {
            return forces[row][col];
        };

        const setForce = (row: number, col: number, force: number) => {
            const newRow = [...forces[row]];
            newRow[col] = force;

            const newForces = [...forces];
            newForces[row] = newRow;

            store.setState({ forces: newForces });
        };

        const randomize = () => {
            store.setState({
                forces: forces.map((row) => row.map(() => randFloat(-1, 1))),
            });
        };

        return { colors, getForce, setForce, randomize };
    }, [colors, forces]);
}
