/**
 * Text normalization and Arabic character mapping utilities for PDF Viewer and Search.
 */

export const TURKISH_STOPWORDS = new Set([
  'nedir', 'nasıl', 'nerede', 'ne zaman', 'neden', 'niçin', 'kaç',
  'hangi', 'olan', 'olanı', 'hakkında', 'ile', 'göre', 'için',
  'bir', 've', 'ya da', 'veya', 'ama', 'fakat', 'ancak',
  'açıkla', 'anlat', 'tanımla', 'ne anlama gelir', 'ne demek',
  'bana', 'bul', 'göster', 'aç', 'ararmısın', 'arat', 'notları', 'notu'
]);

export function mapCorruptedArabic(text: string, fontMap: Record<string, string> = {}): string {
  if (!text) return '';
  let result = text;

  // Dinamik font haritası varsa öncelikli olarak onu uygula
  const keys = Object.keys(fontMap);
  if (keys.length > 0) {
    keys.forEach(k => {
      if (k) {
        const reg = new RegExp(k.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g');
        result = result.replace(reg, fontMap[k]);
      }
    });
    return result;
  }

  // Yoksa varsayılan statik haritayı uygula
  result = result
    .replace(/ĺ/g, 'ي')
    .replace(/Ĺ/g, 'ي')
    .replace(/ï/g, 'د')
    .replace(/Û/g, 'ت')
    .replace(/Ą/g, 'ض')
    .replace(/Ö/g, 'ب')
    .replace(/ó/g, 'ر')
    .replace(/ĩ/g, 'ع')
    .replace(/Đ/g, 'م')
    .replace(/Ĝ/g, 'ق')
    .replace(/א/g, 'ا')
    .replace(/ħ/g, 'م')
    .replace(/Ĭ/g, 'ن')
    .replace(/ģ/g, 'ه')
    .replace(/ġ/g, 'ه')
    .replace(/Ġ/g, 'ه')
    .replace(/ĵ/g, 'م')
    .replace(/Ĵ/g, 'م')
    .replace(/Ĩ/g, 'ي')
    .replace(/Ļ/g, 'ي')
    .replace(/ė/g, 'ف')
    .replace(/ĉ/g, 'ح')
    .replace(/ĝ/g, 'ي')
    .replace(/Ĥ/g, 'ل')
    .replace(/Ý/g, 'ت')
    .replace(/Ę/g, 'ف')
    .replace(/ā/g, 'ا')
    .replace(/đ/g, 'ر')
    .replace(/כ/g, 'ك');

  // Türkçe büyük İ harfini sadece Arapça/Bozuk font harf/hareke bağlamında Arapça Lam (ل) harfine dönüştür
  result = result.replace(/İ(?=[\u0600-\u06FFĺïÛĄÖóĩĐĜאħĬģġĠĵĴĨכĻėĉĝĤÝĘāđ])/g, 'ل');
  result = result.replace(/([\u0600-\u06FFĺïÛĄÖóĩĐĜאħĬģġĠĵĴĨģכĻėĉĝĤÝĘāđ])İ/g, '$1ل');

  return result;
}

export function normalizeChar(text: string, fontMap: Record<string, string> = {}): string {
  const clean = mapCorruptedArabic(text, fontMap);
  return clean
    .toLocaleLowerCase('tr-TR')
    // Türkçe normalizasyonu
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/i̇/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    // Arapça normalizasyonu
    .replace(/[\u064b-\u0652\u0670]/g, '') // Diacritics (Tashkeel)
    .replace(/\u0640/g, '') // Tatweel (Kashida)
    .replace(/[أإآٱ]/g, 'ا') // Alifs
    .replace(/[i̇ıىی]/g, 'ي') // Ya / Alif Maksura
    .replace(/ة/g, 'ه'); // Ta Marbuta
}

export function normalizeWithMap(fullText: string, dynamicFontMap: Record<string, string> = {}) {
  let normalizedText = '';
  const indexMap: number[] = [];

  for (let i = 0; i < fullText.length; i++) {
    const origChar = fullText[i];
    if (/\s/.test(origChar)) {
      normalizedText += origChar;
      indexMap.push(i);
      continue;
    }

    let char = origChar;

    // Dinamik eşleme varsa öncelikli uygula
    if (dynamicFontMap[char]) {
      char = dynamicFontMap[char];
    } else {
      // Yoksa varsayılan statik eşlemeleri yap
      if (char === 'ĺ' || char === 'Ĺ') char = 'ي';
      else if (char === 'ï') char = 'د';
      else if (char === 'Û') char = 'ت';
      else if (char === 'Ą') char = 'ض';
      else if (char === 'Ö') char = 'ب';
      else if (char === 'ó') char = 'ر';
      else if (char === 'ĩ') char = 'ع';
      else if (char === 'Đ') char = 'م';
      else if (char === 'Ĝ') char = 'ق';
      else if (char === 'א') char = 'ا';
      else if (char === 'ħ') char = 'م';
      else if (char === 'Ĭ') char = 'ن';
      else if (char === 'ģ') char = 'ه';
      else if (char === 'ġ') char = 'ه';
      else if (char === 'Ġ') char = 'ه';
      else if (char === 'ĵ') char = 'م';
      else if (char === 'Ĵ') char = 'م';
      else if (char === 'Ĩ') char = 'ي';
      else if (char === 'Ļ') char = 'ي';
      else if (char === 'ė') char = 'ف';
      else if (char === 'ĉ') char = 'ح';
      else if (char === 'ĝ') char = 'ي';
      else if (char === 'Ĥ') char = 'ل';
      else if (char === 'Ý') char = 'ت';
      else if (char === 'Ę') char = 'ف';
      else if (char === 'ā') char = 'ا';
      else if (char === 'đ') char = 'ر';
      else if (char === 'כ') char = 'ك';
      else if (char === 'İ') {
        const prev = i > 0 ? fullText[i - 1] : '';
        const next = i < fullText.length - 1 ? fullText[i + 1] : '';
        const isPrevArabic = /[\u0600-\u06FFĺïÛĄÖóĩĐĜאħĬģġĠĵĴĨכĻėĉĝĤÝĘāđ]/.test(prev);
        const isNextArabic = /[\u0600-\u06FF]/.test(next) || /[\u0600-\u06FF]/.test(next) || /[\u0600-\u06FFĺïÛĄÖóĩĐĜאħĬģġĠĵĴĨכĻėĉĝĤÝĘāđ]/.test(next);
        if (isPrevArabic || isNextArabic) {
          char = 'ل';
        }
      }
    }

    char = char.toLocaleLowerCase('tr-TR');

    // Turkish normalization
    if (char === 'ç') char = 'c';
    else if (char === 'ğ') char = 'g';
    else if (char === 'ı') char = 'i';
    else if (char === 'i̇') char = 'i';
    else if (char === 'ö') char = 'o';
    else if (char === 'ş') char = 's';
    else if (char === 'ü') char = 'u';
    else if (char === 'â') char = 'a';
    else if (char === 'î') char = 'i';
    else if (char === 'û') char = 'u';

    // Arabic diacritics and tatweel removal
    const isDiacritic = /[\u064b-\u0652\u0670]/.test(char);
    const isTatweel = char === '\u0640';
    if (isDiacritic || isTatweel) {
      continue;
    }

    // Unify Arabic chars
    if (/[أإآٱ]/.test(char)) char = 'ا';
    else if (/[ىی]/.test(char)) char = 'ي';
    else if (char === 'ة') char = 'ه';

    for (let j = 0; j < char.length; j++) {
      normalizedText += char[j];
      indexMap.push(i);
    }
  }

  return { normalizedText, indexMap };
}
