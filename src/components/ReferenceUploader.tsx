'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { ReferenceUpload } from '@/types';

interface ReferenceUploaderProps {
  references: ReferenceUpload[];
  onChange: (references: ReferenceUpload[]) => void;
}

export function ReferenceUploader({ references, onChange }: ReferenceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (file: File) => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const newRef: ReferenceUpload = {
      id: Math.random().toString(36).substr(2, 9),
      type: file.type.startsWith('image/') ? 'image' : 'document',
      fileName: file.name,
      fileUrl: base64,
      fileSize: file.size,
      comment: '',
      category: 'other',
      uploadedAt: new Date(),
    };

    onChange([...references, newRef]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(processFile);
  }, [references, onChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processFile);
  };

  const updateReference = (id: string, updates: Partial<ReferenceUpload>) => {
    onChange(references.map(ref => 
      ref.id === id ? { ...ref, ...updates } : ref
    ));
  };

  const removeReference = (id: string) => {
    onChange(references.filter(ref => ref.id !== id));
  };

  const getCategoryColor = (cat: ReferenceUpload['category']) => {
    const colors = {
      cast: 'bg-blue-100 text-blue-700 border-blue-200',
      costume: 'bg-purple-100 text-purple-700 border-purple-200',
      environment: 'bg-green-100 text-green-700 border-green-200',
      mood: 'bg-pink-100 text-pink-700 border-pink-200',
      lighting: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      other: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[cat];
  };

  const getCategoryLabel = (cat: ReferenceUpload['category']) => {
    const labels = {
      cast: 'Cast Reference',
      costume: 'Costume Reference',
      environment: 'Environment/Location',
      mood: 'Mood/Atmosphere',
      lighting: 'Lighting Reference',
      other: 'Other',
    };
    return labels[cat];
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
          ${isDragging 
            ? 'border-purple-500 bg-purple-50 scale-105' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">Drop reference images or documents here</p>
            <p className="text-sm text-gray-500 mt-1">or click to browse (images, PDFs, DOCX)</p>
          </div>
        </label>
      </div>

      {references.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              References ({references.length})
            </h3>
            <span className="text-xs text-gray-500">
              {references.filter(r => r.category !== 'other').length} categorized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {references.map((ref) => (
              <div 
                key={ref.id} 
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {ref.type === 'image' ? (
                      <img 
                        src={ref.fileUrl} 
                        alt={ref.fileName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {ref.fileName}
                      </p>
                      <button
                        onClick={() => removeReference(ref.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <select
                      value={ref.category}
                      onChange={(e) => updateReference(ref.id, { 
                        category: e.target.value as ReferenceUpload['category'] 
                      })}
                      className={`mt-2 text-xs px-2 py-1 rounded-full border ${getCategoryColor(ref.category)}`}
                    >
                      <option value="cast">Cast Reference</option>
                      <option value="costume">Costume Reference</option>
                      <option value="environment">Environment/Location</option>
                      <option value="mood">Mood/Atmosphere</option>
                      <option value="lighting">Lighting Reference</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                    <MessageSquare className="w-3 h-3" />
                    <span>Context for GPT</span>
                  </div>
                  <textarea
                    value={ref.comment}
                    onChange={(e) => updateReference(ref.id, { comment: e.target.value })}
                    placeholder={`Describe what GPT should note from this ${ref.type}...`}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
