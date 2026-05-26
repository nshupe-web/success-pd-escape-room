'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';

interface ProgressTrackerProps {
  currentMission: number;
  completedMissions: number[];
  score: number;
}

export function ProgressTracker({ currentMission, completedMissions, score }: ProgressTrackerProps) {
  const totalMissions = 3; // Adjust based on your total missions
  const progressPercent = (completedMissions.length / totalMissions) * 100;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Mission Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium text-foreground">{completedMissions.length}/{totalMissions}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10 border border-accent/20">
          <span className="text-sm text-muted-foreground">Team Score</span>
          <span className="font-[var(--font-orbitron)] text-xl font-bold text-accent">{score}</span>
        </div>

        {/* Mission List */}
        <div className="space-y-2">
          {Array.from({ length: totalMissions }, (_, i) => i + 1).map((missionNum) => {
            const isCompleted = completedMissions.includes(missionNum);
            const isCurrent = missionNum === currentMission && !isCompleted;

            return (
              <div
                key={missionNum}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-primary/10 border border-primary/30' : ''
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Circle className={`w-5 h-5 shrink-0 ${isCurrent ? 'text-primary' : 'text-muted-foreground/50'}`} />
                )}
                <span className={`text-sm ${
                  isCompleted ? 'text-muted-foreground line-through' : 
                  isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'
                }`}>
                  Mission {missionNum}
                </span>
                {isCurrent && (
                  <span className="ml-auto text-xs text-primary font-medium">IN PROGRESS</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
