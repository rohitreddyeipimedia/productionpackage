'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Send, FileText, Download, RotateCcw, Check, Loader2, Package } from 'lucide-react';

export default function InputPage() {
  const {
    submitInput,
    isGenerating,
    error,
    isComplete,
    progressMessage,
    downloadTxt,
    downloadDoc,
    downloadCompletePackage,
    reset,
    input,
    package: pkg,
    mjPrompts,
  } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    director: '',
    cinematographer: '',
    duration: '',
    aspectRatio: '16:9',
    script: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.script.trim()) return;
    
    const durationNum = parseInt(formData.duration) || 30;
    
    await submitInput({
      title: formData.title || 'Untitled Project',
      director: formData.director || 'TBD',
      cinematographer: formData.cinematographer || 'TBD',
      duration: durationNum,
      aspectRatio: formData.aspectRatio,
      script: formData.script,
    });
  };

  const handleReset = () => {
    setFormData({
      title: '',
      director: '',
      cinematographer: '',
      duration: '',
      aspectRatio: '16:9',
      script: '',
    });
    reset();
  };

  const durationNum = parseInt(formData.duration) || 0;
  const estimatedShots = durationNum > 0 ? Math.round(durationNum * 0.75) : 0;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 pt-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-6">
              <Check className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">Production Package Ready!</h1>
            <p className="text-gray-500 text-lg font-light">
              {input?.title} • {pkg?.shots.length || 0} shots • {mjPrompts.length} MJ prompts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group hover:border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Complete Package</h3>
              <p className="text-gray-500 text-sm mb-4 font-light">Full production document with all shots, packs, and prompts</p>
              <button
                onClick={downloadCompletePackage}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group hover:border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">MJ Prompts Only</h3>
              <p className="text-gray-500 text-sm mb-4 font-light">Clean text file with all Midjourney prompts</p>
              <button
                onClick={downloadTxt}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all group hover:border-purple-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Shot List Only</h3>
              <p className="text-gray-500 text-sm mb-4 font-light">Formatted shot breakdown document</p>
              <button
                onClick={downloadDoc}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 pt-10">
          <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">EiPi&apos;s Prompt Engine</h1>
          <p className="text-gray-500 text-lg font-light">Generate complete production packages from your screenplay</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Project Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Film"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Director</label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                placeholder="Director Name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Cinematographer</label>
              <input
                type="text"
                value={formData.cinematographer}
                onChange={(e) => setFormData({ ...formData, cinematographer: e.target.value })}
                placeholder="DP Name"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                min="1"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              />
              {durationNum > 0 && (
                <p className="text-purple-600 text-xs mt-2 font-medium">
                  Estimated shots: ~{estimatedShots} (0.75 × {durationNum}s)
                </p>
              )}
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Aspect Ratio</label>
              <select
                value={formData.aspectRatio}
                onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait/Reels)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:5">4:5 (Instagram)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Screenplay</label>
            <textarea
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              placeholder="Paste your screenplay here..."
              rows={12}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !formData.script.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-medium text-lg shadow-md hover:shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {progressMessage || 'Generating...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Package
              </>
            )}
          </button>

          {isGenerating && progressMessage && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <div className="flex items-center gap-3 text-purple-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">{progressMessage}</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
