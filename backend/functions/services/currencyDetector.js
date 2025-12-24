const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

// Daftar nominal uang Rupiah yang valid
const VALID_DENOMINATIONS = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

// Mapping nilai ke teks Indonesia untuk TTS
const CURRENCY_TEXT = {
  1000: 'seribu rupiah',
  2000: 'dua ribu rupiah',
  5000: 'lima ribu rupiah',
  10000: 'sepuluh ribu rupiah',
  20000: 'dua puluh ribu rupiah',
  50000: 'lima puluh ribu rupiah',
  100000: 'seratus ribu rupiah'
};

// Karakteristik warna dominan uang Rupiah (dalam format RGB)
// Ini adalah pendekatan sederhana berdasarkan warna dominan
const CURRENCY_COLOR_PROFILES = {
  1000: {
    // Uang 1000 - dominan hijau kebiruan
    colors: [
      { r: [100, 180], g: [140, 200], b: [120, 180] }, // hijau
      { r: [80, 150], g: [120, 180], b: [140, 200] }   // biru-hijau
    ],
    name: 'Seribu Rupiah'
  },
  2000: {
    // Uang 2000 - dominan abu-abu kebiruan
    colors: [
      { r: [140, 200], g: [150, 200], b: [160, 210] }, // abu kebiruan
      { r: [120, 180], g: [130, 190], b: [150, 200] }
    ],
    name: 'Dua Ribu Rupiah'
  },
  5000: {
    // Uang 5000 - dominan coklat/oranye keemasan
    colors: [
      { r: [180, 240], g: [130, 190], b: [80, 140] },  // coklat oranye
      { r: [200, 255], g: [150, 210], b: [100, 160] }  // keemasan
    ],
    name: 'Lima Ribu Rupiah'
  },
  10000: {
    // Uang 10000 - dominan ungu
    colors: [
      { r: [100, 170], g: [70, 140], b: [130, 200] },  // ungu
      { r: [120, 180], g: [80, 150], b: [150, 210] }
    ],
    name: 'Sepuluh Ribu Rupiah'
  },
  20000: {
    // Uang 20000 - dominan hijau
    colors: [
      { r: [80, 150], g: [140, 210], b: [80, 150] },   // hijau
      { r: [100, 170], g: [160, 220], b: [100, 170] }
    ],
    name: 'Dua Puluh Ribu Rupiah'
  },
  50000: {
    // Uang 50000 - dominan biru
    colors: [
      { r: [50, 120], g: [100, 170], b: [160, 230] },  // biru
      { r: [70, 140], g: [120, 190], b: [180, 240] }
    ],
    name: 'Lima Puluh Ribu Rupiah'
  },
  100000: {
    // Uang 100000 - dominan merah
    colors: [
      { r: [180, 255], g: [80, 150], b: [80, 150] },   // merah
      { r: [200, 255], g: [100, 170], b: [100, 170] }
    ],
    name: 'Seratus Ribu Rupiah'
  }
};

/**
 * Analisis warna dominan dari gambar
 */
const analyzeImageColors = async (imagePath) => {
  try {
    const image = await Jimp.read(imagePath);
    
    // Resize untuk mempercepat analisis
    image.resize(200, Jimp.AUTO);
    
    const width = image.getWidth();
    const height = image.getHeight();
    
    // Sampling warna dari area tengah gambar (di mana uang kemungkinan berada)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const sampleSize = Math.min(width, height) * 0.6;
    
    let totalR = 0, totalG = 0, totalB = 0;
    let pixelCount = 0;
    
    const colorHistogram = {
      red: 0,
      green: 0,
      blue: 0,
      brown: 0,
      purple: 0,
      gray: 0
    };
    
    // Sample pixels dari area tengah
    const startX = Math.max(0, Math.floor(centerX - sampleSize / 2));
    const endX = Math.min(width, Math.floor(centerX + sampleSize / 2));
    const startY = Math.max(0, Math.floor(centerY - sampleSize / 2));
    const endY = Math.min(height, Math.floor(centerY + sampleSize / 2));
    
    for (let y = startY; y < endY; y += 2) {
      for (let x = startX; x < endX; x += 2) {
        const color = Jimp.intToRGBA(image.getPixelColor(x, y));
        
        // Skip pixel yang terlalu gelap atau terlalu terang
        const brightness = (color.r + color.g + color.b) / 3;
        if (brightness < 30 || brightness > 240) continue;
        
        totalR += color.r;
        totalG += color.g;
        totalB += color.b;
        pixelCount++;
        
        // Kategorisasi warna
        if (color.r > color.g + 30 && color.r > color.b + 30) {
          colorHistogram.red++;
        } else if (color.g > color.r + 20 && color.g > color.b + 20) {
          colorHistogram.green++;
        } else if (color.b > color.r + 20 && color.b > color.g + 20) {
          colorHistogram.blue++;
        } else if (color.r > 150 && color.g > 100 && color.g < 180 && color.b < 150) {
          colorHistogram.brown++;
        } else if (color.r > 100 && color.b > 100 && color.g < color.r && color.g < color.b) {
          colorHistogram.purple++;
        } else {
          colorHistogram.gray++;
        }
      }
    }
    
    if (pixelCount === 0) {
      throw new Error('Tidak dapat menganalisis gambar');
    }
    
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);
    
    return {
      averageColor: { r: avgR, g: avgG, b: avgB },
      histogram: colorHistogram,
      totalPixels: pixelCount
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

/**
 * Mencocokkan warna dengan profil uang
 */
const matchCurrencyByColor = (colorAnalysis) => {
  const { averageColor, histogram } = colorAnalysis;
  const { r, g, b } = averageColor;
  
  let bestMatch = null;
  let bestScore = 0;
  
  // Hitung total dari histogram
  const histogramTotal = Object.values(histogram).reduce((a, b) => a + b, 0);
  
  // Normalisasi histogram
  const normalizedHistogram = {};
  for (const key in histogram) {
    normalizedHistogram[key] = histogram[key] / histogramTotal;
  }
  
  // Deteksi berdasarkan warna dominan
  // Merah dominan = 100.000
  if (normalizedHistogram.red > 0.25 && r > 170 && r > g + 30 && r > b + 30) {
    return {
      nilai: 100000,
      confidence: 85 + (normalizedHistogram.red * 15),
      text: CURRENCY_TEXT[100000]
    };
  }
  
  // Biru dominan = 50.000
  if (normalizedHistogram.blue > 0.25 && b > 150 && b > r + 20 && b > g) {
    return {
      nilai: 50000,
      confidence: 85 + (normalizedHistogram.blue * 15),
      text: CURRENCY_TEXT[50000]
    };
  }
  
  // Hijau dominan = 20.000 atau 1.000
  if (normalizedHistogram.green > 0.25 && g > 140 && g > r + 20 && g > b + 10) {
    // Hijau lebih terang = 20.000, lebih gelap dengan sedikit biru = 1.000
    if (g > 160 && r < 140) {
      return {
        nilai: 20000,
        confidence: 82 + (normalizedHistogram.green * 15),
        text: CURRENCY_TEXT[20000]
      };
    } else {
      return {
        nilai: 1000,
        confidence: 78 + (normalizedHistogram.green * 15),
        text: CURRENCY_TEXT[1000]
      };
    }
  }
  
  // Ungu dominan = 10.000
  if (normalizedHistogram.purple > 0.2 || (r > 100 && r < 180 && b > 130 && b > g + 20)) {
    return {
      nilai: 10000,
      confidence: 83 + (normalizedHistogram.purple * 15),
      text: CURRENCY_TEXT[10000]
    };
  }
  
  // Coklat/oranye dominan = 5.000
  if (normalizedHistogram.brown > 0.2 || (r > 180 && g > 120 && g < 200 && b < 150)) {
    return {
      nilai: 5000,
      confidence: 84 + (normalizedHistogram.brown * 15),
      text: CURRENCY_TEXT[5000]
    };
  }
  
  // Abu-abu kebiruan = 2.000
  if (normalizedHistogram.gray > 0.3 && b > r && b > g - 20) {
    return {
      nilai: 2000,
      confidence: 75 + (normalizedHistogram.gray * 10),
      text: CURRENCY_TEXT[2000]
    };
  }
  
  // Default berdasarkan analisis warna langsung
  // Cek setiap profil warna
  for (const [value, profile] of Object.entries(CURRENCY_COLOR_PROFILES)) {
    let matchScore = 0;
    
    for (const colorRange of profile.colors) {
      if (r >= colorRange.r[0] && r <= colorRange.r[1] &&
          g >= colorRange.g[0] && g <= colorRange.g[1] &&
          b >= colorRange.b[0] && b <= colorRange.b[1]) {
        matchScore += 50;
      }
      
      // Partial match
      const rMatch = Math.max(0, 1 - Math.abs(r - (colorRange.r[0] + colorRange.r[1]) / 2) / 100);
      const gMatch = Math.max(0, 1 - Math.abs(g - (colorRange.g[0] + colorRange.g[1]) / 2) / 100);
      const bMatch = Math.max(0, 1 - Math.abs(b - (colorRange.b[0] + colorRange.b[1]) / 2) / 100);
      
      matchScore += (rMatch + gMatch + bMatch) * 10;
    }
    
    if (matchScore > bestScore) {
      bestScore = matchScore;
      bestMatch = parseInt(value);
    }
  }
  
  if (bestMatch) {
    return {
      nilai: bestMatch,
      confidence: Math.min(95, 60 + bestScore / 2),
      text: CURRENCY_TEXT[bestMatch]
    };
  }
  
  // Fallback ke deteksi sederhana
  return detectBySimpleHeuristics(r, g, b);
};

/**
 * Deteksi sederhana berdasarkan heuristik warna
 */
const detectBySimpleHeuristics = (r, g, b) => {
  // Sorting berdasarkan intensitas
  const max = Math.max(r, g, b);
  
  if (max === r && r > 180) {
    return { nilai: 100000, confidence: 70, text: CURRENCY_TEXT[100000] };
  }
  if (max === b && b > 150) {
    return { nilai: 50000, confidence: 70, text: CURRENCY_TEXT[50000] };
  }
  if (max === g && g > 150) {
    return { nilai: 20000, confidence: 65, text: CURRENCY_TEXT[20000] };
  }
  if (r > 150 && g > 100 && b < 120) {
    return { nilai: 5000, confidence: 65, text: CURRENCY_TEXT[5000] };
  }
  
  // Default
  return { nilai: 10000, confidence: 50, text: CURRENCY_TEXT[10000] };
};

/**
 * Fungsi utama untuk mendeteksi nilai uang dari gambar
 */
const detectCurrency = async (imagePath) => {
  try {
    // Cek apakah file ada
    if (!fs.existsSync(imagePath)) {
      throw new Error('File gambar tidak ditemukan');
    }
    
    console.log('Analyzing currency image:', imagePath);
    
    // Analisis warna gambar
    const colorAnalysis = await analyzeImageColors(imagePath);
    console.log('Color analysis result:', colorAnalysis.averageColor);
    console.log('Color histogram:', colorAnalysis.histogram);
    
    // Cocokkan dengan profil uang
    const result = matchCurrencyByColor(colorAnalysis);
    
    console.log('Detection result:', result);
    
    return {
      nilai: result.nilai,
      confidence: parseFloat(result.confidence.toFixed(2)),
      text: result.text
    };
  } catch (error) {
    console.error('Currency detection error:', error);
    // Return nilai default jika terjadi error
    return {
      nilai: 0,
      confidence: 0,
      text: 'Tidak dapat mendeteksi',
      error: error.message
    };
  }
};

/**
 * Fungsi untuk mengkonversi angka ke teks Indonesia
 */
const numberToIndonesianText = (num) => {
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
