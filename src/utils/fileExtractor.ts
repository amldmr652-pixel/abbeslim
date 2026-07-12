/**
 * Client-side file text extraction utility.
 * Extracts text from PDF, DOCX, XLSX, and PPTX files directly in the browser
 * to avoid serverless function timeouts and payload size limits.
 */
export async function extractTextClientSide(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const type = file.type;

    if (type === 'application/pdf') {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = (content.items as any[]).map((item: any) => item.str || '').join(' ').trim();
        if (pageText) text += `\n[PAGE: ${i}]\n${pageText}`;
      }
      return text;
    }

    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value || '';
    }

    if (type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(buffer, { type: 'array' });
      let text = '';
      workbook.SheetNames.forEach((name: string) => {
        const sheet = workbook.Sheets[name];
        const sheetText = XLSX.utils.sheet_to_txt(sheet);
        if (sheetText.trim()) text += `\n[SAYFA: ${name}]\n${sheetText.trim()}`;
      });
      return text;
    }

    if (type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(buffer);
      let text = '';
      const slideFiles = Object.keys(zip.files)
        .filter(n => n.startsWith('ppt/slides/slide') && n.endsWith('.xml'))
        .sort((a, b) => (parseInt(a.replace(/\D/g, '')) || 0) - (parseInt(b.replace(/\D/g, '')) || 0));
      for (let i = 0; i < slideFiles.length; i++) {
        const slideXml = await zip.files[slideFiles[i]].async('string');
        const matches = slideXml.match(/<a:t>([^<]+)<\/a:t>/g);
        if (matches) {
          const slideText = matches.map((t: string) => t.replace(/<[^>]+>/g, '')).join(' ').trim();
          if (slideText) text += `\n[SLAYT: ${i + 1}]\n${slideText}`;
        }
      }
      return text;
    }

    return '';
  } catch (err: any) {
    console.error('Client-side metin çıkarma hatası:', err);
    return ''; // Hata durumunda boş string — yükleme devam eder
  }
}
