export interface ProjectInput {
  title: string;
  director: string;
  cinematographer: string;
  script: string;
}

export interface Shot {
  id: string;
  sceneNumber: number;
  shotNumber: number;
  name: string;
  description: string;
  location: string;
  characters: string[];
  timeOfDay: string;
}

export interface ProductionPack {
  id: string;
  name: string;
  shots: string[];
  location: string;
  requirements: string[];
}

export interface Packs {
  shots: Shot[];
  packs: ProductionPack[];
}

export interface MJPrompt {
  shotId: string;
  shotName: string;
  prompt: string;
}
