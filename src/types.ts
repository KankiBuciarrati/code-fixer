export interface Signal {
  func: (t: number[]) => number[];
  formula: string;
}

export interface SignalsDict {
  [key: string]: Signal;
}

export interface AnalysisResult {
  signalName: string;
  energy: number;
  classification: string;
}

export interface PlotPoint {
  t: number;
  value: number;
}

export interface TPSection {
  id: string;
  number: number;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  number: number;
  title: string;
  description: string;
  component: React.ComponentType;
}
