const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Valid Indonesian Rupiah denominations
const VALID_DENOMINATIONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

// Currency text mapping for TTS
const CURRENCY_TEXT = {
  1000: 'seribu rupiah',
  2000: 'dua ribu rupiah',
  5000: 'lima ribu rupiah',
  10000: 'sepuluh ribu rupiah',
  20000: 'dua puluh ribu rupiah',
  50000: 'lima puluh ribu rupiah',
  100000: 'seratus ribu rupiah'
};

/**
 * Convert image file to base64
 */
const imageToBase64 = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (imagePath) => {
  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

/**
 * Detect currency from image using Gemini AI
 */
const detectCurrency = async (imagePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error('Image file not found');
    }

    console.log('Analyzing currency image with Gemini AI:', imagePath);

    // Convert image to base64
    const imageBase64 = imageToBase64(imagePath);
    const mimeType = getMimeType(imagePath);

    // Try different models in order of preference
    const models = ['gemini-2.5-flash', 'gemini-1.5-flash-002', 'gemini-1.5-flash', 'gemini-pro-vision'];
    let result = null;
    let lastError = null;

    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        // Initialize the model
        const model = genAI.getGenerativeModel({ model: modelName });

        // Create the prompt for currency detection
        const prompt = `Analyze this image of Indonesian Rupiah currency (banknote/paper money).

Your task:
1. Identify if this is a valid Indonesian Rupiah banknote
2. Determine the denomination (value) of the banknote

Valid Indonesian Rupiah denominations are: 1000, 2000, 5000, 10000, 20000, 50000, 100000

Response format (JSON only, no markdown):
{
  "isValid": true or false,
  "denomination": number (one of: 1000, 2000, 5000, 10000, 20000, 50000, 100000),
  "currency": "IDR",
  "confidence": number between 0-100,
  "description": "brief description of what you see"
}

If the image is not a valid Indonesian banknote, set isValid to false and denomination to 0.

IMPORTANT: Respond ONLY with valid JSON, no additional text or markdown formatting.`;

        // Generate content with image
        const response = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
          prompt
        ]);

        result = await response.response;
        console.log(`Successfully used model: ${modelName}`);
        break; // Success, exit the loop
      } catch (error) {
        console.warn(`Model ${modelName} failed:`, error.message);
        lastError = error;
        continue; // Try next model
      }
    }

    if (!result) {
      throw lastError || new Error('All models failed to process the image');
    }
    let text = result.text();
    
    console.log('Gemini raw response:', text);

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let detection;
    try {
      detection = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        detection = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid response format from AI');
      }
    }

    // Validate the detected denomination
    if (!detection.isValid || !VALID_DENOMINATIONS.includes(detection.denomination)) {
      return {
        value: 0,
        currency: 'IDR',
        confidence: 0,
        text: 'Tidak dapat mendeteksi uang',
        error: detection.description || 'Invalid or unrecognized currency'
      };
    }

    // Delete the image file after processing
    try {
      fs.unlinkSync(imagePath);
      console.log('Image file deleted after processing:', imagePath);
    } catch (deleteError) {
      console.warn('Warning: Could not delete image file:', deleteError.message);
    }

    return {
      value: detection.denomination,
      currency: detection.currency || 'IDR',
      confidence: parseFloat(detection.confidence) || 85,
      text: CURRENCY_TEXT[detection.denomination],
      description: detection.description
    };

  } catch (error) {
    console.error('Gemini currency detection error:', error);
    
    // Try to delete the image even on error
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (deleteError) {
      console.warn('Warning: Could not delete image file:', deleteError.message);
    }

    return {
      value: 0,
      currency: 'IDR',
      confidence: 0,
      text: 'Tidak dapat mendeteksi',
      error: error.message
    };
  }
};

/**
 * Convert number to Indonesian text
 */
const numberToIndonesianText = (num) => {
  if (num === 0) return 'nol rupiah';
  
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
  const belasan = ['sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas', 
                   'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
  
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
  let numCopy = num;
  
  if (numCopy >= 1000000) {
    const millions = Math.floor(numCopy / 1000000);
    numCopy %= 1000000;
    result += (millions === 1 ? 'satu juta' : convertGroup(millions) + ' juta') + ' ';
  }
  
  if (numCopy >= 1000) {
    const thousands = Math.floor(numCopy / 1000);
    numCopy %= 1000;
    result += (thousands === 1 ? 'seribu' : convertGroup(thousands) + ' ribu') + ' ';
  }
  
  if (numCopy > 0) {
    result += convertGroup(numCopy);
  }
  
  return result.trim() + ' rupiah';
};

module.exports = {
  detectCurrency,
  numberToIndonesianText,
  CURRENCY_TEXT,
  VALID_DENOMINATIONS
};
