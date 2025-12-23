import { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Volume2, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import CameraCapture from '../components/CameraCapture';
import { scanAPI } from '../services/api';
import { useScanStore, useUIStore } from '../store';
import speechService from '../services/speech';
import beepSoundService from '../services/beepSound';

function CalculatePage() {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [scans, setScans] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalText, setTotalText] = useState('nol rupiah');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const { voiceEnabled } = useUIStore();

  const startSession = async () => {
    try {
      const response = await scanAPI.startCalculation();
      
      if (response.success) {
        setSessionId(response.data.sessionId);
        setIsSessionActive(true);
        setScans([]);
        setTotal(0);
        setTotalText('nol rupiah');
        toast.success('Sesi perhitungan dimulai');
        
        if (voiceEnabled) {
          await speechService.speak('Sesi perhitungan dimulai. Silakan scan uang satu per satu.');
        }
      }
    } catch (error) {
      console.error('Start session error:', error);
      toast.error(error.response?.data?.message || 'Gagal memulai sesi');
      if (voiceEnabled) {
        await speechService.speak('Gagal memulai sesi');
      }
    }
  };

  const handleCapture = async (file) => {
    if (!sessionId) {
      toast.error('Mulai sesi terlebih dahulu');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await scanAPI.addToCalculation(sessionId, file);

      if (response.success) {
        const data = response.data;
        
        setScans(prev => [...prev, {
          value: data.scannedValue,
          text: data.scannedText,
          formatted: data.scannedFormatted
        }]);
        setTotal(data.totalMoney);
        setTotalText(data.totalText);
        setShowCamera(false);

        // Speak the scanned value and new total (queue will handle sequentially)
        if (voiceEnabled) {
          await speechService.speak(`${data.scannedText}. Total sekarang: ${data.totalText}`);
        }

        toast.success(`+${data.scannedFormatted}`);
      }
    } catch (error) {
      console.error('Add to calculation error:', error);
      const message = error.response?.data?.message || 'Gagal memproses gambar';
      toast.error(message);
      if (voiceEnabled) {
        await speechService.speak(message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const finishSession = async () => {
    if (!sessionId) return;

    try {
      const response = await scanAPI.finishCalculation(sessionId);

      if (response.success) {
        setIsSessionActive(false);
        toast.success('Sesi selesai!');
        
        // Speak final result
        if (voiceEnabled) {
          await speechService.speak(`Selesai. Total akhir: ${response.data.totalText}. ${response.data.totalBanknotes} lembar uang.`);
        }
      }
    } catch (error) {
      console.error('Finish session error:', error);
      toast.error('Gagal menyelesaikan sesi');
      if (voiceEnabled) {
        await speechService.speak('Gagal menyelesaikan sesi');
      }
    }
  };

  const resetSession = () => {
    // Stop any ongoing speech
    speechService.stop();
    setSessionId(null);
    setScans([]);
    setTotal(0);
    setTotalText('nol rupiah');
    setIsSessionActive(false);
    setShowCamera(false);
  };

  const speakTotal = () => {
    if (voiceEnabled) {
      speechService.speak(`Total: ${totalText}. ${scans.length} lembar uang.`);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      // Play beep sound when upload starts
      beepSoundService.playScanBeep();
      await handleCapture(file);
    }
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Hitung Uang
        </h1>
        <p className="text-gray-600 mt-1">
          Scan uang satu per satu untuk dijumlahkan
        </p>
      </header>

      {/* Total display */}
      {isSessionActive && (
        <section 
          className="card bg-green-50 border-green-200"
          aria-label="Total uang"
        >
          <div className="text-center">
            <p className="text-green-800 font-medium text-lg mb-2">
              Total Uang
            </p>
            <div className="currency-display">
              Rp {total.toLocaleString('id-ID')}
            </div>
            <p className="text-xl text-gray-700 mt-2">
              {totalText}
            </p>
            <p className="text-gray-500 mt-2">
              {scans.length} lembar uang
            </p>
            
            {/* Speak total button */}
            <button
              onClick={speakTotal}
              className="btn btn-success mt-4 flex items-center justify-center gap-2 mx-auto"
              aria-label="Ucapkan total"
            >
              <Volume2 size={24} aria-hidden="true" />
              <span>Ucapkan Total</span>
            </button>
          </div>
        </section>
      )}

      {/* Camera section */}
      {showCamera && isSessionActive && (
        <CameraCapture
          onCapture={handleCapture}
          onClose={() => setShowCamera(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Action buttons */}
      {!showCamera && (
        <div className="space-y-4">
          {!isSessionActive ? (
            // Start session button
            <button
              onClick={startSession}
              className="btn btn-primary btn-large w-full flex items-center justify-center gap-3"
            >
              <Plus size={28} aria-hidden="true" />
              <span>Mulai Hitung Uang</span>
            </button>
          ) : (
            <>
              {/* Add more money button */}
              <button
                onClick={() => setShowCamera(true)}
                className="btn btn-primary btn-large w-full flex items-center justify-center gap-3"
                disabled={isProcessing}
              >
                <Camera size={28} aria-hidden="true" />
                <span>Scan Uang Berikutnya</span>
              </button>

              {/* Upload file option */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                  id="file-upload-calc"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="file-upload-calc"
                  className="btn btn-secondary w-full flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={24} className="animate-spin" aria-hidden="true" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} aria-hidden="true" />
                      <span>Upload Gambar</span>
                    </>
                  )}
                </label>
              </div>

              {/* Finish button */}
              {scans.length > 0 && (
                <button
                  onClick={finishSession}
                  className="btn btn-success w-full flex items-center justify-center gap-3"
                >
                  <CheckCircle size={24} aria-hidden="true" />
                  <span>Selesai Hitung</span>
                </button>
              )}

              {/* Cancel button */}
              <button
                onClick={resetSession}
                className="btn btn-danger w-full flex items-center justify-center gap-3"
              >
                <XCircle size={24} aria-hidden="true" />
                <span>Batalkan</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Scan history in this session */}
      {isSessionActive && scans.length > 0 && (
        <section className="card" aria-label="Daftar uang yang sudah di-scan">
          <h2 className="font-bold text-lg mb-4">
            Daftar Uang ({scans.length})
          </h2>
          <ul className="space-y-2">
            {scans.map((scan, index) => (
              <li 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <span className="text-gray-600">Uang {index + 1}</span>
                <span className="font-bold text-green-600">{scan.formatted}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Instructions */}
      {!isSessionActive && (
        <section className="card bg-blue-50 border-blue-200">
          <h2 className="font-bold text-lg text-blue-900 mb-2">
            📖 Cara Menghitung Uang
          </h2>
          <ol className="space-y-2 text-blue-800 list-decimal list-inside">
            <li>Tekan tombol "Mulai Hitung Uang"</li>
            <li>Scan uang pertama dengan kamera</li>
            <li>Tekan "Scan Uang Berikutnya" untuk menambah uang lain</li>
            <li>Ulangi sampai semua uang ter-scan</li>
            <li>Tekan "Selesai Hitung" untuk melihat total</li>
          </ol>
        </section>
      )}
    </div>
  );
}

export default CalculatePage;
