import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { applyCrop, autoAdjustContrastBrightness, canvasToJpegDataUrl, decodeBase64ToImageBitmap, drawImageToCanvas, trimMargins } from "@/lib/imageProcessing";
import { callGoogleVision } from "@/lib/vision";
import { analyzeBookCoverWithGemini } from "@/lib/gemini";
import { Camera, Play, Pause, Target, BookOpen, Sparkles } from "lucide-react";

export type CoverScannerProps = {
	onExtract: (extracted: { title?: string; author?: string }) => void;
	onProcessedImage: (dataUrl: string) => void;
	onGeminiExtract?: (bookData: any) => void;
	className?: string;
};

export default function CoverScanner({ onExtract, onProcessedImage, onGeminiExtract, className }: CoverScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isStarting, setIsStarting] = useState(false);
	const [isAutoScanning, setIsAutoScanning] = useState(false);
	const autoScanIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const { toast } = useToast();
	const [detectionStatus, setDetectionStatus] = useState<string>("");
	const [bookDetected, setBookDetected] = useState(false);
	const [currentStep, setCurrentStep] = useState<string>("");
	const [progressDetails, setProgressDetails] = useState<string>("");
	const [logs, setLogs] = useState<string[]>([]);

	async function startCamera() {
		if (isStarting || isReady) return;
		setIsStarting(true);
		
		try {
			console.log("Starting camera...");
			
			// Try different camera constraints
			const constraints = [
				{ video: { facingMode: "environment" } },
				{ video: { facingMode: "user" } },
				{ video: true },
			];

			let stream: MediaStream | null = null;
			let error: any = null;

			for (const constraint of constraints) {
				try {
					console.log("Trying constraint:", constraint);
					stream = await navigator.mediaDevices.getUserMedia(constraint);
					console.log("Camera started successfully with constraint:", constraint);
					break;
				} catch (err) {
					console.log("Failed with constraint:", constraint, err);
					error = err;
					if (stream) {
						stream.getTracks().forEach(t => t.stop());
						stream = null;
					}
				}
			}

			if (!stream) {
				throw error || new Error("No camera available");
			}

			streamRef.current = stream;
			
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play();
				console.log("Video element playing");
				setIsReady(true);
			}
		} catch (err: any) {
			console.error("Camera error:", err);
			toast({ 
				title: "Camera Error", 
				description: err?.message || "Could not access camera. Please check permissions and try again.", 
				variant: "destructive" 
			});
		} finally {
			setIsStarting(false);
		}
	}

	function startAutoScan() {
		if (!isReady || isAutoScanning) return;
		setIsAutoScanning(true);
		setDetectionStatus("Scanning for book...");
		setCurrentStep("Waiting for book");
		setProgressDetails("Point camera at a book cover");
		setLogs([]);
		addLog("🚀 Book detection started");
		toast({ title: "Book detection started", description: "Point camera at a book cover" });
		
		// Scan every 2 seconds
		autoScanIntervalRef.current = setInterval(async () => {
			if (!isProcessing) {
				await handleScan();
			}
		}, 2000);
	}

	function addLog(message: string) {
		const timestamp = new Date().toLocaleTimeString();
		setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
	}

	function stopAutoScan(showToast = true) {
		if (autoScanIntervalRef.current) {
			clearInterval(autoScanIntervalRef.current);
			autoScanIntervalRef.current = null;
		}
		setIsAutoScanning(false);
		setDetectionStatus("");
		setBookDetected(false);
		setCurrentStep("");
		setProgressDetails("");
		addLog("⏹️ Book detection stopped");
		if (showToast) {
			toast({ title: "Book detection stopped" });
		}
	}

	useEffect(() => {
		return () => {
			stopAutoScan(false); // Don't show toast when unmounting
			if (streamRef.current) {
				console.log("Cleaning up camera stream");
				streamRef.current.getTracks().forEach((t) => t.stop());
			}
		};
	}, []);

	async function captureFrame(): Promise<string> {
		if (!videoRef.current) throw new Error("Video not ready");
		const video = videoRef.current;
		const canvas = document.createElement("canvas");
		const w = video.videoWidth;
		const h = video.videoHeight;
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas 2D not supported");
		ctx.drawImage(video, 0, 0, w, h);
		return canvas.toDataURL("image/jpeg", 0.92);
	}

	function dataUrlToBase64(dataUrl: string): string {
		return dataUrl.replace(/^data:image\/(png|jpeg);base64,/, "");
	}

	function isBookDetected(labels: Array<{ description?: string; score?: number }>, textLen: number): boolean {
		const allow = ["book", "textbook", "novel", "publication", "literature", "reading", "cover", "binding", "hardcover", "paperback", "spine", "page"];
		const deny = ["person", "face", "selfie", "human", "skin", "portrait"];
		const hasBookLabel = labels.some(l => (l.score || 0) > 0.75 && allow.some(k => (l.description || "").toLowerCase().includes(k)));
		const hasDenied = labels.some(l => deny.some(k => (l.description || "").toLowerCase().includes(k)));
		return hasBookLabel && !hasDenied && textLen > 20; // must also see some text on cover
	}

	async function handleScan() {
		if (!isReady || isProcessing) return;
		setIsProcessing(true);
		setCurrentStep("Capturing frame");
		setProgressDetails("Taking photo from camera...");
		addLog("📸 Capturing frame from camera...");
		
		try {
			const dataUrl = await captureFrame();
			const base64 = dataUrlToBase64(dataUrl);
			addLog("✅ Frame captured successfully");
			
			setCurrentStep("Analyzing image");
			setProgressDetails("Using Google Vision API to detect book...");
			addLog("🔍 Sending image to Google Vision API...");
			
			// Use Vision API to detect if it's a book
			const vision = await callGoogleVision({
				image: { content: base64 },
				features: [
					{ type: "LABEL_DETECTION", maxResults: 10 },
					{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
					{ type: "CROP_HINTS", maxResults: 1 },
				],
				imageContext: { cropHintsParams: { aspectRatios: [0.66, 0.75] } },
			});
			
			const resp = vision.responses?.[0];
			const labels = resp?.labelAnnotations || [];
			const textLen = (resp?.fullTextAnnotation?.text || "").trim().length;
			
			console.log("Detected labels:", labels.map(l => `${l.description} (${l.score})`));
			addLog(`🏷️ Detected labels: ${labels.map(l => l.description).join(", ")}`);
			
			if (isBookDetected(labels, textLen)) {
				setBookDetected(true);
				setDetectionStatus("Book detected! Processing image...");
				setCurrentStep("Processing image");
				setProgressDetails("Cropping and enhancing book cover...");
				addLog("📚 Book detected! Processing image...");
				
				// Process image with crop hints
				const bitmap = await decodeBase64ToImageBitmap(base64);
				let canvas = drawImageToCanvas(bitmap);
				addLog("🖼️ Image loaded and canvas created");
				
				// Apply crop hints if available
				const hint = resp?.cropHintsAnnotation?.cropHints?.[0];
				if (hint?.boundingPoly?.vertices?.length) {
					setProgressDetails("Applying AI crop suggestions...");
					addLog("✂️ Applying AI crop suggestions...");
					const vertices = hint.boundingPoly.vertices.map((v: any) => ({ 
						x: clampNumber(v.x || 0, 0, canvas.width), 
						y: clampNumber(v.y || 0, 0, canvas.height) 
					}));
					canvas = applyCrop(canvas, vertices);
					addLog("✅ Image cropped successfully");
				}
				
				// Return the processed image
				const outUrl = canvasToJpegDataUrl(canvas, 0.92);
				onProcessedImage(outUrl);
				addLog("💾 Processed image saved");
				
				// Use Gemini to search for book information online
				try {
					setDetectionStatus("Searching for book information online...");
					setCurrentStep("AI Analysis");
					setProgressDetails("Using Gemini AI to search for book data online...");
					addLog("🌐 Starting online book search with Gemini AI...");
					
					const processedBase64 = dataUrlToBase64(outUrl);
					const geminiData = await analyzeBookCoverWithGemini(processedBase64);
					
					if (geminiData && onGeminiExtract) {
						setCurrentStep("Extracting data");
						setProgressDetails(`Found: ${geminiData.title} by ${geminiData.authors.join(" & ")}`);
						addLog(`📖 Found book: ${geminiData.title} by ${geminiData.authors.join(" & ")}`);
						addLog(`📅 Year: ${geminiData.year || 'Not found'}`);
						addLog(`🏢 Publisher: ${geminiData.publisher || 'Not found'}`);
						addLog(`📝 Description: ${geminiData.description ? geminiData.description.substring(0, 50) + '...' : 'Not found'}`);
						
						onGeminiExtract({
							title: geminiData.title,
							authors: geminiData.authors.join(" & "),
							isbn: geminiData.isbn || "",
							year: geminiData.year || "0000",
							cover_url: geminiData.cover_url || "",
							publisher: geminiData.publisher || "",
							description: geminiData.description || "",
							genres: geminiData.genres || [],
							pages: geminiData.pages || "",
							language: geminiData.language || "",
						});
						
						setCurrentStep("Complete");
						setProgressDetails("Book data extracted successfully!");
						addLog("🎉 Book data extracted successfully!");
						
						toast({ 
							title: "Book Analyzed!", 
							description: `Found: ${geminiData.title} by ${geminiData.authors.join(" & ")}` 
						});
					} else {
						setCurrentStep("Complete");
						setProgressDetails("Cover captured but AI analysis failed");
						addLog("⚠️ Cover captured but AI analysis failed");
						
						toast({ 
							title: "Book Cover Captured!", 
							description: "Cover image captured and processed" 
						});
					}
				} catch (error: any) {
					console.error("Gemini analysis failed:", error);
					setCurrentStep("Error");
					setProgressDetails("AI analysis failed, but cover was captured");
					addLog(`❌ AI analysis failed: ${error.message || 'Unknown error'}`);
					
					// Show specific error in toast
					toast({ 
						title: "AI Analysis Failed", 
						description: error.message || "Cover captured but AI analysis failed",
						variant: "destructive"
					});
				}
				
				// Stop scanning after successful capture
				stopAutoScan();
			} else {
				setBookDetected(false);
				setDetectionStatus("No book detected. Point camera at a book cover.");
				setCurrentStep("Waiting for book");
				setProgressDetails("No book detected in current view");
			}
		} catch (err: any) {
			console.error(err);
			if (!isAutoScanning) {
				toast({ title: "Scan failed", description: err?.message ?? String(err), variant: "destructive" });
			}
		} finally {
			setIsProcessing(false);
		}
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" /> Smart Book Cover Capture
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="relative w-full aspect-[3/4] bg-black rounded overflow-hidden">
					<video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
					
					{/* Capture Grid Overlay */}
					{isReady && (
						<div className="absolute inset-0 pointer-events-none">
							{/* Corner guides */}
							<div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-green-400"></div>
							<div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-green-400"></div>
							<div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-green-400"></div>
							<div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-green-400"></div>
							
							{/* Center alignment guides */}
							<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-48 border-2 border-dashed border-yellow-400 opacity-60"></div>
							
							{/* Capture area indicator */}
							<div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-3/4 h-1/2 border-2 border-blue-400 opacity-40">
								<div className="text-center text-blue-400 text-xs mt-1">Book Cover Area</div>
							</div>
							{/* Detected badge */}
							{bookDetected && (
								<div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
									Detected
								</div>
							)}
						</div>
					)}
					
					{!isReady && (
						<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
							<div className="text-center text-white">
								<Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
								<p className="text-sm">Camera not started</p>
							</div>
						</div>
					)}
					
					{isAutoScanning && (
						<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
							<div className="text-center text-white">
								<div className="animate-pulse">
									{bookDetected ? (
										<>
											<BookOpen className="h-8 w-8 mx-auto mb-2 text-green-400" />
											<p className="text-sm font-medium text-green-400">Book Detected!</p>
											<p className="text-xs opacity-75">{currentStep}</p>
											<p className="text-xs opacity-50 mt-1">{progressDetails}</p>
										</>
									) : (
										<>
											<Target className="h-8 w-8 mx-auto mb-2 text-yellow-400" />
											<p className="text-sm font-medium">Scanning for book...</p>
											<p className="text-xs opacity-75">{currentStep}</p>
											<p className="text-xs opacity-50 mt-1">{progressDetails}</p>
										</>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
				
				{!isReady ? (
					<Button 
						onClick={startCamera} 
						disabled={isStarting}
						className="w-full"
					>
						<Play className="h-4 w-4 mr-2" />
						{isStarting ? "Starting Camera..." : "Start Camera"}
					</Button>
				) : !isAutoScanning ? (
					<Button 
						onClick={startAutoScan} 
						disabled={isProcessing}
						className="w-full bg-green-600 hover:bg-green-700"
					>
						<Target className="h-4 w-4 mr-2" />
						{isProcessing ? "Processing..." : "Start Book Detection"}
					</Button>
				) : (
					<Button 
						onClick={() => stopAutoScan(true)} 
						disabled={isProcessing}
						className="w-full bg-red-600 hover:bg-red-700"
					>
						<Pause className="h-4 w-4 mr-2" />
						{isProcessing ? "Processing..." : "Stop Detection"}
					</Button>
				)}
				
				{/* Detection Status */}
				{detectionStatus && (
					<div className="text-xs text-muted-foreground space-y-2">
						<div className="bg-muted/50 rounded-lg p-3">
							<p className="font-medium text-foreground mb-1">Current Status</p>
							<p className="text-muted-foreground">{detectionStatus}</p>
							{currentStep && (
								<div className="mt-2">
									<p className="font-medium text-foreground text-xs">Step: {currentStep}</p>
									<p className="text-muted-foreground text-xs">{progressDetails}</p>
								</div>
							)}
						</div>
					</div>
				)}

				{/* Detailed Progress Steps */}
				{isAutoScanning && (
					<div className="bg-muted/30 rounded-lg p-4">
						<h4 className="font-medium text-sm mb-3">Processing Steps</h4>
						<div className="space-y-2">
							<ProgressStep 
								step="1. Camera Ready" 
								status={isReady ? "completed" : "waiting"}
								description="Camera initialized and ready"
							/>
							<ProgressStep 
								step="2. Capturing Frame" 
								status={currentStep === "Capturing frame" ? "active" : currentStep === "Waiting for book" ? "waiting" : "completed"}
								description="Taking photo from camera"
							/>
							<ProgressStep 
								step="3. Vision Analysis" 
								status={currentStep === "Analyzing image" ? "active" : ["Processing image", "AI Analysis", "Extracting data", "Complete"].includes(currentStep) ? "completed" : "waiting"}
								description="Using Google Vision API to detect book"
							/>
							<ProgressStep 
								step="4. Image Processing" 
								status={currentStep === "Processing image" ? "active" : ["AI Analysis", "Extracting data", "Complete"].includes(currentStep) ? "completed" : "waiting"}
								description="Cropping and enhancing book cover"
							/>
							<ProgressStep 
								step="5. AI Analysis" 
								status={currentStep === "AI Analysis" ? "active" : ["Extracting data", "Complete"].includes(currentStep) ? "completed" : "waiting"}
								description="Using Gemini AI to extract book information"
							/>
							<ProgressStep 
								step="6. Data Extraction" 
								status={currentStep === "Extracting data" ? "active" : currentStep === "Complete" ? "completed" : "waiting"}
								description="Extracting title, author, and other details"
							/>
							<ProgressStep 
								step="7. Complete" 
								status={currentStep === "Complete" ? "completed" : currentStep === "Error" ? "error" : "waiting"}
								description="Book data ready for saving"
							/>
						</div>
					</div>
				)}

				{/* Real-time Logs */}
				{logs.length > 0 && (
					<div className="bg-black/90 rounded-lg p-3 max-h-32 overflow-y-auto">
						<h4 className="font-medium text-sm mb-2 text-green-400">System Logs</h4>
						<div className="space-y-1">
							{logs.slice(-8).map((log, index) => (
								<div key={index} className="text-xs font-mono text-green-300">
									{log}
								</div>
							))}
						</div>
					</div>
				)}
				
				{/* Instructions */}
				<div className="text-xs text-muted-foreground space-y-1">
					<p>• Position book cover within the blue rectangle</p>
					<p>• AI will detect when a book is in view</p>
					<p>• Automatically captures when book is detected</p>
				</div>
			</CardContent>
		</Card>
	);
}

function clampNumber(v: number, min: number, max: number) {
	return Math.max(min, Math.min(max, v));
}

interface ProgressStepProps {
	step: string;
	status: "waiting" | "active" | "completed" | "error";
	description: string;
}

function ProgressStep({ step, status, description }: ProgressStepProps) {
	const getStatusIcon = () => {
		switch (status) {
			case "waiting":
				return <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-gray-100" />;
			case "active":
				return <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500 animate-pulse" />;
			case "completed":
				return <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center">
					<svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
					</svg>
				</div>;
			case "error":
				return <div className="w-4 h-4 rounded-full border-2 border-red-500 bg-red-500 flex items-center justify-center">
					<svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
						<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
					</svg>
				</div>;
		}
	};

	const getStatusColor = () => {
		switch (status) {
			case "waiting":
				return "text-gray-500";
			case "active":
				return "text-blue-600 font-medium";
			case "completed":
				return "text-green-600 font-medium";
			case "error":
				return "text-red-600 font-medium";
		}
	};

	return (
		<div className="flex items-start gap-3">
			{getStatusIcon()}
			<div className="flex-1">
				<p className={`text-xs ${getStatusColor()}`}>{step}</p>
				<p className="text-xs text-gray-500">{description}</p>
			</div>
		</div>
	);
} 