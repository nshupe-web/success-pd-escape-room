export interface Team {
  id: string;
  name: string;
  code: string;
  captainName: string;
  members: string[];
  color: string | null;
  currentMission: number;
  completedMissions: number[];
  score: number;
  createdAt: Date;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  storyContext: string;
  geniallyUrl: string;
  correctAnswer: string;
  answerKey?: string; // Alternative to correctAnswer
  hint?: string;
  points?: number;
  nextMissionId: number | null;
}

export interface Alert {
  id: string;
  teamId: string | null; // null for global alerts
  message: string;
  type: 'info' | 'hint' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

export interface TeamSession {
  teamId: string;
  teamName: string;
  teamCode: string;
}
