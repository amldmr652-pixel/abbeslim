import { jsPDF } from 'jspdf';
import { apiClient } from '@/lib/apiClient';

/**
 * AI yanıtını PDF olarak oluşturup Kütüphane'ye (Supabase Storage) yükler.
 * useChat.ts içindeki orijinal handleSaveAsPDF mantığının extract edilmiş halidir.
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export async function saveChatAsPDF(
  question: string,
  answer: string,
  title: string = 'Calisma_Notu'
): Promise<void> {
  // 1. Fontları yükle
  const [resRegular, resBold] = await Promise.all([
    fetch('/fonts/Roboto-Regular.ttf'),
    fetch('/fonts/Roboto-Medium.ttf')
  ]);

  if (!resRegular.ok || !resBold.ok) {
    throw new Error('Font yükleme hatası. Sunucuyla bağlantı kurulamadı.');
  }

  const [bufferRegular, bufferBold] = await Promise.all([
    resRegular.arrayBuffer(),
    resBold.arrayBuffer()
  ]);

  const base64Regular = arrayBufferToBase64(bufferRegular);
  const base64Bold = arrayBufferToBase64(bufferBold);

  // 2. PDF oluştur
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.addFileToVFS('Roboto-Regular.ttf', base64Regular);
  doc.addFileToVFS('Roboto-Medium.ttf', base64Bold);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFont('Roboto-Medium.ttf', 'Roboto', 'bold');

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - (margin * 2);

  let y = 20;

  // Header
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(22, 163, 74);
  doc.text('abbeslim Çalışma Notu', margin, y);

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);

  y += 10;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, margin, y);

  // Soru bölümü
  y += 10;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text('SORU:', margin, y);

  y += 6;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  const splitQuestion = doc.splitTextToSize(question, contentWidth);
  doc.text(splitQuestion, margin, y);
  y += splitQuestion.length * 5 + 5;

  doc.line(margin, y, pageWidth - margin, y);

  // AI Yanıtı bölümü
  y += 10;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(22, 163, 74);
  doc.text('AI YANITI / ÖZET:', margin, y);

  y += 6;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);

  const cleanAnswer = answer.replace(/\*\*/g, '').replace(/\*/g, '');
  const splitAnswer = doc.splitTextToSize(cleanAnswer, contentWidth);

  const lineHeight = 6;
  for (let i = 0; i < splitAnswer.length; i++) {
    if (y > pageHeight - margin) {
      doc.addPage();
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      y = margin;
    }
    doc.text(splitAnswer[i], margin, y);
    y += lineHeight;
  }

  // 3. PDF blob oluştur
  const pdfBlob = doc.output('blob');
  const fileName = `${title}_Calisma_Notu.pdf`;

  // 4. Kategoriyi bul veya oluştur ("Notlarım")
  let catId = '';
  try {
    const catRes = await apiClient('/api/categories');
    const catData = await catRes.json();
    const categoriesList = catData.categories || [];

    const existingCat = categoriesList.find(
      (c: any) => c.name.toLowerCase() === 'notlarım' || c.name.toLowerCase() === 'notlarim'
    );

    if (existingCat) {
      catId = existingCat.id;
    } else {
      const createRes = await apiClient('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', name: 'Notlarım' })
      });

      if (createRes.ok) {
        const createData = await createRes.json();
        catId = createData.category?.id;
      }
    }

    if (!catId && categoriesList.length > 0) {
      catId = categoriesList[0].id;
    }
  } catch (e) {
    console.error('Kategori işleme hatası:', e);
  }

  if (!catId) {
    catId = 'default';
  }

  // 5. Kütüphaneye yükle
  const formData = new FormData();
  formData.append('file', pdfBlob, fileName);
  formData.append('name', fileName);
  formData.append('categoryId', catId);
  formData.append('date', new Date().toISOString().split('T')[0]);

  const uploadRes = await apiClient('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!uploadRes.ok) throw new Error('PDF kütüphaneye yüklenemedi');
}
