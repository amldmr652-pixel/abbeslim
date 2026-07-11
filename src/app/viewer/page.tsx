'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PDFViewerClient = dynamic(() => import('./PDFViewerClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-green-500">
      <Loader2 className="animate-spin mr-2" size={24} /> PDF Yükleniyor...
    </div>
  ),
});

export default function ViewerPage() {
  return <PDFViewerClient />;
}
