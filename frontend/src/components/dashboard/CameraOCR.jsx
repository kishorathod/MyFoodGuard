import { useState, useRef, useEffect } from "react";
import { FiCamera, FiImage, FiX, FiCheck, FiRotateCcw, FiUpload } from "react-icons/fi";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import { BrowserQRCodeReader } from '@zxing/browser';

export default function CameraOCR({ onExpiryDateDetected, onClose }) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedDate, setDetectedDate] = useState(null);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [mode, setMode] = useState('ocr'); // 'ocr' or 'barcode'
  const [barcodeResult, setBarcodeResult] = useState(null);
  const [qrResult, setQrResult] = useState(null);
  const [qrError, setQrError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const qrVideoRef = useRef(null);
  const qrCodeReaderRef = useRef(null);

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasCanvas = !!document.createElement('canvas').getContext;
      const hasFileReader = !!window.FileReader;
      
      if (!hasGetUserMedia || !hasCanvas || !hasFileReader) {
        setIsSupported(false);
        setError("Your browser doesn't support camera functionality");
      }
    };
    
    checkSupport();
  }, []);

  // Check camera permission on mount
  useEffect(() => {
    if (isSupported) {
      checkCameraPermission();
    }
  }, [isSupported]);

  useEffect(() => {
    if (mode === 'qr' && qrVideoRef.current) {
      setQrError(null);
      setQrResult(null);
      qrCodeReaderRef.current = new BrowserQRCodeReader();
      qrCodeReaderRef.current.decodeFromVideoDevice(
        null,
        qrVideoRef.current,
        (result, err) => {
          if (result) setQrResult(result.getText());
          if (err && !(err instanceof DOMException)) setQrError(err.message);
        }
      );
      return () => {
        if (
          qrCodeReaderRef.current &&
          typeof qrCodeReaderRef.current.reset === 'function'
        ) {
          qrCodeReaderRef.current.reset();
        }
      };
    }
  }, [mode]);

  const checkCameraPermission = async () => {
    try {
      if (!navigator.permissions) {
        setCameraPermission('prompt');
        return;
      }

      const permission = await navigator.permissions.query({ name: 'camera' });
      setCameraPermission(permission.state);
      
      permission.addEventListener('change', () => {
        setCameraPermission(permission.state);
      });
    } catch (error) {
      console.log('Camera permission API not supported:', error);
      setCameraPermission('prompt');
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera is already in use by another application.';
      }
      
      setError(errorMessage);
    }
  };

  const stopCamera = () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      setIsCameraOpen(false);
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const captureImage = () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error("Video or canvas not available");
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error("Canvas context not available");
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image. Please try again.');
    }
  };

  const processImage = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR result - in real app, send to backend
      const mockResult = {
        expiry_date: "2024-02-15",
        confidence: 0.85,
        pattern_found: "15/02/2024",
        days_until_expiry: 5
      };
      
      setDetectedDate(mockResult);
    } catch (error) {
      console.error('OCR processing error:', error);
      setError('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file too large. Please select an image smaller than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      setError('Failed to upload image.');
    }
  };

  const retakePhoto = () => {
    try {
      setCapturedImage(null);
      setDetectedDate(null);
      setError(null);
      startCamera();
    } catch (error) {
      console.error('Error retaking photo:', error);
      setError('Failed to restart camera.');
    }
  };

  const confirmDate = () => {
    try {
      if (detectedDate && onExpiryDateDetected) {
        onExpiryDateDetected(detectedDate.expiry_date);
        onClose();
      }
    } catch (error) {
      console.error('Error confirming date:', error);
      setError('Failed to confirm date.');
    }
  };

  const getPermissionMessage = () => {
    switch (cameraPermission) {
      case 'denied':
        return 'Camera access denied. Please enable camera permissions in your browser settings.';
      case 'prompt':
        return 'Camera permission is required to scan food labels.';
      default:
        return 'Click the camera button to start scanning food labels.';
    }
  };

  if (!isSupported) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-background rounded-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Browser Not Supported</h3>
            <p className="text-muted-foreground mb-4">
              Your browser doesn't support camera functionality. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Scan Food Label</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          {/* Mode Toggle */}
          <div className="flex justify-center mb-4 space-x-2">
            <button
              className={`px-4 py-2 rounded-lg ${mode === 'ocr' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              onClick={() => setMode('ocr')}
            >
              OCR
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${mode === 'barcode' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              onClick={() => setMode('barcode')}
            >
              Barcode
            </button>
            <button
              className={`px-4 py-2 rounded-lg ${mode === 'qr' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
              onClick={() => setMode('qr')}
            >
              QR Code
            </button>
          </div>

          {/* QR Code Scanner Mode */}
          {mode === 'qr' && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
                <video ref={qrVideoRef} className="w-full h-full object-cover" />
              </div>
              {qrResult && (
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                    <span className="font-semibold">QR Code Detected:</span> {qrResult}
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <button
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      onClick={() => {
                        if (onExpiryDateDetected) onExpiryDateDetected(qrResult);
                        onClose();
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
                      onClick={() => setQrResult(null)}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              {qrError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                  <span className="text-red-600 dark:text-red-400">{qrError}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the QR code on the food package
              </p>
            </div>
          )}

          {/* Barcode Scanner Mode */}
          {mode === 'barcode' && (
            <div className="space-y-4">
              <BarcodeScannerComponent
                width={350}
                height={250}
                onUpdate={(err, result) => {
                  if (result) setBarcodeResult(result.text);
                }}
              />
              {barcodeResult && (
                <div className="space-y-2">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                    <span className="font-semibold">Barcode Detected:</span> {barcodeResult}
                  </div>
                  <div className="flex space-x-2 justify-center">
                    <button
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                      onClick={() => {
                        if (onExpiryDateDetected) onExpiryDateDetected(barcodeResult);
                        onClose();
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90"
                      onClick={() => setBarcodeResult(null)}
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the barcode on the food package
              </p>
            </div>
          )}

          {/* OCR Mode (existing UI) */}
          {mode === 'ocr' && (
            <>
              {/* Permission Status */}
              {cameraPermission === 'denied' && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {getPermissionMessage()}
                  </p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Camera Button */}
              <button
                onClick={startCamera}
                disabled={cameraPermission === 'denied'}
                className="w-full p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <FiCamera className="h-5 w-5" />
                  <span>Open Camera</span>
                </div>
              </button>

              {/* Upload Option */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-center justify-center space-x-2">
                    <FiUpload className="h-5 w-5" />
                    <span>Upload Image</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Point your camera at the expiry date on the food label
              </p>
            </>
          )}

          {/* Camera View */}
          {isCameraOpen && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white/50 rounded-lg p-8">
                    <div className="w-48 h-32 border-2 border-white rounded-lg"></div>
                  </div>
                </div>
                
                {/* Camera Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <button
                    onClick={stopCamera}
                    className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={captureImage}
                    className="p-4 bg-white text-black rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <FiCamera className="h-6 w-6" />
                  </button>
                  
                  <button
                    onClick={() => {
                      // Rotate camera (mock)
                      console.log('Rotate camera');
                    }}
                    className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  >
                    <FiRotateCcw className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Position the expiry date within the frame and tap the camera button
              </p>
            </div>
          )}

          {/* Captured Image */}
          {capturedImage && !isProcessing && !detectedDate && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Error";
                  }}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={retakePhoto}
                  className="flex-1 p-3 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FiRotateCcw className="h-4 w-4" />
                    <span>Retake</span>
                  </div>
                </button>
                
                <button
                  onClick={() => processImage()}
                  className="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FiImage className="h-4 w-4" />
                    <span>Process</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="space-y-4">
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Processing image...</p>
                </div>
              </div>
            </div>
          )}

          {/* Detected Date */}
          {detectedDate && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FiCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    Date Detected!
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Expiry Date:</span>
                    <span className="font-medium">{detectedDate.expiry_date}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Confidence:</span>
                    <span className="font-medium">{(detectedDate.confidence * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Days Until Expiry:</span>
                    <span className={`font-medium ${
                      detectedDate.days_until_expiry <= 3 ? 'text-red-500' : 
                      detectedDate.days_until_expiry <= 7 ? 'text-yellow-500' : 'text-green-500'
                    }`}>
                      {detectedDate.days_until_expiry} days
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={retakePhoto}
                  className="flex-1 p-3 border border-border rounded-lg hover:bg-secondary transition-colors"
                >
                  <span>Retake</span>
                </button>
                
                <button
                  onClick={confirmDate}
                  className="flex-1 p-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <span>Use This Date</span>
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
} 