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
    const estimatedShots = Math.round(durationNum * 0.75);
    
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 pt-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3">Production Package Ready!</h1>
            <p className="text-white/60 text-lg">
              {input?.title} • {pkg?.shots.length || 0} shots • {mjPrompts.length} MJ prompts
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Complete Package</h3>
              <p className="text-white/50 text-sm mb-4">Full production document with all shots, packs, and prompts</p>
              <button
                onClick={downloadCompletePackage}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">MJ Prompts Only</h3>
              <p className="text-white/50 text-sm mb-4">Clean text file with all Midjourney prompts</p>
              <button
                onClick={downloadTxt}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Shot List Only</h3>
              <p className="text-white/50 text-sm mb-4">Formatted shot breakdown document</p>
              <button
                onClick={downloadDoc}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-medium"
              >
                <Download className="w-4 h-4" />
                Download .txt
              </button>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full bg-white/5 hover:bg-white/10 text-white/60 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Start New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 pt-10">
          <h1 className="text-4xl font-bold text-white mb-3">EiPi&apos;s Prompt Engine</h1>
          <p className="text-white/60 text-lg">Generate complete production packages from your screenplay</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Project Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Film"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Director</label>
              <input
                type="text"
                value={formData.director}
                onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                placeholder="Director Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Cinematographer</label>
              <input
                type="text"
                value={formData.cinematographer}
                onChange={(e) => setFormData({ ...formData, cinematographer: e.target.value })}
                placeholder="DP Name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Duration (seconds)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="30"
                min="1"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
              {durationNum > 0 && (
                <p className="text-white/40 text-xs mt-2">
                  Estimated shots: ~{estimatedShots} (0.75 × {durationNum}s)
                </p>
              )}
            </div>
            <div>
              <label className="block text-white/70 text-sm mb-2">Aspect Ratio</label>
              <select
                value={formData.aspectRatio}
                onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="16:9" className="bg-slate-800">16:9 (Landscape)</option>
                <option value="9:16" className="bg-slate-800">9:16 (Portrait/Reels)</option>
                <option value="1:1" className="bg-slate-800">1:1 (Square)</option>
                <option value="4:5" className="bg-slate-800">4:5 (Instagram)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Screenplay</label>
            <textarea
              value={formData.script}
              onChange={(e) => setFormData({ ...formData, script: e.target.value })}
              placeholder="Paste your screenplay here..."
              rows={12}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || !formData.script.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all font-medium text-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Production Package...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Package
              </>
            )}
          </button>

          {isGenerating && (
            <div className="bg-white/5 rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-white/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing script structure...</span>
              </div>
              <div className="flex items-center gap-3 text-white/40">
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                <span className="text-sm">Generating shot breakdown...</span>
              </div>
              <div className="flex items-center gap-3 text-white/40">
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                <span className="text-sm">Creating character & environment packs...</span>
              </div>
              <div className="flex items-center gap-3 text-white/40">
                <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                <span className="text-sm">Building detailed MJ prompts...</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
