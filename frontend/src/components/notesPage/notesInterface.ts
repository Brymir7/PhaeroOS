export interface Note {
  id: number;
  date: string;
  note: string;
  wellbeingScore: number;
  sleepQuality: number;
  tags: string[];
}

export interface NoteWithEmbedding extends Note {
  embedding: number[];
}
export interface NoteWithSimilarity {
  similarity: number;
}

export interface NoteQuery {
  query: string;
  embedding: number[];
}

export interface NoteWithEmbeddingPlot {
  embedding: number[];
  note: string;
  wellbeingScore: number;
}

export interface EmbeddedNote {
  position: number[];
  color: number[];
  size: number;
  note: string;
  connectionLineTo?: number[];
  similarity?: number;
}
