const fs = require('fs');
const https = require('https');
const url = 'https://clsoofovxkpmwfltbeyk.supabase.co/storage/v1/object/public/uploads/a06976fb-526b-4ef8-9343-6f8b5a5dc6be.pdf';

https.get(url, (res) => {
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', async () => {
    const buffer = Buffer.concat(chunks);
    
    // Send to test-pdf
    const req = https.request('https://notefinder.vercel.app/api/test-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
      }
    }, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => { console.log('API SONUCU:', data); });
    });
    
    const body = '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\nContent-Type: application/pdf\r\n\r\n';
    
    req.write(body);
    req.write(buffer);
    req.write('\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n');
    req.end();
  });
});
