'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectInput, ProductionPackage, MJPrompt, Shot } from '@/types';

interface AppState {
  input: ProjectInput | null;
  package: ProductionPackage | null;
  mjPrompts: MJPrompt[];
  isGenerating: boolean;
  error: string | null;
  isComplete: boolean;
  progressMessage: string;
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
    package: null,
    mjPrompts: [],
    isGenerating: false,
    error: null,
    isComplete: false,
    progressMessage: '',
  });

  const submitInput = async (newInput: ProjectInput) => {
    setState((prev) => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      isComplete: false,
      progressMessage: 'Generating shots...'
    }));
    
    try {
      const numShots = Math.round(newInput.duration * 0.75);
      const shotBatchSize = 10; // Generate shots in batches of 10
      
      // Step 1: Generate shots in batches
      const allShots: Shot[] = [];
      const allCharacters: any[] = [];
      const allEnvironments: any[] = [];
      
      for (let i = 0; i < numShots; i += shotBatchSize) {
        const batchNum = Math.floor(i / shotBatchSize) + 1;
        const totalBatches = Math.ceil(numShots / shotBatchSize);
        const shotsToGenerate = Math.min(shotBatchSize, numShots - i);
        
        setState((prev) => ({ 
          ...prev, 
          progressMessage: `Generating shots batch ${batchNum}/${totalBatches}...`
        }));
        
        const shotsResponse = await fetch('/api/generate-shots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            input: newInput,
            numShots: shotsToGenerate,
            startIndex: i,
            totalShots: numShots
          }),
        });
        
        if (!shotsResponse.ok) {
          const errorData = await shotsResponse.json();
          throw new Error(errorData.error || `Failed to generate shots batch ${batchNum}`);
        }
        
        const shotsData = await shotsResponse.json();
        
        // Adjust shot numbers to be sequential
        const batchShots = (shotsData.shots || []).map((s: any, idx: number) => ({
          ...s,
          shotNumber: i + idx + 1
        }));
        
        allShots.push(...batchShots);
        
        // Only take characters and environments from first batch
        if (i === 0) {
          allCharacters.push(...(shotsData.characters || []));
          allEnvironments.push(...(shotsData.environments || []));
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (allShots.length === 0) {
        throw new Error('No shots were generated');
      }

      // Step 2: Generate MJ prompts in batches of 3
      const mjBatchSize = 3;
      const allMjPrompts: MJPrompt[] = [];
      
      for (let i = 0; i < allShots.length; i += mjBatchSize) {
        const batch = allShots.slice(i, i + mjBatchSize);
        const batchNum = Math.floor(i / mjBatchSize) + 1;
        const totalBatches = Math.ceil(allShots.length / mjBatchSize);
        
        setState((prev) => ({ 
          ...prev, 
          progressMessage: `Generating MJ prompts batch ${batchNum}/${totalBatches}...`
        }));
        
        const mjResponse = await fetch('/api/generate-mj-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            shots: batch,
            characters: allCharacters,
            environments: allEnvironments,
            input: newInput,
            startIndex: i
          }),
        });
        
        if (!mjResponse.ok) {
          const errorData = await mjResponse.json();
          throw new Error(errorData.error || `Failed to generate MJ prompts batch ${batchNum}`);
        }
        
        const mjData = await mjResponse.json();
        allMjPrompts.push(...(mjData.mjPrompts || []));
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log('All generated:', { shots: allShots.length, mjPrompts: allMjPrompts.length });

      setState({
        input: newInput,
        package: {
          shots: allShots,
          characters: allCharacters,
          environments: allEnvironments,
        },
        mjPrompts: allMjPrompts,
        isGenerating: false,
        error: null,
        isComplete: true,
        progressMessage: '',
      });
    } catch (err: any) {
      console.error('Generation error:', err);
      setState((prev) => ({
        ...prev,
        isGenerating: false,
        error: err.message || 'Something went wrong',
        progressMessage: '',
      }));
    }
  };

  const generatePackageContent = (): string => {
    if (!state.package || !state.input) return '';
    
    const { input, package: pkg } = state;
    const date = new Date().toLocaleDateString();
    
    let content = `================================================================================
                    COMPLETE PRODUCTION PACKAGE
================================================================================

PROJECT: ${input.title}
DURATION: ${input.duration} seconds
ASPECT RATIO: ${input.aspectRatio}
DATE: ${date}

================================================================================
                              ORIGINAL SCRIPT
================================================================================

${input.script}

================================================================================
                         SHOT BREAKDOWN (${pkg.shots.length} SHOTS)
================================================================================

`;
    
    pkg.shots.forEach((shot) => {
      content += `
SHOT ${shot.shotNumber}
Timestamp: ${shot.timestamp}
Framing: ${shot.framing}
Lens: ${shot.lens}
Movement: ${shot.movement}
Duration: ${shot.duration}
Description: ${shot.description}
Lighting: ${shot.lighting}

`;
    });

    // Character Packs
    if (pkg.characters && pkg.characters.length > 0) {
      content += `================================================================================
                         CHARACTER PACKS
================================================================================

`;
      pkg.characters.forEach((char) => {
        content += `
CHARACTER: ${char.character.name}
Age Range: ${char.character.ageRange}
Look: ${char.character.look}
MJ Portrait Prompt: ${char.character.mjPortraitPrompt}

`;
      });
    }

    // Environment Packs
    if (pkg.environments && pkg.environments.length > 0) {
      content += `================================================================================
                         ENVIRONMENT PACKS
================================================================================

`;
      pkg.environments.forEach((env) => {
        content += `
SETTING: ${env.setting}
Time of Day: ${env.timeOfDay}
Lighting Setup: ${env.lightingSetup}
Atmosphere: ${env.atmosphere}

`;
      });
    }

    // Costume Packs
    if (pkg.characters && pkg.characters.length > 0) {
      content += `================================================================================
                         COSTUME PACKS
================================================================================

`;
      pkg.characters.forEach((char) => {
        content += `
CHARACTER: ${char.character.name}
Outfit: ${char.outfit}
Materials: ${char.materials}
Condition: ${char.condition}

`;
      });
    }

    // MJ Prompts
    if (state.mjPrompts && state.mjPrompts.length > 0) {
      content += `================================================================================
                      MIDJOURNEY PROMPTS (${state.mjPrompts.length} PROMPTS)
================================================================================

`;
      state.mjPrompts.forEach((prompt) => {
        content += `
--------------------------------------------------------------------------------
SHOT ${prompt.shotNumber}: ${prompt.shotDescription}
--------------------------------------------------------------------------------

FIRST FRAME:
${prompt.firstFrame}

ENVIRONMENT:
Country: ${prompt.environment.country}
City: ${prompt.environment.city}
Exact setting: ${prompt.environment.exactSetting}
Time of day: ${prompt.environment.timeOfDay}
Weather: ${prompt.environment.weather}
Ambient details: ${prompt.environment.ambientDetails}

SUBJECT:
Primary subject: ${prompt.subject.primarySubject}
Name: ${prompt.subject.name}
Age range: ${prompt.subject.ageRange}
Gender: ${prompt.subject.gender}
Ethnicity: ${prompt.subject.ethnicity}
Skin: ${prompt.subject.skin}
Face: ${prompt.subject.face}
Body type: ${prompt.subject.bodyType}

HAIR:
Hair style: ${prompt.hair.hairStyle}
Hair color: ${prompt.hair.hairColor}
Hair texture: ${prompt.hair.hairTexture}
Hair condition: ${prompt.hair.hairCondition}
Lighting on hair: ${prompt.hair.lightingOnHair}

COSTUME:
Full outfit description: ${prompt.costume.fullOutfitDescription}
Colors: ${prompt.costume.colors}
Materials: ${prompt.costume.materials}
Fit: ${prompt.costume.fit}
Condition: ${prompt.costume.condition}
Accessories: ${prompt.costume.accessories}

ACTION:
Primary action: ${prompt.action.primaryAction}
Body language: ${prompt.action.bodyLanguage}
Micro-expressions: ${prompt.action.microExpressions}
Interaction: ${prompt.action.interaction}

MOOD:
Emotional tone: ${prompt.mood.emotionalTone}
Atmosphere: ${prompt.mood.atmosphere}
Narrative context: ${prompt.mood.narrativeContext}
Viewer feeling: ${prompt.mood.viewerFeeling}

CINEMATOGRAPHY:
DoP inspired by: ${prompt.cinematography.dopInspiredBy}
Style: ${prompt.cinematography.style}
Camera: ${prompt.cinematography.camera}
Focal length: ${prompt.cinematography.focalLength}
Aperture: ${prompt.cinematography.aperture}
Lighting setup: ${prompt.cinematography.lightingSetup}
Color grading: ${prompt.cinematography.colorGrading}
Film grain: ${prompt.cinematography.filmGrain}
Aspect ratio: ${prompt.cinematography.aspectRatio}
${prompt.fullPrompt}

PARAMETERS: ${prompt.parameters}
NEGATIVES: ${prompt.negatives}


`;
      });
    }

    content += `================================================================================
                              END OF PACKAGE
================================================================================
`;
    
    return content;
  };

  const downloadTxt = () => {
    if (!state.mjPrompts || state.mjPrompts.length === 0) {
      alert('No MJ prompts to download');
      return;
    }
    
    const content = state.mjPrompts.map((p) => p.fullPrompt).join('\n\n================================================================================\n\n');
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
    if (!state.package || state.package.shots.length === 0) {
      alert('No shots to download');
      return;
    }
    
    let content = `SHOT LIST - ${state.input?.title || 'Untitled'}\n`;
    content += `Duration: ${state.input?.duration}s | Aspect Ratio: ${state.input?.aspectRatio}\n\n`;
    
    state.package.shots.forEach((shot) => {
      content += `SHOT ${shot.shotNumber}\n`;
      content += `Timestamp: ${shot.timestamp} | Duration: ${shot.duration}\n`;
      content += `Framing: ${shot.framing} | Lens: ${shot.lens} | Movement: ${shot.movement}\n`;
      content += `Description: ${shot.description}\n`;
      content += `Lighting: ${shot.lighting}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.input?.title || 'project'}_shot_list.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCompletePackage = () => {
    const content = generatePackageContent();
    if (!content) {
      alert('No data to download');
      return;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.input?.title || 'project'}_complete_package.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setState({
      input: null,
      package: null,
      mjPrompts: [],
      isGenerating: false,
      error: null,
      isComplete: false,
      progressMessage: '',
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
  if (!context) throw new Error('useApp must be used within App
