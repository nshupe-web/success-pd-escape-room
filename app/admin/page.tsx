'use client';

import { useEffect, useState } from 'react';
import { 
  subscribeToAllTeams, 
  getAllMissions, 
  updateTeamProgress,
  sendAlert,
  initializeSampleData,
  createTeam,
  createMission,
  updateMission,
  deleteMission,
} from '@/lib/firebase-utils';
import type { Team, Mission, Alert } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Users, 
  Rocket, 
  Bell, 
  RefreshCw, 
  Send,
  Plus,
  Settings,
  Trophy,
  ArrowLeft,
  Pencil,
  Trash2,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AdminPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [connectionError, setConnectionError] = useState(false);

  // Alert form state
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<Alert['type']>('info');
  const [alertTarget, setAlertTarget] = useState<string>('all');
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  // New team form state
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamCode, setNewTeamCode] = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);

  // Mission form state
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [showMissionDialog, setShowMissionDialog] = useState(false);
  const [missionForm, setMissionForm] = useState({
    id: 0,
    title: '',
    description: '',
    storyContext: '',
    geniallyUrl: '',
    correctAnswer: '',
    nextMissionId: null as number | null,
  });

  // Load data
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    // Set a timeout to stop loading after 5 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setConnectionError(true);
      }
    }, 5000);

    try {
      unsubscribe = subscribeToAllTeams((updatedTeams) => {
        clearTimeout(timeout);
        setTeams(updatedTeams);
        setIsLoading(false);
        setConnectionError(false);
      });
    } catch (error) {
      console.error('[v0] Firebase connection error:', error);
      setIsLoading(false);
      setConnectionError(true);
    }

    loadMissions();

    return () => {
      clearTimeout(timeout);
      if (unsubscribe) unsubscribe();
    };
  }, []);

  async function loadMissions() {
    const missionList = await getAllMissions();
    setMissions(missionList.sort((a, b) => a.id - b.id));
  }

  const handleInitializeData = async () => {
    setIsInitializing(true);
    try {
      await initializeSampleData();
      await loadMissions();
      toast.success('Sample data initialized!');
    } catch (error) {
      console.error('Error initializing data:', error);
      toast.error('Failed to initialize data');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendAlert = async () => {
    if (!alertMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSendingAlert(true);
    try {
      await sendAlert({
        teamId: alertTarget === 'all' ? null : alertTarget,
        message: alertMessage,
        type: alertType,
        timestamp: new Date(),
        read: false,
      });
      toast.success('Alert sent successfully!');
      setAlertMessage('');
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send alert');
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleResetTeam = async (team: Team) => {
    try {
      await updateTeamProgress(team.id, 1, [], 0);
      toast.success(`${team.name} has been reset`);
    } catch (error) {
      console.error('Error resetting team:', error);
      toast.error('Failed to reset team');
    }
  };

  const handleUnlockMission = async (team: Team, missionId: number) => {
    try {
      await updateTeamProgress(team.id, missionId, team.completedMissions, team.score);
      toast.success(`Mission ${missionId} unlocked for ${team.name}`);
    } catch (error) {
      console.error('Error unlocking mission:', error);
      toast.error('Failed to unlock mission');
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !newTeamCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreatingTeam(true);
    try {
      await createTeam({
        name: newTeamName,
        code: newTeamCode.toUpperCase(),
        currentMission: 1,
        completedMissions: [],
        score: 0,
        createdAt: new Date(),
      });
      toast.success('Team created successfully!');
      setNewTeamName('');
      setNewTeamCode('');
      setShowNewTeamDialog(false);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleSaveMission = async () => {
    if (!missionForm.title || !missionForm.correctAnswer) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const mission: Mission = {
        id: missionForm.id,
        title: missionForm.title,
        description: missionForm.description,
        storyContext: missionForm.storyContext,
        geniallyUrl: missionForm.geniallyUrl,
        correctAnswer: missionForm.correctAnswer.toUpperCase(),
        nextMissionId: missionForm.nextMissionId,
      };

      if (editingMission) {
        await updateMission(mission);
        toast.success('Mission updated!');
      } else {
        await createMission(mission);
        toast.success('Mission created!');
      }

      await loadMissions();
      setShowMissionDialog(false);
      setEditingMission(null);
      resetMissionForm();
    } catch (error) {
      console.error('Error saving mission:', error);
      toast.error('Failed to save mission');
    }
  };

  const handleDeleteMission = async (missionId: number) => {
    if (!confirm('Are you sure you want to delete this mission?')) return;

    try {
      await deleteMission(missionId);
      await loadMissions();
      toast.success('Mission deleted');
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast.error('Failed to delete mission');
    }
  };

  const openEditMission = (mission: Mission) => {
    setEditingMission(mission);
    setMissionForm({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      storyContext: mission.storyContext,
      geniallyUrl: mission.geniallyUrl,
      correctAnswer: mission.correctAnswer,
      nextMissionId: mission.nextMissionId,
    });
    setShowMissionDialog(true);
  };

  const openNewMission = () => {
    setEditingMission(null);
    resetMissionForm();
    setMissionForm(prev => ({
      ...prev,
      id: missions.length > 0 ? Math.max(...missions.map(m => m.id)) + 1 : 1,
    }));
    setShowMissionDialog(true);
  };

  const resetMissionForm = () => {
    setMissionForm({
      id: 0,
      title: '',
      description: '',
      storyContext: '',
      geniallyUrl: '',
      correctAnswer: '',
      nextMissionId: null,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Database className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold text-center">Firebase Connection Issue</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Could not connect to Firebase. Please check that your Firebase environment variables are correctly configured.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center">
                <Settings className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-[var(--font-orbitron)] text-sm font-bold tracking-wider text-foreground">
                  ADMIN PANEL
                </p>
                <p className="text-xs text-muted-foreground">Game Master Controls</p>
              </div>
            </div>
          </div>

          <Button
            onClick={handleInitializeData}
            disabled={isInitializing}
            variant="outline"
            size="sm"
          >
            {isInitializing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Initialize Sample Data
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-6xl">
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="teams" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="missions" className="gap-2">
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Missions</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Team Management</h2>
              <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                      Add a new team to the escape room experience.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Team Name</Label>
                      <Input
                        placeholder="e.g., Team Delta"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Team Code</Label>
                      <Input
                        placeholder="e.g., TEAM4"
                        value={newTeamCode}
                        onChange={(e) => setNewTeamCode(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewTeamDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTeam} disabled={isCreatingTeam}>
                      {isCreatingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {teams.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No teams yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click &quot;Initialize Sample Data&quot; to create sample teams
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {teams.map((team) => (
                  <Card key={team.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                          <CardDescription className="font-mono">{team.code}</CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <Trophy className="w-3 h-3" />
                          {team.score} pts
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Mission</span>
                        <Badge>Mission {team.currentMission}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed</span>
                        <span>{(team.completedMissions || []).length} missions</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Select
                          onValueChange={(value) => handleUnlockMission(team, parseInt(value))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Unlock mission..." />
                          </SelectTrigger>
                          <SelectContent>
                            {missions.map((m) => (
                              <SelectItem key={m.id} value={m.id.toString()}>
                                Mission {m.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleResetTeam(team)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mission Configuration</h2>
              <Button onClick={openNewMission}>
                <Plus className="mr-2 h-4 w-4" />
                Add Mission
              </Button>
            </div>

            <Dialog open={showMissionDialog} onOpenChange={setShowMissionDialog}>
              <DialogContent className="max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>
                    {editingMission ? 'Edit Mission' : 'Create Mission'}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mission ID</Label>
                        <Input
                          type="number"
                          value={missionForm.id}
                          onChange={(e) => setMissionForm({ ...missionForm, id: parseInt(e.target.value) })}
                          disabled={!!editingMission}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Next Mission ID</Label>
                        <Input
                          type="number"
                          placeholder="null for final mission"
                          value={missionForm.nextMissionId || ''}
                          onChange={(e) => setMissionForm({ 
                            ...missionForm, 
                            nextMissionId: e.target.value ? parseInt(e.target.value) : null 
                          })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Title *</Label>
                      <Input
                        placeholder="Mission Alpha: The Awakening"
                        value={missionForm.title}
                        onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Brief description of the mission..."
                        value={missionForm.description}
                        onChange={(e) => setMissionForm({ ...missionForm, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Story Context</Label>
                      <Textarea
                        placeholder="The narrative/story setting for this mission..."
                        value={missionForm.storyContext}
                        onChange={(e) => setMissionForm({ ...missionForm, storyContext: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Genially URL</Label>
                      <Input
                        placeholder="https://view.genially.com/..."
                        value={missionForm.geniallyUrl}
                        onChange={(e) => setMissionForm({ ...missionForm, geniallyUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Correct Answer *</Label>
                      <Input
                        placeholder="ALPHA123"
                        value={missionForm.correctAnswer}
                        onChange={(e) => setMissionForm({ ...missionForm, correctAnswer: e.target.value.toUpperCase() })}
                        className="font-mono uppercase"
                      />
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMissionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveMission}>
                    {editingMission ? 'Update' : 'Create'} Mission
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {missions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Rocket className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No missions configured</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click &quot;Initialize Sample Data&quot; to create sample missions
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <Card key={mission.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">Mission {mission.id}</Badge>
                            {mission.nextMissionId ? (
                              <span className="text-xs text-muted-foreground">
                                Next: Mission {mission.nextMissionId}
                              </span>
                            ) : (
                              <Badge variant="secondary">Final</Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{mission.title}</CardTitle>
                          <CardDescription className="mt-1">{mission.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditMission(mission)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteMission(mission.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Answer</span>
                          <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                            {mission.correctAnswer}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Genially URL</span>
                          <span className="text-xs truncate max-w-[200px]">
                            {mission.geniallyUrl || 'Not set'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <h2 className="text-xl font-semibold">Broadcast Alerts</h2>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Send Alert</CardTitle>
                <CardDescription>
                  Send real-time messages to teams during the game
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Select value={alertTarget} onValueChange={setAlertTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Teams</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Type</Label>
                    <Select value={alertType} onValueChange={(v) => setAlertType(v as Alert['type'])}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="hint">Hint</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleSendAlert}
                  disabled={isSendingAlert || !alertMessage.trim()}
                  className="w-full sm:w-auto"
                >
                  {isSendingAlert ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Send Alert
                </Button>
              </CardContent>
            </Card>

            {/* Quick Alerts */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Quick Alerts</CardTitle>
                <CardDescription>
                  Pre-defined messages for common scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { msg: 'A new hint has been revealed! Check your mission briefing.', type: 'hint' as const },
                    { msg: 'Time is running out! Only 10 minutes remaining.', type: 'warning' as const },
                    { msg: 'Great progress! Keep up the good work, agents.', type: 'success' as const },
                    { msg: 'The game master has an important announcement.', type: 'info' as const },
                  ].map((quick, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start h-auto py-3 text-left"
                      onClick={async () => {
                        await sendAlert({
                          teamId: alertTarget === 'all' ? null : alertTarget,
                          message: quick.msg,
                          type: quick.type,
                          timestamp: new Date(),
                          read: false,
                        });
                        toast.success('Alert sent!');
                      }}
                    >
                      <span className="text-sm">{quick.msg}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
