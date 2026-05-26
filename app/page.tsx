'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeam } from '@/lib/team-context';
import { getTeamByCode, getMission, updateTeamProgress } from '@/lib/firebase-utils';
import type { Team, Mission } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Trophy, 
  Users, 
  Target, 
  Shield, 
  Lightbulb,
  Send,
  LogOut,
  Sparkles,
  Star,
  ChevronRight,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Crown,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading, logout } = useTeam();
  const [team, setTeam] = useState<Team | null>(null);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isVictory, setIsVictory] = useState(false);

  // Load the active team's latest data from Firebase.
  const loadTeamData = useCallback(async () => {
    if (isSessionLoading) return;

    if (!session?.teamCode) {
      router.push('/');
      return;
    }

    try {
      const teamData = await getTeamByCode(session.teamCode);
      
      if (!teamData) {
        logout();
        router.push('/');
        return;
      }

      setTeam(teamData);

      // Fetch current mission
      const mission = await getMission(teamData.currentMission);
      
      if (!mission) {
        // No more missions - victory!
        setIsVictory(true);
      } else {
        setCurrentMission(mission);
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSessionLoading, logout, router, session?.teamCode]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Handle answer submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team || !currentMission || !answer.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const normalizedAnswer = answer.trim().toUpperCase();
    const correctAnswer = (currentMission.answerKey || currentMission.correctAnswer).trim().toUpperCase();

    if (normalizedAnswer === correctAnswer) {
      // Correct answer!
      setFeedback({ type: 'success', message: 'ACCESS GRANTED' });
      
      const newScore = team.score + (currentMission.points || 100);
      const newCompletedMissions = [...team.completedMissions, currentMission.id];
      const nextMissionId = currentMission.nextMissionId || (currentMission.id + 1);

      try {
        await updateTeamProgress(
          team.id,
          nextMissionId,
          newCompletedMissions,
          newScore
        );

        // Wait for animation then reload
        setTimeout(() => {
          setAnswer('');
          setShowHint(false);
          setFeedback(null);
          loadTeamData();
        }, 2000);
      } catch (error) {
        console.error('Error updating progress:', error);
        setFeedback({ type: 'error', message: 'Error saving progress. Please try again.' });
      }
    } else {
      // Wrong answer
      setFeedback({ type: 'error', message: 'ACCESS DENIED' });
      setTimeout(() => setFeedback(null), 3000);
    }

    setIsSubmitting(false);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto" />
          <p className="text-cyan-400 font-medium animate-pulse">INITIALIZING MISSION CONTROL...</p>
        </div>
      </div>
    );
  }

  // Victory screen
  if (isVictory && team) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-lg">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-500/30 via-green-500/30 to-cyan-500/30 animate-pulse" />
            <div className="relative">
              <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-bounce" />
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 font-[var(--font-orbitron)]">
                VICTORY!
              </h1>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-xl text-gray-300">
              Congratulations, <span style={{ color: team.color || '#00d4ff' }}>{team.name}</span>!
            </p>
            <p className="text-gray-400">
              You have completed all missions and saved humanity.
            </p>
          </div>

          <Card className="bg-gray-900/50 border-cyan-500/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-3xl font-bold text-white font-[var(--font-orbitron)]">
                  {team.score} PTS
                </span>
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-sm text-gray-400">
                Missions Completed: {team.completedMissions.length}
              </p>
            </CardContent>
          </Card>

          <Button 
            onClick={handleLogout}
            className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-semibold"
          >
            Return to Base
          </Button>
        </div>
      </div>
    );
  }

  if (!team || !currentMission) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-400">Error loading mission data</p>
          <Button onClick={() => router.push('/')} variant="outline">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Feedback Overlay */}
      {feedback && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
          feedback.type === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
        }`}>
          <div className={`p-8 rounded-xl border-2 ${
            feedback.type === 'success' 
              ? 'bg-green-500/20 border-green-500 text-green-400' 
              : 'bg-red-500/20 border-red-500 text-red-400'
          } animate-pulse`}>
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
              <span className="text-2xl font-bold font-[var(--font-orbitron)]">
                {feedback.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-[var(--font-orbitron)] text-sm font-bold text-cyan-400">
                MISSION CONTROL
              </h1>
              <p className="text-xs text-gray-500">Success PD Escape Room</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-400">
              Admin
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left Sidebar - Team Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Team Card */}
            <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
              <div 
                className="h-2" 
                style={{ backgroundColor: team.color || '#00d4ff' }} 
              />
              <CardHeader className="pb-2">
                <CardTitle 
                  className="text-xl font-[var(--font-orbitron)]"
                  style={{ color: team.color || '#00d4ff' }}
                >
                  {team.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Captain */}
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-300">{team.captainName}</span>
                </div>

                {/* Team Members */}
                {team.members && team.members.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Users className="w-3 h-3" />
                      <span>TEAM ROSTER</span>
                    </div>
                    <div className="space-y-1">
                      {team.members.map((member, idx) => (
                        <div 
                          key={idx}
                          className="text-sm text-gray-400 pl-5"
                        >
                          {member}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Score Card */}
            <Card className="bg-gray-900/80 border-gray-800">
              <CardContent className="p-4 space-y-4">
                {/* Score */}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
                  </div>
                  <div className="text-3xl font-bold text-cyan-400 font-[var(--font-orbitron)]">
                    {team.score} <span className="text-sm">PTS</span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  {/* Current Level */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Target className="w-5 h-5 text-cyan-400" />
                      <span className="text-xs text-gray-500 uppercase tracking-wider">Current Level</span>
                    </div>
                    <div className="text-xl font-bold text-white font-[var(--font-orbitron)]">
                      Mission {team.currentMission}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="border-t border-gray-800 pt-4">
                  <div className="text-xs text-gray-500 mb-2 text-center">Missions Completed</div>
                  <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                          team.completedMissions.includes(n)
                            ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                            : n === team.currentMission
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 animate-pulse'
                            : 'bg-gray-800 text-gray-600 border border-gray-700'
                        }`}
                      >
                        {team.completedMissions.includes(n) ? (
                          <Unlock className="w-3 h-3" />
                        ) : n === team.currentMission ? (
                          n
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Mission Briefing */}
          <div className="lg:col-span-3 space-y-6">
            {/* Mission Header */}
            <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gray-900/50 p-6">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <div className="relative">
                <Badge className="mb-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Active Mission
                </Badge>
                <h2 className="font-[var(--font-orbitron)] text-2xl md:text-3xl font-bold text-white mb-2">
                  {currentMission.title}
                </h2>
                {currentMission.points && (
                  <p className="text-sm text-gray-400">
                    Reward: <span className="text-yellow-400 font-semibold">{currentMission.points} PTS</span>
                  </p>
                )}
              </div>
            </div>

            {/* Mission Description */}
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-300">
                  <Target className="w-5 h-5 text-cyan-400" />
                  Mission Briefing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Story Context */}
                {currentMission.storyContext && (
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <p className="text-gray-300 italic whitespace-pre-line">
                      {currentMission.storyContext}
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Objectives
                  </h4>
                  <p className="text-gray-200 whitespace-pre-line">
                    {currentMission.description}
                  </p>
                </div>

                {/* Hint Section */}
                {currentMission.hint && (
                  <div className="border-t border-gray-800 pt-4">
                    {!showHint ? (
                      <Button
                        variant="ghost"
                        onClick={() => setShowHint(true)}
                        className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Need a hint?
                      </Button>
                    ) : (
                      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-500 mb-1">Hint</p>
                            <p className="text-gray-300">{currentMission.hint}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Answer Submission */}
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-300">
                  <Send className="w-5 h-5 text-cyan-400" />
                  Submit Answer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <Input
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Enter your answer code..."
                      className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 font-mono text-lg"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="submit"
                      disabled={!answer.trim() || isSubmitting}
                      className="bg-cyan-500 hover:bg-cyan-600 text-gray-900 font-semibold px-6"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ChevronRight className="w-5 h-5" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter the code you discovered to unlock the next mission
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
