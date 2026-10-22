export enum AppStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GeneratedContent {
  analysis: string;
  examContent: string;
  detailedSolution: string;
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
  extractedText?: string;
}

export type DiagramMode = 'standard' | 'detailed';
export type SolutionMode = 'concise' | 'detailed' | 'very_detailed';
export type SubjectMode = 'auto' | 'math' | 'physics' | 'chemistry';
export type GradeLevel = 'auto' | '10' | '11' | '12' | 'thpt_qg';
export type ContextVariationMode = 'creative' | 'moderate' | 'numbers_only';

export interface GenerationOptions {
  diagramMode: DiagramMode;
  solutionMode: SolutionMode;
  subjectMode?: SubjectMode;
  gradeLevel?: GradeLevel;
  contextVariation?: ContextVariationMode;
  customInstructions?: string;
}

// Phục vụ docxMathParser.ts
export interface QuestionConfig {
  type1: { biet: number; hieu: number; van_dung: number; van_dung_cao: number };
  type2: { biet: number; hieu: number; van_dung: number; van_dung_cao: number };
  type3: { biet: number; hieu: number; van_dung: number; van_dung_cao: number };
  essay: { biet: number; hieu: number; van_dung: number; van_dung_cao: number };
}

export interface ExtractedQuestion {
  id: string;
  type: 'type1' | 'type2' | 'type3' | 'essay';
  level: 'biet' | 'hieu' | 'van_dung' | 'van_dung_cao';
  topic: string;
  content: string;
  options?: string[];
  answer?: string;
  subItems?: string[];
}
