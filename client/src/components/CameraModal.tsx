import { useState, useRef, useEffect } from "react";
import { Camera, X, RefreshCw, AlertCircle } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  title?: string;
  subtitle?: string;
}

export function CameraModal({
  isOpen,
  onClose,
  onCapture,
  title = "Capture Photo",
  subtitle = "Point camera at the affected crop, leaf, or seed sample",
}: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: "environment" | "user") => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera access error:", err);
      // Fallback to any video device
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err2: any) {
        setCameraError(
          "Camera access unavailable. Please allow camera permissions or upload an image file directly."
        );
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);

    stopCamera();
    onCapture(base64);
    onClose();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Camera size={18} className="text-emerald-400" />
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle size={36} className="text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
              <button
                onClick={() => startCamera(facingMode)}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg font-semibold transition"
              >
                Retry Camera
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              {/* Focus target frame */}
              <div className="absolute inset-8 border-2 border-dashed border-emerald-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                <span className="text-[11px] bg-black/60 px-2.5 py-1 rounded-full text-emerald-300 tracking-wide">
                  Align crop leaf or seed sample inside frame
                </span>
              </div>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={toggleFacingMode}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl transition"
            title="Switch front/rear camera"
          >
            <RefreshCw size={14} />
            <span>Flip</span>
          </button>

          <button
            type="button"
            onClick={capturePhoto}
            disabled={Boolean(cameraError)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
          >
            <Camera size={18} />
            <span>Snap & Analyze Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
