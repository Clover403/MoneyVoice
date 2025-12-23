/**
 * Beep Sound Service
 * Plays a beep sound when scanning starts to provide audio feedback
 */

class BeepSoundService {
  constructor() {
    this.audioContext = null;
  }

  // Initialize audio context (must be called from user interaction)
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Play a beep sound
   * @param {number} frequency - Frequency in Hz (default: 800)
   * @param {number} duration - Duration in milliseconds (default: 200)
   * @param {number} volume - Volume 0-1 (default: 0.5)
   */
  playBeep(frequency = 800, duration = 200, volume = 0.5) {
    try {
      const ctx = this.init();
      
      // Resume audio context if suspended (required for some browsers)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Set volume
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      
      // Fade out to avoid click sound
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      return true;
    } catch (error) {
      console.error('Error playing beep:', error);
      return false;
    }
  }

  /**
   * Play a "scan start" beep - friendly confirmation sound
   */
  playScanBeep() {
    // Play a two-tone beep to indicate scan started
    this.playBeep(600, 100, 0.4);
    setTimeout(() => {
      this.playBeep(800, 150, 0.4);
    }, 100);
  }

  /**
   * Play a "success" sound
   */
  playSuccessBeep() {
    this.playBeep(600, 100, 0.3);
    setTimeout(() => {
      this.playBeep(800, 100, 0.3);
    }, 100);
    setTimeout(() => {
      this.playBeep(1000, 150, 0.3);
    }, 200);
  }

  /**
   * Play an "error" sound
   */
  playErrorBeep() {
    this.playBeep(400, 200, 0.4);
    setTimeout(() => {
      this.playBeep(300, 300, 0.4);
    }, 200);
  }
}

// Export singleton instance
const beepSoundService = new BeepSoundService();
export default beepSoundService;
