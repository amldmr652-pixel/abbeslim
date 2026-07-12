'use client';
import { FileText, ChevronRight } from 'lucide-react';
import { Card } from '@/app/components/ui';
import Link from 'next/link';
import { useTranslation } from '@/app/hooks/useTranslation';
interface RecentFile {
  id: string | number;
  name: string;
  type: string;
  date: string;
  url?: string | null;
}
interface RecentFilesWidgetProps {
  files: RecentFile[];
}
export default function RecentFilesWidget({ files }: RecentFilesWidgetProps) {
  const { t } = useTranslation();
  const handleFileClick = (file: RecentFile) => {
    if (file.url) {
      if (file.type === 'pdf') {
        window.open(`/viewer?url=${encodeURIComponent(file.url)}`, '_blank');
      } else {
        window.open(file.url, '_blank');
      }
    }
  };
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText size={18} className="text-orange-400" /> {t('dashboard.recentFiles')}
        </h2>
        <Link href="/library" className="text-xs text-green-500 hover:text-green-400 flex items-center gap-1 transition-colors">
          {t('common.all')} <ChevronRight size={14} className="rtl:rotate-180" />
        </Link>
      </div>
      <div className="space-y-3">
        {files.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">{t('dashboard.noFiles')}</div>
        ) : (
          files.map(file => (
            <div 
              key={file.id} 
              onClick={() => handleFileClick(file)}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="p-2 bg-orange-900/20 rounded-lg shrink-0">
                <FileText size={16} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate group-hover:text-green-400 transition-colors">{file.name}</p>
                <p className="text-xs text-gray-500">{file.type.toUpperCase()} • {file.date}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
