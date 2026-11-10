/**
 * Trình tạo mã vạch Code 128 (Code B) thuần TypeScript (Zero-dependency SVG)
 * Chuẩn mã vạch công nghiệp dùng trong kho bãi và quét tự động.
 */

const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export function encodeCode128B(text: string): string[] {
  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code >= 0 && code <= 95) {
      codes.push(code);
      checksum += code * (i + 1);
    }
  }

  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  return codes.map(c => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
}

/**
 * Trả về chuỗi SVG chuẩn của mã vạch
 */
export function generateBarcodeSvg(
  text: string,
  options: {
    height?: number;
    moduleWidth?: number;
    showText?: boolean;
    fillColor?: string;
  } = {}
): string {
  const height = options.height || 60;
  const moduleWidth = options.moduleWidth || 2;
  const showText = options.showText ?? true;
  const fillColor = options.fillColor || '#000000';

  const cleanText = text.trim() || 'PROD-000';
  const patterns = encodeCode128B(cleanText);

  let x = 10; // lề trái 10px
  let rects = '';

  for (const pattern of patterns) {
    for (let j = 0; j < pattern.length; j++) {
      const w = parseInt(pattern[j], 10) * moduleWidth;
      if (j % 2 === 0) {
        // vạch đen
        rects += `<rect x="${x}" y="5" width="${w}" height="${height}" fill="${fillColor}" />`;
      }
      x += w;
    }
  }

  const totalWidth = x + 10;
  const totalHeight = showText ? height + 24 : height + 10;

  const textElement = showText
    ? `<text x="${totalWidth / 2}" y="${height + 19}" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" font-weight="600" fill="${fillColor}">${cleanText}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="${totalWidth}" height="${totalHeight}">
    <rect width="${totalWidth}" height="${totalHeight}" fill="#ffffff" />
    ${rects}
    ${textElement}
  </svg>`;
}

/**
 * Tạo chuỗi nhị phân ESC/POS cắt giấy tự động cho máy in nhiệt mini K80/K58
 */
export function getEscPosCutPaperCommands(): Uint8Array {
  // ESC/POS Cut paper: GS V 65 0 (Full cut with feed)
  return new Uint8Array([
    0x1B, 0x40, // ESC @ (Initialize printer)
    0x0A, 0x0A, 0x0A, // Line feeds
    0x1D, 0x56, 0x41, 0x00 // GS V 65 0 (Cut paper)
  ]);
}
