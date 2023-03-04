import React, { useEffect, useMemo, useState } from "react";
import { updateParticleSimulation } from "./particles";

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
                    {colors.colors.map((color, col) => (
                        <button
                            key={color}
                            onClick={() => onChange(row, col)}
                            className={
                                row === selectedRow && col === selectedCol
                                    ? "w-8 h-8 border border-gray-500 bg-gray-800"
                                    : "w-8 h-8 bg-gray-800 hover:bg-gray-700"
                            }
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

function useColors() {
    const [colors] = useState<readonly string[]>([
        "#EB3B5A",
        "#05C46B",
        "#0FBCF9",
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

        return { colors, getForce, setForce, getMatrix };
    }, [colors, forceMatrix]);
}
