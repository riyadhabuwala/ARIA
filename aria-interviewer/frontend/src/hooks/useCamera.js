import { useCallback, useEffect, useRef, useState } from "react";

export function useCamera() {
  const [videoElement, setVideoElement] = useState(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useCallback((node) => {
    setVideoElement(node);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoElement) {
        videoElement.srcObject = stream;
        videoElement.play();
      }
      setCameraActive(true);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setCameraError("Camera access denied. You can still do the interview without video.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Camera unavailable. Continuing without video.");
      }
      setCameraActive(false);
    }
  };

  useEffect(() => {
    if (videoElement && streamRef.current) {
      if (videoElement.srcObject !== streamRef.current) {
        videoElement.srcObject = streamRef.current;
        videoElement.play();
      }
    }
  }, [videoElement]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  return { videoRef, cameraActive, cameraError, startCamera, stopCamera };
}
