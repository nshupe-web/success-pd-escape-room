'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTeam } from '@/lib/team-context';
import { getMission, updateTeamProgress } from '@/lib/firebase-utils';
import type { Mission } from '@/lib/types';
import { DashboardHeader } from '@/components/dashboard/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Rocket,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

export default function MissionPage() {
  const params = useParams();
  const missionId = parseInt(params.id as string);
  const router = useRouter();
  const { session, team, isLoading: teamLoading } = useTeam();
  
  const [mission, setMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!teamLoading && !session) {
      router.push('/');
    }
  }, [teamLoading, session, router]);

  // Load mission data
  useEffect(() => {
    async function loadMission() {
      try {
        const missionData = await getMission(missionId);
        setMission(missionData);
      } catch (error) {
        console.error('Error loading mission:', error);
        toast.error('Failed to load mission');
      } finally {
        setIsLoading(false);
      }
    }

    if (missionId) {
      loadMission();
    }
  }, [missionId]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !mission || !team || !session) return;

    setIsSubmitting(true);
    setFeedback(null);

    // Check answer (case-insensitive)
    const isCorrect = answer.trim().toUpperCase() === mission.correctAnswer.toUpperCase();

    if (isCorrect) {
      setFeedback('correct');
      
      // Update team progress
      const newCompletedMissions = [...team.completedMissions, mission.id];
      const newScore = team.score + 100; // Award points
      const nextMission = mission.nextMissionId || mission.id;

      try {
        await updateTeamProgress(
          session.teamId,
          nextMission,
          newCompletedMissions,
          newScore
        );

        toast.success('Mission Complete!', {
          description: 'You earned 100 points. Proceeding to next mission...',
        });

        // Redirect after a delay
        setTimeout(() => {
          if (mission.nextMissionId) {
            router.push(`/mission/${mission.nextMissionId}`);
          } else {
            router.push('/dashboard');
          }
        }, 2000);
      } catch (error) {
        console.error('Error updating progress:', error);
        toast.error('Failed to save progress');
      }
    } else {
      setFeedback('incorrect');
      toast.error('Incorrect Answer', {
        description: 'Try again! Check your clues carefully.',
      });
    }

    setIsSubmitting(false);
  };

  if (teamLoading || isLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!mission) {
    return (
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl flex items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardContent className="py-12">
              <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-bold mb-2">Mission Not Found</h2>
              <p className="text-muted-foreground mb-6">
                This mission does not exist or has been removed.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const isCompleted = team?.completedMissions.includes(mission.id);

  return (
    <div className="min-h-screen flex flex-col">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mission Control
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Genially Embed Area */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-primary/50 text-primary">
                    Mission {mission.id}
                  </Badge>
                  {isCompleted && (
                    <Badge className="bg-primary/20 text-primary border-0">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <CardTitle className="font-[var(--font-orbitron)] text-xl tracking-wide">
                  {mission.title}
                </CardTitle>
                <CardDescription>{mission.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Genially Iframe */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted border border-border">
                  {mission.geniallyUrl && !mission.geniallyUrl.includes('YOUR_GENIALLY_ID') ? (
                    <iframe
                      src={mission.geniallyUrl}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      title={mission.title}
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <Rocket className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-center px-4">
                        Mission room will appear here once configured.
                        <br />
                        <span className="text-sm">Replace the Genially URL in the admin panel.</span>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Answer Submission Panel */}
          <div className="space-y-6">
            {/* Story Context */}
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Mission Briefing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground italic leading-relaxed">
                  &quot;{mission.storyContext}&quot;
                </p>
              </CardContent>
            </Card>

            {/* Answer Form */}
            <Card className={`border-border/50 bg-card/80 backdrop-blur-sm transition-all ${
              feedback === 'correct' ? 'border-primary shadow-[0_0_20px_rgba(0,212,255,0.3)]' :
              feedback === 'incorrect' ? 'border-destructive' : ''
            }`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Submit Answer
                </CardTitle>
                <CardDescription>
                  Enter the code or answer you discovered in the mission room
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isCompleted ? (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 mx-auto text-primary mb-3" />
                    <p className="font-medium text-foreground">Mission Complete!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You have already completed this mission.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitAnswer} className="space-y-4">
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter your answer..."
                        value={answer}
                        onChange={(e) => {
                          setAnswer(e.target.value.toUpperCase());
                          setFeedback(null);
                        }}
                        className="h-12 text-center text-lg font-mono tracking-widest uppercase"
                        disabled={isSubmitting || feedback === 'correct'}
                      />
                      {feedback === 'incorrect' && (
                        <p className="text-destructive text-sm text-center flex items-center justify-center gap-1">
                          <XCircle className="w-4 h-4" />
                          Incorrect. Try again!
                        </p>
                      )}
                      {feedback === 'correct' && (
                        <p className="text-primary text-sm text-center flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          Correct! +100 points
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                      disabled={isSubmitting || !answer.trim() || feedback === 'correct'}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Submit Answer
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
