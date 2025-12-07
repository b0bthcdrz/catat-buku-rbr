export type Point = { x: number; y: number };

export async function decodeBase64ToImageBitmap(base64: string): Promise<ImageBitmap> {
	const byteString = atob(base64);
	const array = new Uint8Array(byteString.length);
	for (let i = 0; i < byteString.length; i++) array[i] = byteString.charCodeAt(i);
	const blob = new Blob([array], { type: "image/jpeg" });
	return await createImageBitmap(blob);
}

export function drawImageToCanvas(image: ImageBitmap, width?: number, height?: number): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = width ?? image.width;
	canvas.height = height ?? image.height;
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D not supported");
	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
	return canvas;
}

export function applyCrop(canvas: HTMLCanvasElement, vertices: Point[]): HTMLCanvasElement {
	// Compute bounding box of vertices
	const xs = vertices.map((v) => v.x);
	const ys = vertices.map((v) => v.y);
	const minX = Math.max(0, Math.min(...xs));
	const minY = Math.max(0, Math.min(...ys));
	const maxX = Math.min(canvas.width, Math.max(...xs));
	const maxY = Math.min(canvas.height, Math.max(...ys));
	const w = Math.max(1, Math.round(maxX - minX));
	const h = Math.max(1, Math.round(maxY - minY));

	const out = document.createElement("canvas");
	out.width = w;
	out.height = h;
	const ctx = out.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D not supported");
	ctx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
	return out;
}

export function perspectiveCorrect(
	canvas: HTMLCanvasElement,
	src: [Point, Point, Point, Point],
	dstWidth: number,
	dstHeight: number
): HTMLCanvasElement {
	// Use setTransform on small strips to approximate perspective correction
	const out = document.createElement("canvas");
	out.width = dstWidth;
	out.height = dstHeight;
	const ctx = out.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D not supported");

	const [tl, tr, br, bl] = src; // assume clockwise
	const steps = dstHeight; // row-by-row warp
	for (let y = 0; y < steps; y++) {
		const t = y / steps;
		const sx1 = tl.x + (bl.x - tl.x) * t;
		const sy1 = tl.y + (bl.y - tl.y) * t;
		const sx2 = tr.x + (br.x - tr.x) * t;
		const sy2 = tr.y + (br.y - tr.y) * t;
		const sw = Math.hypot(sx2 - sx1, sy2 - sy1);
		const dx = 0;
		const dy = y;
		const dw = dstWidth;
		const dh = 1;
		ctx.drawImage(canvas, sx1, sy1, sw, 1, dx, dy, dw, dh);
	}
	return out;
}

export function autoAdjustContrastBrightness(canvas: HTMLCanvasElement, contrast = 1.15, brightness = 10): HTMLCanvasElement {
	const out = document.createElement("canvas");
	out.width = canvas.width;
	out.height = canvas.height;
	const ctx = out.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D not supported");
	const srcCtx = canvas.getContext("2d");
	if (!srcCtx) throw new Error("Canvas 2D not supported");
	const imageData = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
	const data = imageData.data;
	const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
	for (let i = 0; i < data.length; i += 4) {
		data[i] = clamp(factor * (data[i] - 128) + 128 + brightness);
		data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + brightness);
		data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + brightness);
	}
	ctx.putImageData(imageData, 0, 0);
	return out;
}

export function trimMargins(canvas: HTMLCanvasElement, threshold = 245): HTMLCanvasElement {
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas 2D not supported");
	const { width, height } = canvas;
	const data = ctx.getImageData(0, 0, width, height).data;

	function isRowBlank(y: number): boolean {
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			if (Math.max(r, g, b) < threshold) return false;
		}
		return true;
	}
	function isColBlank(x: number): boolean {
		for (let y = 0; y < height; y++) {
			const idx = (y * width + x) * 4;
			const r = data[idx];
			const g = data[idx + 1];
			const b = data[idx + 2];
			if (Math.max(r, g, b) < threshold) return false;
		}
		return true;
	}

	let top = 0;
	while (top < height - 1 && isRowBlank(top)) top++;
	let bottom = height - 1;
	while (bottom > 0 && isRowBlank(bottom)) bottom--;
	let left = 0;
	while (left < width - 1 && isColBlank(left)) left++;
	let right = width - 1;
	while (right > 0 && isColBlank(right)) right--;

	const w = Math.max(1, right - left + 1);
	const h = Math.max(1, bottom - top + 1);

	const out = document.createElement("canvas");
	out.width = w;
	out.height = h;
	const outCtx = out.getContext("2d");
	if (!outCtx) throw new Error("Canvas 2D not supported");
	outCtx.drawImage(canvas, left, top, w, h, 0, 0, w, h);
	return out;
}

export function canvasToJpegDataUrl(canvas: HTMLCanvasElement, quality = 0.9): string {
	return canvas.toDataURL("image/jpeg", quality);
}

function clamp(v: number): number {
	return Math.max(0, Math.min(255, Math.round(v)));
} 