// Simple speech test utility
import speechService from '../services/speech';

export const testSpeech = async () => {
  console.log('Testing speech service...');
  
  try {
    // Test Web Speech API (fallback)
    console.log('Testing Web Speech API fallback...');
    await speechService.speak('Halo, ini adalah tes layanan bicara');
    console.log('✅ Web Speech API test passed');
  } catch (error) {
    console.error('❌ Speech test failed:', error);
  }
  
  try {
    // Test Indonesian currency conversion
    console.log('Testing Indonesian currency conversion...');
    const text = speechService.valueToText(15000);
    console.log('15000 ->', text);
    await speechService.speak(text);
    console.log('✅ Currency conversion test passed');
  } catch (error) {
    console.error('❌ Currency conversion test failed:', error);
  }
};

export const checkBrowserSupport = () => {
  const support = {
    webkitSpeechRecognition: 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
    getUserMedia: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices,
  };
  
  console.log('Browser speech support:', support);
  return support;
};
