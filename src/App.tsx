import React, { useEffect, useMemo, useRef, useState } from "react";
import { getAttractionForce, updateParticleSimulation } from "./particles";

export function App() {
    const colors = useColors();
    const [row, setRow] = useState(0);
    const [col, setCol] = useState(0);

    const [minDist, setMinDist] = useState(8);
    const [maxDist, setMaxDist] = useState(48);
    const [friction, setFriction] = useState(0.25);
    const [particleCount, setParticleCount] = useState(64);

    useEffect(() => {
        updateParticleSimulation({
            particleCount,
            maxDist,
            minDist,
            colors: colors.colors,
            forces: colors.getMatrix(),
        });
    }, [particleCount, minDist, maxDist, colors]);

    return (
        <div className="absolute top-4 right-4 p-4 border border-gray-600 bg-gray-900">
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
                    min={16}
                    max={1024}
                    value={particleCount}
                    onChange={setParticleCount}
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Min distance"
                    min={1}
                    max={16}
                    step={0.001}
                    value={minDist}
                    onChange={setMinDist}
                    labelFraction
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Max distance"
                    min={16}
                    max={128}
                    step={0.001}
                    value={maxDist}
                    onChange={setMaxDist}
                    labelFraction
                />
            </div>

            <div className="py-2">
                <Slider
                    label="Friction"
                    min={0}
                    max={1}
                    step={0.001}
                    value={friction}
                    onChange={setFriction}
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
            const attr = getAttractionForce(force, x, minDist, maxDist);
            const y = attr * (height / 2) + height / 2;
            ctx.fillRect(x, y, 1, 1);
        }
    }, [canvasRef, force, minDist, maxDist]);

    return <canvas ref={canvasRef} width={width} height={height} />;
}

function useColors() {
    const [colors] = useState<readonly string[]>([
        "#EB3B5A",
        "#05C46B",
        "#0FBCF9",
        "#fbc531",
    ]);

    const [forceMatrix, setForceMatrix] = useState<readonly number[]>(() => {
        return new Array(colors.length * colors.length).fill(0.5);
    });

    return useMemo(() => {
        const getForce = (row: number, col: number) => {
            return forceMatrix[row * colors.length + col];
        };

        const setForce = (row: number, col: number, force: number) => {
            setForceMatrix((values) => {
                const newValues = [...values];
                newValues[row * colors.length + col] = force;
                return newValues;
            });
        };

        const randomize = () => {
            setForceMatrix((values) =>
                values.map(() => (Math.random() - 0.5) * 2),
            );
        };

        const getMatrix = (): readonly number[][] => {
            const matrix: number[][] = [];

            const size = colors.length;
            for (let row = 0; row < size; row++) {
                matrix[row] = [];
                for (let col = 0; col < size; col++) {
                    matrix[row][col] = forceMatrix[row * size + col];
                }
            }

            return matrix;
        };

        return { colors, getForce, setForce, getMatrix, randomize };
    }, [colors, forceMatrix]);
}
