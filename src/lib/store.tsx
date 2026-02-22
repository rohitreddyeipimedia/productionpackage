'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProjectInput, ProductionPackage, MJPrompt, Shot, ReferenceUpload, ReferenceMetadata } from '@/types';

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
  submitInput: (formData: Omit<ProjectInput, 'references'>, references: ReferenceUpload[]) => Promise<void>;
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

  const createMetadata = (references: ReferenceUpload[]): ReferenceMetadata[] => {
    return references.map(ref => ({
      id: ref.id,
      type: ref.type,
      fileName: ref.fileName,
      fileSize: ref.fileSize,
      comment: ref.comment,
      category: ref.category,
    }));
  };

  const submitInput = async (formData: Omit<ProjectInput, 'references'>, references: ReferenceUpload[]) => {
    const lightweightInput: ProjectInput = {
      ...formData,
      references: createMetadata(references),
    };

    setState((prev) => ({
      ...prev,
      isGenerating: true,
      error: null,
      isComplete: false,
      progressMessage: 'Initializing...',
    }));

    try {
      const numShots = Math.round(formData.duration * 0.75);
      const shotBatchSize = 10;

      const allShots: Shot[] = [];
      const allCharacters: any[] = [];
      const allEnvironments: any[] = [];

      for (let i = 0; i < numShots; i += shotBatchSize) {
        const batchNum = Math.floor(i / shotBatchSize) + 1;
        const totalBatches = Math.ceil(numShots / shotBatchSize);
        const shotsToGenerate = Math.min(shotBatchSize, numShots - i);

        setState((prev) => ({
          ...prev,
          progressMessage: `Generating shots batch ${batchNum}/${totalBatches}...`,
        }));

        const shotsResponse = await fetch('/api/generate-shots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: lightweightInput,
            numShots: shotsToGenerate,
            startIndex: i,
            totalShots: numShots,
          }),
        });

        if (!shotsResponse.ok) {
          const errorData = await shotsResponse.json();
          throw new Error(errorData.error || `Failed to generate shots batch ${batchNum}`);
        }

        const shotsData = await shotsResponse.json();

        const batchShots = (shotsData.shots || []).map((s: any, idx: number) => ({
          ...s,
          shotNumber: i + idx + 1,
        }));

        allShots.push(...batchShots);

        if (i === 0) {
          allCharacters.push(...(shotsData.characters || []));
          allEnvironments.push(...(shotsData.environments || []));
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      if (allShots.length === 0) {
        throw new Error('No shots were generated');
      }

      const mjBatchSize = 3;
      const allMjPrompts: MJPrompt[] = [];

      for (let i = 0; i < allShots.length; i += mjBatchSize) {
        const batch = allShots.slice(i, i + mjBatchSize);
        const batchNum = Math.floor(i / mjBatchSize) + 1;
        const totalBatches = Math.ceil(allShots.length / mjBatchSize);

        setState((prev) => ({
          ...prev,
          progressMessage: `Generating MJ prompts batch ${batchNum}/${totalBatches}...`,
        }));

        const mjResponse = await fetch('/api/generate-mj-prompts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shots: batch,
            characters: allCharacters,
            environments: allEnvironments,
            input: lightweightInput,
            startIndex: i,
          }),
        });

        if (!mjResponse.ok) {
          const errorData = await mjResponse.json();
          throw new Error(errorData.error || `Failed to generate MJ prompts batch ${batchNum}`);
        }

        const mjData = await mjResponse.json();
        allMjPrompts.push(...(mjData.mjPrompts || []));

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setState({
        input: lightweightInput,
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
DIRECTOR: ${input.director || 'N/A'}
CINEMATOGRAPHER: ${input.cinematographer || 'N/A'}
DURATION: ${input.duration} seconds
ASPECT RATIO: ${input.aspectRatio}
DATE: ${date}

================================================================================
 VISUAL REFERENCES (${input.references?.length || 0} files)
================================================================================

${input.visualStyleNotes ? `Visual Direction: ${input.visualStyleNotes}\n` : ''}
${input.references?.map((ref, idx) => `
Reference ${idx + 1}: ${ref.fileName}
Category: ${ref.category}
Context: ${ref.comment}
`).join('\n') || 'No visual references uploaded'}

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
Full outfit
