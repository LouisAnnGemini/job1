import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files as FileList).filter(
        (f: File) => f.name.endsWith('.xlsx') || f.name.endsWith('.xls')
      );
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          onUpload(files);
        }
      }
    },
    [onUpload]
  );

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50/50'
          : 'border-slate-300 hover:border-indigo-400 bg-white'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadCloud className="mx-auto h-16 w-16 text-slate-400 mb-6" />
      <h3 className="text-xl font-medium text-slate-900 mb-2">
        拖拽 Excel 文件到此处，或点击上传
      </h3>
      <p className="text-sm text-slate-500 mb-6">支持 .xlsx, .xls 格式，可批量上传</p>
      <label className="cursor-pointer inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
        选择文件
        <input
          type="file"
          className="hidden"
          multiple
          accept=".xlsx, .xls"
          onChange={handleFileInput}
        />
      </label>
    </div>
  );
};
