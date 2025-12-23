import { useState } from 'react';
import { Camera, Upload, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraCapture from '../components/CameraCapture';
import CurrencyResult from '../components/CurrencyResult';
import { scanAPI } from '../services/api';
import { useScanStore, useUIStore } from '../store';
import speechService from '../services/speech';
import beepSoundService from '../services/beepSound';

function ScanPage() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const { voiceEnabled } = useUIStore();

  const handleCapture = async (file) => {
    setIsProcessing(true);
    
    try {
      // Announce scanning
      if (voiceEnabled) {
        speechService.speak('Sedang memproses');
      }

      const response = await scanAPI.scanSingle(file);
      
      if (response.success) {
        setResult(response.data);
        setShowCamera(false);
        
        // The CurrencyResult component will handle speaking the result
      } else {
        toast.error(response.message || 'Gagal memproses gambar');
        if (voiceEnabled) {
          speechService.speak('Gagal memproses gambar');
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      const message = error.response?.data?.message || 'Terjadi kesalahan saat scan';
      toast.error(message);
      if (voiceEnabled) {
        speechService.speak(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Play beep sound when upload starts
      beepSoundService.playScanBeep();
      await handleCapture(file);
    }
  };

  const handleReset = () => {
    setResult(null);
    setShowCamera(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Scan Uang
        </h1>
        <p className="text-gray-600 mt-1">
          Arahkan kamera ke uang untuk mengenali nilainya
        </p>
      </header>

      {/* Result display */}
      {result && (
        <CurrencyResult
          value={result.nilai}
          text={result.text}
          formatted={result.nilaiFormatted}
          confidence={result.confidence}
        />
      )}

      {/* Camera capture */}
      {showCamera && !result && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Action buttons when no result and camera closed */}
      {!showCamera && !result && (
        <div className="space-y-4">
          {/* Open camera button */}
          <button
            onClick={() => setShowCamera(true)}
            className="btn btn-primary btn-large w-full flex items-center justify-center gap-3"
            disabled={isProcessing}
          >
            <Camera size={28} aria-hidden="true" />
            <span>Buka Kamera</span>
          </button>

          {/* Upload file option */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
              id="file-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="file-upload"
              className="btn btn-secondary btn-large w-full flex items-center justify-center gap-3 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={28} className="animate-spin" aria-hidden="true" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Upload size={28} aria-hidden="true" />
                  <span>Upload Gambar</span>
                </>
              )}
            </label>
          </div>
        </div>
      )}

      {/* Reset button when there's a result */}
      {result && (
        <button
          onClick={handleReset}
          className="btn btn-primary btn-large w-full flex items-center justify-center gap-3"
        >
          <Camera size={28} aria-hidden="true" />
          <span>Scan Uang Lain</span>
        </button>
      )}

      {/* Instructions */}
      {!showCamera && !result && (
        <section className="card bg-blue-50 border-blue-200">
          <h2 className="font-bold text-lg text-blue-900 mb-2">
            📖 Petunjuk
          </h2>
          <ul className="space-y-2 text-blue-800">
            <li>• Pastikan pencahayaan cukup terang</li>
            <li>• Posisikan uang di tengah layar kamera</li>
            <li>• Jaga kamera tetap stabil saat mengambil foto</li>
            <li>• Pastikan uang tidak terlipat atau tertutup</li>
          </ul>
        </section>
      )}
    </div>
  );
}

export default ScanPage;
