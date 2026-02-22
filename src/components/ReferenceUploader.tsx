'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon, MessageSquare, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { ReferenceUpload } from '@/types';
import OpenAI from 'openai';

interface ReferenceUploaderProps {
  references: ReferenceUpload[];
  onChange: (references: ReferenceUpload[]) => void;
}

// Initialize OpenAI client for browser (requires NEXT_PUBLIC_OPENAI_API_KEY)
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true,
});

export function ReferenceUploader({ references, onChange }: ReferenceUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const analyzeImageWithGPT = async (base64Image: string, category: string): Promise<string> => {
    const categoryPrompts: Record<string, string> = {
      cast: 'Describe this actor/person reference in detail for casting: age range, ethnicity, facial features, hair color/style, build, distinctive characteristics, expression. Be specific for Midjourney prompt generation.',
      costume: 'Describe this costume/outfit reference: clothing items, colors, materials, fit, style, era, condition, accessories. Include fabric textures and specific color details.',
      environment: 'Describe this location/environment: setting type, architecture, geography, time of day suggested, lighting conditions, weather, key visual elements, atmosphere.',
      mood: 'Describe the mood/atmosphere of this reference: color palette, lighting style, emotional tone, cinematographic style, film references it evokes, overall feeling.',
      lighting: 'Describe the lighting in this reference: light source direction, quality (hard/soft), color temperature, shadows, contrast ratio, time of day feel, cinematic lighting style.',
      other: 'Describe this visual reference in detail: key elements, colors, composition, style, and any notable features relevant to film production.'
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${categoryPrompts[category] || categoryPrompts.other} Write 2-3 sentences, be specific and detailed.`
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });
    
    return response.choices[0].message.content || 'No description generated';
  };

  const handleAnalyze = async (ref: ReferenceUpload) => {
    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      setAnalysisError('OpenAI API key not configured. Add NEXT_PUBLIC_OPENAI_API_KEY to your .env.local file.');
      return;
    }

    setAnalyzingId(ref.id);
    setAnalysisError(null);
    
    try {
      const description = await analyzeImageWithGPT(ref.fileUrl, ref.category);
      updateReference(ref.id, { comment: description });
    } catch (err: any) {
      console.error('Vision analysis error:', err);
      setAnalysisError(err.message || 'Failed to analyze image. Try again.');
    } finally {
      setAnalyzingId(null);
    }
  };

  const processFile = async (file: File) => {
    // Check file size (max 5MB for Vision API performance)
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Please use images under 5MB for best performance.');
      return;
    }

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

    const newReferences = [...references, newRef];
    onChange(newReferences);

    // Auto-analyze if it's an image
    if (newRef.type === 'image' && process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      setAnalyzingId(newRef.id);
      try {
        const description = await analyzeImageWithGPT(base64, 'other');
        updateReference(newRef.id, { comment: description });
      } catch (err) {
        console.error('Auto-analysis failed:', err);
      } finally {
        setAnalyzingId(null);
      }
    }
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {analysisError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {analysisError}
        </div>
      )}

      {/* Upload Zone */}
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
            <p className="text-xs text-gray-400 mt-2">Max 5MB per file. Images are auto-analyzed by AI.</p>
          </div>
        </label>
      </div>

      {/* Reference List */}
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
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                    {ref.type === 'image' ? (
                      <>
                        <img 
                          src={ref.fileUrl} 
                          alt={ref.fileName}
                          className="w-full h-full object-cover"
                        />
                        {analyzingId === ref.id && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {ref.fileName}
                        </p>
                        <p className="text-xs text-gray-400">{formatFileSize(ref.fileSize)}</p>
                      </div>
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

                {/* Comment Section */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MessageSquare className="w-3 h-3" />
                      <span>AI Analysis / Your Notes</span>
                    </div>
                    
                    {/* AI Analyze Button */}
                    {ref.type === 'image' && (
                      <button
                        onClick={() => handleAnalyze(ref)}
                        disabled={analyzingId === ref.id}
                        className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:text-gray-400 transition-colors"
                      >
                        {analyzingId === ref.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            {ref.comment ? 'Re-analyze' : 'Analyze with AI'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  <textarea
                    value={ref.comment}
                    onChange={(e) => updateReference(ref.id, { comment: e.target.value })}
                    placeholder={ref.type === 'image' 
                      ? "AI will auto-describe this image, or type your own notes..." 
                      : "Describe what GPT should know from this document..."
                    }
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
                    rows={3}
                  />
                  
                  {!ref.comment && ref.type === 'image' && !process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ Add NEXT_PUBLIC_OPENAI_API_KEY to .env.local for auto-analysis
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
