const { jsPDF } = require('jspdf');

async function test() {
  const urls = [
    'https://fastly.jsdelivr.net/npm/roboto-fontface@0.10.0/fonts/roboto/Roboto-Regular.ttf',
    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
    'https://raw.githubusercontent.com/google/fonts/main/ofl/roboto/static/Roboto-Regular.ttf'
  ];

  for (const url of urls) {
    try {
      console.log(`Trying URL: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`Failed with status: ${res.status}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      console.log('Success! Base64 length:', base64.length);

      const doc = new jsPDF();
      doc.addFileToVFS('Roboto-Regular.ttf', base64);
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');
      
      doc.text('İslamda çok eşlilik nedir? Şanlıurfa, ılık, öç, Ülkü, Çiçek, Gölet.', 10, 10);
      doc.save('test.pdf');
      console.log('PDF saved successfully!');
      return;
    } catch (err) {
      console.error('Error fetching/processing:', err.message);
    }
  }
}

test();
