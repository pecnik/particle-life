import { Particle } from "./store";

export function createRenderer() {
    const [width, height] = [512, 512];
    const canvas = document.createElement("canvas");
    const buffer = document.createElement("canvas");
    Object.assign(canvas, { width, height });
    Object.assign(buffer, { width, height });

    const colors: readonly string[] = [
        "#ef5777",
        "#575fcf",
        "#4bcffa",
        "#0be881",
        "#ffa801",
        "#ffd32a",
        "#ff3f34",
        "#d2dae2",
    ];

    const render = (particles: readonly Particle[]) => {
        const ctx = buffer.getContext("2d")!;
        ctx.fillStyle = "#111";
        ctx.fillRect(0, 0, width, height);

        particles.forEach((p) => {
            ctx.fillStyle = colors[p.color % colors.length];
            ctx.fillRect(p.position.x, p.position.y, 2, 2);
        });

        canvas.getContext("2d")?.drawImage(buffer, 0, 0);
    };

    return { canvas, colors, render };
}
