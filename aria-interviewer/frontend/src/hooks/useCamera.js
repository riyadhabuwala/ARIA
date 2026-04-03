import { useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoElRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Attach stream to video element whenever both are available
  function attachStream() {
    const el = videoElRef.current;
    const stream = streamRef.current;
    if (el && stream) {
      if (el.srcObject !== stream) {
        el.srcObject = stream;
        el.play().catch(() => {});
      }
    }
  }

  // Ref callback — fires when the <video> DOM node mounts/unmounts.
  // If the stream is already available, attach it immediately.
  const videoRef = (node) => {
    videoElRef.current = node;
    if (node) {
      attachStream();
    }
  };

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
      setCameraActive(true);

      // Attach immediately if video element already exists
      attachStream();

      // Retry shortly in case the element hasn't mounted yet
      setTimeout(attachStream, 50);
      setTimeout(attachStream, 200);
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

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  return { videoRef, cameraActive, cameraError, startCamera, stopCamera };
}
