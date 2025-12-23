import { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RefreshCw, X } from 'lucide-react';
import beepSoundService from '../services/beepSound';

function CameraCapture({ onCapture, onClose, isProcessing }) {
  const webcamRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' for back camera
  const [hasError, setHasError] = useState(false);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  };

  const capture = useCallback(() => {
    if (webcamRef.current) {
      // Play beep sound when scan starts
      beepSoundService.playScanBeep();
      
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to blob
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            onCapture(file);
          });
      }
    }
  }, [onCapture]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className="card text-center py-12">
        <div className="text-6xl mb-4">📷</div>
        <h3 className="text-xl font-bold mb-2">Tidak dapat mengakses kamera</h3>
        <p className="text-gray-600 mb-4">
          Pastikan Anda telah memberikan izin akses kamera ke aplikasi ini.
        </p>
        <button
          onClick={() => setHasError(false)}
          className="btn btn-primary"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Camera preview */}
      <div className="camera-preview">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMediaError={handleError}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay guide */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-8 border-4 border-white border-dashed rounded-2xl opacity-50" />
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <p className="text-white text-lg font-medium bg-black/50 inline-block px-4 py-2 rounded-full">
              Arahkan kamera ke uang
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center items-center gap-4 mt-4">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="btn btn-secondary p-4 rounded-full"
            aria-label="Tutup kamera"
          >
            <X size={24} />
          </button>
        )}
        
        {/* Capture button */}
        <button
          onClick={capture}
          disabled={isProcessing}
          className="scan-button btn btn-primary p-6 rounded-full disabled:opacity-50"
          aria-label={isProcessing ? 'Sedang memproses' : 'Ambil foto'}
        >
          {isProcessing ? (
            <RefreshCw size={32} className="animate-spin" />
          ) : (
            <Camera size={32} />
          )}
        </button>

        {/* Switch camera button */}
        <button
          onClick={toggleCamera}
          className="btn btn-secondary p-4 rounded-full"
          aria-label="Ganti kamera"
        >
          <RefreshCw size={24} />
        </button>
      </div>
    </div>
  );
}

export default CameraCapture;
