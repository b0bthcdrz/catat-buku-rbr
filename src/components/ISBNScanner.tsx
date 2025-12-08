import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Camera, Play, Pause, Barcode, Flashlight } from "lucide-react";
import Quagga from "@ericblade/quagga2";

export type ISBNScannerProps = {
	onISBNDetected: (isbn: string) => void;
	className?: string;
};

export default function ISBNScanner({ onISBNDetected, className }: ISBNScannerProps) {
	const videoContainerRef = useRef<HTMLDivElement>(null);
	const videoElRef = useRef<HTMLVideoElement | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isStarting, setIsStarting] = useState(false);
	const [isScanning, setIsScanning] = useState(false);
	const { toast } = useToast();
	const [status, setStatus] = useState<string>("Idle");
	const [lastDetected, setLastDetected] = useState<string | null>(null);
	const detectionLockRef = useRef(false);
	const [torchOn, setTorchOn] = useState(false);

	function getVideoTrack(): MediaStreamTrack | null {
		const el = videoElRef.current as any;
		const stream: MediaStream | undefined = el?.srcObject;
		return stream?.getVideoTracks?.()[0] ?? null;
	}

	async function toggleTorch() {
		try {
			const track = getVideoTrack();
			if (!track) return;
			const capabilities = (track as any).getCapabilities?.() as any;
			if (!capabilities || !("torch" in capabilities)) {
				toast({ title: "Torch not supported", description: "Your device camera doesn't expose torch control" });
				return;
			}
			await (track as any).applyConstraints({ advanced: [{ torch: !torchOn }] });
			setTorchOn((v) => !v);
		} catch (e: any) {
			console.error(e);
			toast({ title: "Torch toggle failed", description: e?.message ?? String(e), variant: "destructive" });
		}
	}

	async function startCamera() {
		if (isStarting || isReady) return;
		setIsStarting(true);
		try {
			setStatus("Initializing camera...");
			setIsReady(true);
			setStatus("Camera ready");
		} finally {
			setIsStarting(false);
		}
	}

	function stopCamera() {
		stopScanning();
		setIsReady(false);
		setStatus("Idle");
	}

	function normalizeToISBN(text: string): string | null {
		const cleaned = text.replace(/[^0-9Xx]/g, "");
		if (/^(978|979)\d{10}$/.test(cleaned)) return cleaned;
		if(/^\d{9}[\dXx]$/.test(cleaned)) return cleaned.toUpperCase();
		return null;
	}

	async function startScanning() {
		if (!isReady || isScanning) return;
		if (!videoContainerRef.current) return;
		setIsScanning(true);
		setStatus("Starting scanner...");
		detectionLockRef.current = false;

		await Quagga.init({
			inputStream: {
				type: "LiveStream",
				target: videoContainerRef.current,
				constraints: {
					facingMode: "environment",
					width: { min: 640, ideal: 1280 },
					height: { min: 480, ideal: 720 },
					aspectRatio: { min: 1, max: 2 },
				},
				area: { top: "15%", right: "10%", left: "10%", bottom: "15%" },
			},
			locate: true,
			locator: { patchSize: "medium", halfSample: true },
			numOfWorkers: navigator.hardwareConcurrency ? Math.max(1, navigator.hardwareConcurrency - 1) : 2,
			decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader"] },
			frequency: 5,
		}, (err) => {
			if (err) {
				console.error(err);
				toast({ title: "Scanner Error", description: String(err), variant: "destructive" });
				setStatus("Scanner error");
				setIsScanning(false);
				return;
			}
			Quagga.start();
			const video = (videoContainerRef.current!.querySelector("video") as HTMLVideoElement) || null;
			videoElRef.current = video;
			setStatus("Scanning...");
		});

		Quagga.onProcessed((_result) => {
			// Optional: draw overlays here
		});

		Quagga.onDetected((data) => {
			if (detectionLockRef.current) return;
			const code = data?.codeResult?.code;
			if (!code) return;
			const isbn = normalizeToISBN(code);
			if (isbn) {
				detectionLockRef.current = true;
				setLastDetected(isbn);
				setStatus("Detected");
				toast({ title: "ISBN Captured", description: isbn });
				onISBNDetected(isbn);
				stopScanning();
			}
		});
	}

	async function fallbackCaptureAndDecode() {
		try {
			const video = videoElRef.current;
			if (!video) return;
			const canvas = document.createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
			setStatus("Decoding still...");
			Quagga.decodeSingle({
				src: dataUrl,
				numOfWorkers: 0,
				decoder: { readers: ["ean_reader", "ean_8_reader", "upc_reader"] },
				locate: true,
			}, (result) => {
				if (result && (result as any).codeResult) {
					const code = (result as any).codeResult.code;
					const isbn = normalizeToISBN(code);
					if (isbn) {
						setLastDetected(isbn);
						setStatus("Detected");
						toast({ title: "ISBN Captured", description: isbn });
						onISBNDetected(isbn);
						stopScanning();
						return;
					}
				}
				setStatus("No code in still");
				toast({ title: "No barcode detected", description: "Try better lighting and alignment" });
			});
		} catch (e: any) {
			console.error(e);
			toast({ title: "Decode failed", description: e?.message ?? String(e), variant: "destructive" });
		}
	}

	function stopScanning() {
		try { Quagga.stop(); } catch {}
		try { Quagga.offProcessed(() => {}); } catch {}
		try { Quagga.offDetected(() => {}); } catch {}
		setIsScanning(false);
		if (isReady) setStatus("Camera ready");
	}

	useEffect(() => {
		return () => {
			stopScanning();
		};
	}, []);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Barcode className="h-5 w-5" /> Scan ISBN Barcode
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="relative w-full aspect-[4/3] bg-black rounded overflow-hidden">
					<div ref={videoContainerRef} className="w-full h-full" />
					{isReady && (
						<div className="absolute inset-0 pointer-events-none">
							<div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-400" />
							<div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-400" />
							<div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-400" />
							<div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-400" />
							<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-20 border-2 border-red-400 opacity-80" />
							{lastDetected && (
								<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+2.5rem)] bg-black/70 text-white text-xs px-2 py-1 rounded">
									Detected: {lastDetected}
								</div>
							)}
						</div>
					)}
					{!isReady && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm">
							<Camera className="h-12 w-12 mb-2 opacity-60" />
							<p>Camera not started</p>
						</div>
					)}
				</div>

				{!isReady ? (
					<Button onClick={startCamera} disabled={isStarting} className="w-full">
						<Play className="h-4 w-4 mr-2" />{isStarting ? "Starting Camera..." : "Start Camera"}
					</Button>
				) : !isScanning ? (
					<div className="flex gap-2">
						<Button onClick={startScanning} className="w-full bg-red-600 hover:bg-red-700">
							<Barcode className="h-4 w-4 mr-2" />Start ISBN Scan
						</Button>
						<Button onClick={toggleTorch} variant="outline" className="whitespace-nowrap">
							<Flashlight className="h-4 w-4 mr-1" /> Torch {torchOn ? "On" : "Off"}
						</Button>
					</div>
				) : (
					<div className="flex gap-2">
						<Button onClick={stopScanning} className="w-full bg-gray-600 hover:bg-gray-700">
							<Pause className="h-4 w-4 mr-2" />Stop Scan
						</Button>
						<Button onClick={fallbackCaptureAndDecode} variant="secondary" className="whitespace-nowrap">Decode Still</Button>
					</div>
				)}

				<div className="text-xs text-muted-foreground space-y-1">
					<p><span className="font-medium">Status:</span> {status}</p>
					{lastDetected && <p><span className="font-medium">Last detected:</span> {lastDetected}</p>}
					<p>• Align barcode within the red rectangle</p>
					<p>• Use Torch if available</p>
				</div>
			</CardContent>
		</Card>
	);
} 