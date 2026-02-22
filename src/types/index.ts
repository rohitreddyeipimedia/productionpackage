export interface ReferenceUpload {
  id: string;
  type: 'image' | 'document';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  comment: string;
  category: 'cast' | 'costume' | 'environment' | 'mood' | 'lighting' | 'other';
  uploadedAt: Date;
}

export interface ProjectInput {
  title: string;
  director: string;
  cinematographer: string;
  duration: number;
  aspectRatio: string;
  script: string;
  references: ReferenceUpload[];
  visualStyleNotes: string;
}

export interface Shot {
  id: string;
  shotNumber: number;
  timestamp: string;
  framing: string;
  lens: string;
  movement: string;
  duration: string;
  description: string;
  lighting: string;
}

export interface Character {
  name: string;
  ageRange: string;
  look: string;
  mjPortraitPrompt: string;
}

export interface CharacterPack {
  character: Character;
  outfit: string;
  materials: string;
  condition: string;
}

export interface EnvironmentPack {
  setting: string;
  timeOfDay: string;
  lightingSetup: string;
  atmosphere: string;
}

export interface MJPrompt {
  shotNumber: number;
  shotDescription: string;
  firstFrame: string;
  environment: {
    country: string;
    city: string;
    exactSetting: string;
    timeOfDay: string;
    weather: string;
    ambientDetails: string;
  };
  subject: {
    primarySubject: string;
    name: string;
    ageRange: string;
    gender: string;
    ethnicity: string;
    skin: string;
    face: string;
    bodyType: string;
  };
  hair: {
    hairStyle: string;
    hairColor: string;
    hairTexture: string;
    hairCondition: string;
    lightingOnHair: string;
  };
  costume: {
    fullOutfitDescription: string;
    colors: string;
    materials: string;
    fit: string;
    condition: string;
    accessories: string;
  };
  action: {
    primaryAction: string;
    bodyLanguage: string;
    microExpressions: string;
    interaction: string;
  };
  mood: {
    emotionalTone: string;
    atmosphere: string;
    narrativeContext: string;
    viewerFeeling: string;
  };
  cinematography: {
    dopInspiredBy: string;
    style: string;
    camera: string;
    focalLength: string;
    aperture: string;
    lightingSetup: string;
    colorGrading: string;
    filmGrain: string;
    aspectRatio: string;
  };
  parameters: string;
  negatives: string;
  fullPrompt: string;
}

export interface ProductionPackage {
  shots: Shot[];
  characters: CharacterPack[];
  environments: EnvironmentPack[];
}
