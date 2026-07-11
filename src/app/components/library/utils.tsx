import { FileText, PlaySquare, Image as ImageIcon } from 'lucide-react';

export const getFileIcon = (type: string) => {
  if (type.includes('video')) return <PlaySquare className="text-blue-400 group-hover:scale-110 transition-transform duration-300" size={36} />;
  if (type.includes('image')) return <ImageIcon className="text-pink-400 group-hover:scale-110 transition-transform duration-300" size={36} />;
  return <FileText className="text-orange-400 group-hover:scale-110 transition-transform duration-300" size={36} />;
};
