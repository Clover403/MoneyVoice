// Text-to-Speech service using ElevenLabs API with Queue System
class SpeechService {
  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    this.voiceId = 'pFZP5JQG7iQjIQuC4Bku'; // Lily - Indonesian female voice
    this.modelId = 'eleven_multilingual_v2'; // Supports Indonesian
    this.isPlaying = false;
    this.currentAudio = null;
    this.speechQueue = [];
    this.isProcessingQueue = false;
    
    // Fallback to Web Speech API if ElevenLabs fails
    this.synth = window.speechSynthesis;
    this.fallbackVoice = null;
    this.initFallback();
  }

  initFallback() {
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadFallbackVoice();
    }
    setTimeout(() => this.loadFallbackVoice(), 100);
  }

  loadFallbackVoice() {
    const voices = this.synth.getVoices();
    this.fallbackVoice = voices.find(v => 
      v.lang.includes('id') || v.name.toLowerCase().includes('indonesia')
    ) || voices[0];
  }

  // Main speak function - adds to queue and processes
  async speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      // Add to queue
      this.speechQueue.push({ text, options, resolve, reject });
      
      // Start processing if not already
      this.processQueue();
    });
  }

  // Process queue one at a time
  async processQueue() {
    // If already processing, return
    if (this.isProcessingQueue) return;
    
    // If queue is empty, return
    if (this.speechQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.speechQueue.length > 0) {
      const { text, options, resolve, reject } = this.speechQueue.shift();
      
      try {
        // Stop any current speech first
        this.stopCurrent();
        
        // Try ElevenLabs first
        if (this.apiKey) {
          try {
            await this.speakWithElevenLabs(text, options);
            resolve();
            continue;
          } catch (error) {
            console.warn('ElevenLabs failed, falling back to Web Speech API:', error.message);
          }
        }
        
        // Fallback to Web Speech API
        await this.speakWithWebSpeech(text, options);
        resolve();
      } catch (error) {
        console.error('Speech error:', error);
        reject(error);
      }
    }
    
    this.isProcessingQueue = false;
  }

  async speakWithElevenLabs(text, options = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': this.apiKey
            },
            body: JSON.stringify({
              text: text,
              model_id: this.modelId,
              voice_settings: {
                stability: options.stability || 0.5,
                similarity_boost: options.similarityBoost || 0.75,
                style: options.style || 0.5,
                use_speaker_boost: true
              }
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail?.message || `ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.currentAudio = new Audio(audioUrl);
        this.isPlaying = true;

        this.currentAudio.onended = () => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        this.currentAudio.onerror = (error) => {
          this.isPlaying = false;
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(error);
        };

        await this.currentAudio.play();
      } catch (error) {
        this.isPlaying = false;
        this.currentAudio = null;
        reject(error);
      }
    });
  }

  async speakWithWebSpeech(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.fallbackVoice) {
        utterance.voice = this.fallbackVoice;
      }
      
      utterance.rate = options.rate || 0.9;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      utterance.lang = 'id-ID';

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        reject(event.error);
      };

      utterance.onend = () => {
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  async speakCurrency(value, text) {
    const spokenText = text || this.valueToText(value);
    return this.speak(spokenText);
  }

  async speakTotal(total) {
    const text = `Total. ${this.valueToText(total)}`;
    return this.speak(text);
  }

  async speakWithPause(items) {
    for (const item of items) {
      await this.speak(item);
      await this.pause(300);
    }
  }

  pause(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  valueToText(num) {
    if (num === 0) return 'nol rupiah';
    
    const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const belasan = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
    
    const convertGroup = (n) => {
      if (n === 0) return '';
      if (n < 10) return satuan[n];
      if (n < 20) return belasan[n - 10];
      if (n < 100) {
        const tens = Math.floor(n / 10);
        const ones = n % 10;
        return satuan[tens] + ' puluh' + (ones > 0 ? ' ' + satuan[ones] : '');
      }
      if (n < 1000) {
        const hundreds = Math.floor(n / 100);
        const remainder = n % 100;
        const hundredText = hundreds === 1 ? 'seratus' : satuan[hundreds] + ' ratus';
        return hundredText + (remainder > 0 ? ' ' + convertGroup(remainder) : '');
      }
      return '';
    };
    
    let result = '';
    
    if (num >= 1000000000) {
      const billions = Math.floor(num / 1000000000);
      num %= 1000000000;
      result += (billions === 1 ? 'satu miliar' : convertGroup(billions) + ' miliar') + ' ';
    }
    
    if (num >= 1000000) {
      const millions = Math.floor(num / 1000000);
      num %= 1000000;
      result += (millions === 1 ? 'satu juta' : convertGroup(millions) + ' juta') + ' ';
    }
    
    if (num >= 1000) {
      const thousands = Math.floor(num / 1000);
      num %= 1000;
      result += (thousands === 1 ? 'seribu' : convertGroup(thousands) + ' ribu') + ' ';
    }
    
    if (num > 0) {
      result += convertGroup(num);
    }
    
    return result.trim() + ' rupiah';
  }

  // Stop current audio only (not queue)
  stopCurrent() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
    
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Stop everything and clear queue
  stop() {
    this.speechQueue = [];
    this.isProcessingQueue = false;
    this.stopCurrent();
  }

  isSpeaking() {
    return this.isPlaying || this.isProcessingQueue || (this.synth?.speaking || false);
  }

  setVoice(voiceId) {
    this.voiceId = voiceId;
  }

  async getAvailableVoices() {
    if (!this.apiKey) return [];
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': this.apiKey
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch voices');
      
      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('Error fetching voices:', error);
      return [];
    }
  }
}

const speechService = new SpeechService();

export default speechService;
