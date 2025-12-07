export type VisionFeature = "DOCUMENT_TEXT_DETECTION" | "CROP_HINTS" | "LABEL_DETECTION";

export type VisionAnnotateRequest = {
	image: { content: string };
	features: { type: VisionFeature; maxResults?: number }[];
	imageContext?: {
		cropHintsParams?: { aspectRatios?: number[] };
	};
};

export type VisionAnnotateResponse = {
	responses: Array<{
		fullTextAnnotation?: {
			text: string;
		};
		cropHintsAnnotation?: {
			cropHints: Array<{
				boundingPoly: {
					vertices: Array<{ x?: number; y?: number }>;
				};
				score?: number;
				confidence?: number;
			}>;
		};
		labelAnnotations?: Array<{
			description?: string;
			score?: number;
		}>;
	}>;
};

const VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";

export async function callGoogleVision(request: VisionAnnotateRequest): Promise<VisionAnnotateResponse> {
	const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY as string | undefined;
	if (!apiKey) {
		throw new Error("Missing VITE_GOOGLE_VISION_API_KEY env var");
	}

	const res = await fetch(`${VISION_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ requests: [request] }),
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Vision API error ${res.status}: ${text}`);
	}
	return (await res.json()) as VisionAnnotateResponse;
}

export function extractTitleAuthor(fullText: string): { title?: string; author?: string } {
	// Clean and normalize the text
	const lines = fullText
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.length > 2 && /[A-Za-z]/.test(l))
		.slice(0, 20); // Only look at first 20 lines

	console.log("Processing lines:", lines);

	let title: string | undefined;
	let author: string | undefined;

	// Title detection strategies
	const titleCandidates: string[] = [];
	
	// Strategy 1: Look for the largest/first significant line
	for (let i = 0; i < Math.min(5, lines.length); i++) {
		const line = lines[i];
		if (line.length > 3 && line.length < 100 && /^[A-Z]/.test(line)) {
			titleCandidates.push(line);
		}
	}

	// Strategy 2: Look for lines with common title patterns
	for (const line of lines) {
		if (
			line.length > 5 && 
			line.length < 80 &&
			/^[A-Z][A-Za-z\s\-'":]+$/.test(line) && // Starts with capital, contains letters/spaces/hyphens/colons
			!line.toLowerCase().includes('by') &&
			!line.toLowerCase().includes('author') &&
			!line.toLowerCase().includes('publisher') &&
			!line.toLowerCase().includes('copyright')
		) {
			titleCandidates.push(line);
		}
	}

	// Strategy 3: Look for subtitle patterns (Title: Subtitle)
	for (const line of lines) {
		const colonMatch = line.match(/^([^:]+):\s*([^:]+)$/);
		if (colonMatch) {
			const mainTitle = colonMatch[1].trim();
			const subtitle = colonMatch[2].trim();
			if (mainTitle.length > 3 && mainTitle.length < 60) {
				titleCandidates.push(`${mainTitle}: ${subtitle}`);
			}
		}
	}

	// Select the best title candidate
	if (titleCandidates.length > 0) {
		// Prefer longer titles, but not too long
		titleCandidates.sort((a, b) => {
			const aScore = a.length + (a.includes(':') ? 10 : 0);
			const bScore = b.length + (b.includes(':') ? 10 : 0);
			return bScore - aScore;
		});
		title = titleCandidates[0];
	}

	// Author detection strategies
	const authorCandidates: string[] = [];

	// Strategy 1: Look for "by" patterns
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const byMatch = line.match(/^(?:by|By|BY)\s*:?\s*([A-Z][A-Za-z\s\-']+)$/);
		if (byMatch) {
			authorCandidates.push(byMatch[1].trim());
		}
	}

	// Strategy 2: Look for author patterns in context
	for (let i = 0; i < lines.length - 1; i++) {
		const line = lines[i];
		const nextLine = lines[i + 1];
		
		// If current line looks like a title and next line looks like a name
		if (
			line.length > 5 && 
			line.length < 60 &&
			/^[A-Z]/.test(line) &&
			nextLine &&
			nextLine.length > 3 &&
			nextLine.length < 50 &&
			/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(nextLine) && // Name pattern
			!nextLine.toLowerCase().includes('publisher') &&
			!nextLine.toLowerCase().includes('copyright')
		) {
			authorCandidates.push(nextLine);
		}
	}

	// Strategy 3: Look for standalone name patterns
	for (const line of lines) {
		if (
			line.length > 3 &&
			line.length < 50 &&
			/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(line) && // Name pattern
			!line.toLowerCase().includes('publisher') &&
			!line.toLowerCase().includes('copyright') &&
			!line.toLowerCase().includes('edition') &&
			!line.toLowerCase().includes('series')
		) {
			authorCandidates.push(line);
		}
	}

	// Select the best author candidate
	if (authorCandidates.length > 0) {
		// Prefer names with 2-3 parts (first middle last)
		authorCandidates.sort((a, b) => {
			const aParts = a.split(/\s+/).length;
			const bParts = b.split(/\s+/).length;
			if (aParts >= 2 && aParts <= 3 && bParts >= 2 && bParts <= 3) {
				return b.length - a.length; // Prefer longer names
			}
			return Math.abs(aParts - 2.5) - Math.abs(bParts - 2.5); // Prefer 2-3 part names
		});
		author = authorCandidates[0];
	}

	console.log("Title candidates:", titleCandidates);
	console.log("Author candidates:", authorCandidates);
	console.log("Final result:", { title, author });

	return { title, author };
} 