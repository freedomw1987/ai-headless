/**
 * PPTX Parser
 * 用途: 從 .pptx 檔案中抽取所有 slide 的文字內容
 *
 * Sprint 48-5 FR-13.3
 * - 使用 jszip + fast-xml-parser (輕量套件組合, ~1MB)
 * - PPTX 本質是 ZIP, 內含 ppt/slides/slide{N}.xml
 * - 動態 import (避免 bundle 過大)
 *
 * 算法:
 * 1. JSZip 載入 .pptx buffer
 * 2. 枚舉 ppt/slides/slide*.xml (按數字排序)
 * 3. fast-xml-parser 解析 XML
 * 4. 遞迴抽取所有 <a:t> 文字節點
 */

export interface PptxParseOptions {
  /** 最多解析幾張 slide (預設 50) */
  maxSlides?: number;
  /** slide 分隔符 */
  slideSeparator?: string;
}

/**
 * 解析 PPTX buffer 回傳所有 slide 的純文字
 *
 * @param buffer PPTX 檔案的 Buffer
 * @returns 所有 slide 文字 (以 slideSeparator 分隔)
 */
export async function parsePptx(
  buffer: Buffer,
  options: PptxParseOptions = {},
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    return '';
  }

  const {
    maxSlides = 50,
    slideSeparator = '\n\n--- Slide {index} ---\n\n',
  } = options;

  // 動態 import 避免 bundle 過大
  const JSZip = (await import('jszip')).default;
  const { XMLParser } = await import('fast-xml-parser');

  const zip = await JSZip.loadAsync(buffer);

  // 1. 找出所有 ppt/slides/slide{N}.xml 檔案
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0', 10);
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0', 10);
      return numA - numB;
    })
    .slice(0, maxSlides);

  if (slideFiles.length === 0) {
    return '';
  }

  const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
  });

  const slides: string[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const fileName = slideFiles[i];
    if (!fileName) continue;
    const file = zip.files[fileName];
    if (!file) continue;

    const xmlContent = await file.async('string');
    const parsed = parser.parse(xmlContent);

    // 2. 遞迴抽取所有 <a:t> 文字節點 (PPTML 文字命名空間)
    const texts: string[] = [];
    extractTextNodes(parsed, 'a:t', texts);

    const slideText = texts.join(' ').trim();
    if (slideText) {
      slides.push(
        slideSeparator.replace('{index}', String(i + 1)) + slideText,
      );
    }
  }

  return slides.join('\n').trim();
}

/**
 * 遞迴從 XML 物件中抽出指定 tag 的文字內容
 */
function extractTextNodes(
  obj: unknown,
  tag: string,
  texts: string[],
): void {
  if (!obj || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      extractTextNodes(item, tag, texts);
    }
    return;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === tag && typeof value === 'string') {
      texts.push(value);
    } else if (value && typeof value === 'object') {
      extractTextNodes(value, tag, texts);
    }
  }
}