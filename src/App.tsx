import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { clamp, randFloat } from "three/src/math/MathUtils";
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
        particleRenderSize,
        minAttrDist,
        maxAttrDist,
        // ...
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
                    minDist={minAttrDist}
                    maxDist={maxAttrDist}
                />
            </div>

            <hr className="my-4 border-gray-700" />

            <div className="py-2">
                <Slider
                    label="Particle count"
                    min={MIN_PARTICLE_COUNT}
                    max={MAX_PARTICLE_COUNT}
                    step={128}
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
                    value={maxAttrDist}
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
                    value={minAttrDist}
                    onChange={(minAttrDist) => store.setState({ minAttrDist })}
                    labelFraction
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Particle render size"
                    min={1}
                    max={4}
                    step={1}
                    value={particleRenderSize}
                    onChange={(particleRenderSize) =>
                        store.setState({ particleRenderSize })
                    }
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
    const colorCell = (color: string) => (
        <div
            key={color}
            style={{ backgroundColor: color }}
            className="w-6 h-6 rounded"
        />
    );

    const forceCellColor = (force: number) => {
        const toHex = (value: number) => {
            value = Math.floor(value * 255);
            value = clamp(value, 0, 255);
            return value.toString(16).padStart(2, "00");
        };
        const R = toHex(-force);
        const G = toHex(force);
        const B = toHex(0.1);

        return {
            backgroundColor: `#${R}${G}${B}`,
        };
    };

    return (
        <div className="flex flex-col gap-1">
            {/* Header */}
            <div className="flex flex-row gap-1">
                <div className="w-6 h-6 rounded" />
                {colors.colors.map(colorCell)}
            </div>

            {/* Colors */}
            {colors.colors.map((color, row) => (
                <div key={color} className="h-6 flex flex-row gap-1">
                    {colorCell(color)}
                    {colors.colors.map((color, col) => {
                        const force = colors.getForce(row, col);
                        return (
                            <button
                                key={color}
                                onClick={() => onChange(row, col)}
                                className={
                                    row === selectedRow && col === selectedCol
                                        ? "w-6 h-6 outline outline-1 outline-gray-400"
                                        : "w-6 h-6"
                                }
                            >
                                <div
                                    className="w-full h-full"
                                    style={forceCellColor(force)}
                                />
                            </button>
                        );
                    })}

                    <button
                        title="Remove color"
                        className="w-6 h-6"
                        onClick={() => colors.removeColor(row)}
                    >
                        ❌
                    </button>
                </div>
            ))}

            {/* Add color */}
            <button
                onClick={colors.addColor}
                className={[
                    "transition-all",
                    "mt-4 py-1 px-2 text-center",
                    "w-full",
                    "rounded",
                    "text-gray-200 hover:text-gray-100",
                    "bg-gray-600 hover:bg-gray-500 active:bg-gray-700",
                ].join(" ")}
            >
                Add color
            </button>

            {/* Randomize */}
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
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.closePath();

        // X-Axis
        ctx.strokeStyle = "#ffff";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
            const attr = -getAttractionForce(x, force, minDist, maxDist);
            const y = attr * (height / 2) + height / 2;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.closePath();
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

        const addColor = () => {
            const COLOR_LIST = [
                "#EB3B5A",
                "#05C46B",
                "#0FBCF9",
                "#FBC531",
                "#7158e2",
                "#fff200",
                "#ffb8b8",
                "#ADFF2F",
                "#D6A2E8",
            ];

            const nextColor = COLOR_LIST.find((color) => {
                return !colors.includes(color);
            });

            if (nextColor === undefined) {
                return;
            }

            const newColors = [...colors];
            newColors.push(nextColor);

            const newForces = forces.map((row) => {
                const newRow = [...row];
                newRow.push(randFloat(-1, 1));
                return newRow;
            });
            newForces.push(newColors.map(() => randFloat(-1, 1)));

            store.setState({ colors: newColors, forces: newForces });
            store.resetParticles();
        };

        const removeColor = (colorId: number) => {
            const newColors = [...colors];
            newColors.splice(colorId, 1);

            const newForces = forces.map((row) => {
                const newRow = [...row];
                newRow.splice(colorId, 1);
                return newRow;
            });
            newForces.splice(colorId, 1);

            store.setState({ colors: newColors, forces: newForces });
            store.resetParticles();
        };

        return { colors, getForce, setForce, addColor, removeColor, randomize };
    }, [colors, forces]);
}
