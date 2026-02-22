'use client';

import React, { useState } from 'react';
import { Film, Clock, Maximize, FileText, User, Camera, Palette, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ReferenceUploader } from './ReferenceUploader';
import { ProjectInput, ReferenceUpload } from '@/types';
import { useApp } from '@/lib/store';

export function InputPage() {
  const { submitInput, isGenerating, progressMessage } = useApp();
  
  const [formData, setFormData] = useState({
    title: '',
    director: '',
    cinematographer: '',
    duration: '',
    aspectRatio: '16:9',
    script: '',
  });
  
  const [references, setReferences] = useState<ReferenceUpload[]>([]);
  const [visualStyleNotes, setVisualStyleNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const input: ProjectInput = {
      title: formData.title,
      director: formData.director,
      cinematographer: formData.cinematographer,
      duration: parseInt(formData.duration) || 0,
      aspectRatio: formData.aspectRatio,
      script: formData.script,
      references: references,
      visualStyleNotes: visualStyleNotes,
    };

    await submitInput(input);
  };

  const isValid = formData.title && formData.duration && formData.script && parseInt(formData.duration) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">EiPi Production Package</h1>
          <p className="text-lg text-gray-600">Generate complete production packages from your screenplay</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-600" />
              Project Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Film"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="30"
                  min="1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
                {formData.duration && parseInt(formData.duration) > 0 && (
                  <p className="text-xs text-purple-600 mt-1">
                    Estimated shots: ~{Math.round(parseInt(formData.duration) * 0.75)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Director</label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  placeholder="Director Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cinematographer</label>
                <input
                  type="text"
                  value={formData.cinematographer}
                  onChange={(e) => setFormData({ ...formData, cinematographer: e.target.value })}
                  placeholder="DP Name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Aspect Ratio</label>
                <select
                  value={formData.aspectRatio}
                  onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
                >
                  <option value="16:9">16:9 (Standard)</option>
                  <option value="2.39:1">2.39:1 (Cinematic)</option>
                  <option value="1.85:1">1.85:1 (Academy)</option>
                  <option value="4:3">4:3 (Vintage)</option>
                  <option value="1:1">1:1 (Square)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual References Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Visual References
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Upload mood boards, costume references, location photos, or actor headshots. 
              Add comments to guide GPT in generating accurate Midjourney prompts.
            </p>
            
            <ReferenceUploader 
              references={references} 
              onChange={setReferences} 
            />

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Overall Visual Direction
              </label>
              <textarea
                value={visualStyleNotes}
                onChange={(e) => setVisualStyleNotes(e.target.value)}
                placeholder="Additional notes about visual style, specific requirements, or references for GPT to consider (e.g., 'Use Roger Deakins lighting style', 'Muted color palette like Blade Runner 2049')..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Screenplay */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Screenplay
            </h2>
            <textarea
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              placeholder="Paste your screenplay here...
              
Format example:
INT. COFFEE SHOP - DAY

JOHN (30s) sits at a corner table, nursing a cold cup of coffee. He checks his watch nervously.

JOHN
(whispering to himself)
She's never late.

SARAH (20s, business attire) enters, scanning the room."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none font-mono text-sm"
              rows={15}
            />
          </div>

          {/* Submit */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={!isValid || isGenerating}
              className={`
                w-full md:w-auto px-8 py-4 rounded-xl font-semibold text-white transition-all
                ${!isValid || isGenerating
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {progressMessage || 'Generating...'}
                </span>
              ) : (
                'Generate Production Package'
              )}
            </button>
            
            {!isValid && (
              <p className="text-sm text-gray-500">
                Fill in title, duration, and screenplay to continue
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
