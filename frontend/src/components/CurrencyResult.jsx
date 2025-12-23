import { useEffect } from 'react';
import { CheckCircle, Volume2 } from 'lucide-react';
import speechService from '../services/speech';
import { useUIStore } from '../store';

function CurrencyResult({ value, text, formatted, confidence, onSpeakAgain }) {
  const { voiceEnabled } = useUIStore();

  useEffect(() => {
    // Speak the result when it appears
    if (voiceEnabled && text) {
      speechService.speak(text);
    }
  }, [value, text, voiceEnabled]);

  const handleSpeak = () => {
    speechService.speak(text);
  };

  return (
    <div 
      className="card bg-green-50 border-green-200"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2 mb-4">
        <CheckCircle className="text-green-600" size={28} aria-hidden="true" />
        <span className="text-green-800 font-medium text-lg">
          Uang Terdeteksi!
        </span>
      </div>

      {/* Large currency display */}
      <div className="currency-display mb-4">
        {formatted}
      </div>

      {/* Text representation */}
      <p className="text-center text-xl text-gray-700 mb-4">
        {text}
      </p>

      {/* Confidence indicator */}
      {confidence && (
        <div className="text-center text-sm text-gray-500 mb-4">
          Tingkat keyakinan: {confidence.toFixed(1)}%
        </div>
      )}

      {/* Speak again button */}
      <button
        onClick={handleSpeak}
        className="btn btn-success w-full flex items-center justify-center gap-2"
        aria-label="Ucapkan lagi"
      >
        <Volume2 size={24} aria-hidden="true" />
        <span>Ucapkan Lagi</span>
      </button>
    </div>
  );
}

export default CurrencyResult;
