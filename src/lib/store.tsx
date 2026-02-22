'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectInput, Shot, Packs, MJPrompt } from '@/types';

interface AppState {
  input: ProjectInput | null;
  analysis: any | null;
  shots: Shot[];
  packs: Packs | null;
  mjPrompts: MJPrompt[];
  isGenerating: boolean;
  error: string | null;
  isComplete: boolean;
}

interface AppContextType extends AppState {
  submitInput: (input: ProjectInput) => Promise<void>;
  downloadTxt: () => void;
  downloadDoc: () => void;
  downloadCompletePackage: () => void;
  reset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    input: null,
    analysis: null,
    shots: [],
    packs: null,
    mjPrompts: [],
    isGenerating: false,
    error: null,
    isComplete: false,
  });

  const submitInput = async (newInput: ProjectInput) => {
    setState((prev) => ({ ...prev, isGenerating: true, error: null, isComplete: false }));
    
    try {
      // Step 1: Analyze script
      const page1Res = await fetch('/api/page1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: newInput.script }),
      });
      if (!page1Res.ok) throw new Error('Failed to analyze script');
      const analysis = await page1Res.json();

      // Step 2: Generate shots
      const page2Res = await fetch('/api/page2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, input: newInput }),
      });
      if (!page2Res.ok) throw new Error('Failed to generate shots');
      const shotsData = await page2Res.json();
      console.log('Shots API response:', shotsData);
      
      const shots = shotsData.shots || [];

      // Step 3: Generate packs
      const page3Res = await fetch('/api/page3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shots, input: newInput }),
      });
      if (!page3Res.ok) throw new Error('Failed to generate packs');
      const packsData = await page3Res.json();
      console.log('Packs API response:', packsData);
      
      const packs = {
        shots: packsData.shots || shots,
        packs: packsData.packs || []
      };

      // Step 4: Generate MJ prompts
      const page4Res = await fetch('/api/page4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packs, input: newInput }),
      });
      if (!page4Res.ok) throw new Error('Failed to generate MJ prompts');
      const mjData = await page4Res.json();
      console.log('MJ Prompts API response:', mjData);
      
      const mjPrompts = mjData.prompts || [];

      console.log('Final data:', { 
        shotsCount: shots.length, 
        packsCount: packs.packs.length, 
        mjCount: mjPrompts.length 
      });

      setState({
        input: newInput,
        analysis,
        shots,
        packs,
        mjPrompts,
        isGenerating: false,
        error: null,
        isComplete: true,
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err.message || 'Something went wrong',
      }));
    }
  };

  const downloadTxt = () => {
    if (!state.mjPrompts || state.mjPrompts.length === 0) {
      alert('No MJ prompts to download');
      return;
    }
    const content = state.mjPrompts.map((p) => p.prompt).join('\n\n---\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.input?.title || 'project'}_mj_prompts.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadDoc = () => {
    if (!state.mjPrompts || state.mjPrompts.length === 0) {
      alert('No MJ prompts to download');
      return;
    }
    const content = state.mjPrompts.map((p, i) => `Shot ${i + 1}: ${p.shotName}\n\n${p.prompt}\n\n`).join('---\n\n');
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.input?.title || 'project'}_mj_prompts.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCompletePackage = () => {
    if (!state.packs || !state.shots.length) {
      alert('No data to download');
      return;
    }
    
    let content = `PRODUCTION PACKAGE\n`;
    content += `==================\n\n`;
    content += `Title: ${state.input?.title || 'Untitled'}\n`;
    content += `Director: ${state.input?.director || 'TBD'}\n`;
    content += `Cinematographer: ${state.input?.cinematographer || 'TBD'}\n\n`;
    
    content += `SHOTS (${state.shots.length})\n`;
    content += `=====\n\n`;
    state.shots.forEach((shot, i) => {
      content += `${i + 1}. ${shot.name || 'Unnamed Shot'}\n`;
      content += `   Location: ${shot.location || 'N/A'}\n`;
      content += `   Characters: ${shot.characters?.join(', ') || 'N/A'}\n`;
      content += `   Time: ${shot.timeOfDay || 'N/A'}\n`;
      content += `   Description: ${shot.description || 'N/A'}\n\n`;
    });

    if (state.packs.packs && state.packs.packs.length > 0) {
      content += `\nPRODUCTION PACKS (${state.packs.packs.length})\n`;
      content += `================\n\n`;
      state.packs.packs.forEach((pack, i) => {
        content += `Pack ${i + 1}: ${pack.name || 'Unnamed Pack'}\n`;
        content += `Shots: ${pack.shots?.join(', ') || 'N/A'}\n`;
        content += `Location: ${pack.location || 'N/A'}\n`;
        content += `Requirements: ${pack.requirements?.join(', ') || 'N/A'}\n\n`;
      });
    }

    if (state.mjPrompts.length > 0) {
      content += `\nMIDJOURNEY PROMPTS (${state.mjPrompts.length})\n`;
      content += `==================\n\n`;
      state.mjPrompts.forEach((prompt, i) => {
        content += `Shot ${i + 1}: ${prompt.shotName || 'Unnamed'}\n`;
        content += `${prompt.prompt || 'No prompt'}\n\n`;
      });
    }

    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.input?.title || 'project'}_complete_package.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setState({
      input: null,
      analysis: null,
      shots: [],
      packs: null,
      mjPrompts: [],
      isGenerating: false,
      error: null,
      isComplete: false,
    });
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        submitInput,
        downloadTxt,
        downloadDoc,
        downloadCompletePackage,
        reset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
