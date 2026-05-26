'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeam } from '@/lib/team-context';
import { registerTeam, getTeamByCode } from '@/lib/firebase-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Loader2, 
  Rocket, 
  Users, 
  UserPlus, 
  X, 
  Copy, 
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';

const TEAM_COLORS = [
  { name: 'Cyan', value: '#00d4ff' },
  { name: 'Amber', value: '#ffb800' },
  { name: 'Emerald', value: '#00ff88' },
  { name: 'Rose', value: '#ff4d6d' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#ff6b35' },
];

export default function RegisterPage() {
  const [teamName, setTeamName] = useState('');
  const [captainName, setCaptainName] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  
  const { login } = useTeam();
  const router = useRouter();

  const addMember = () => {
    if (members.length < 8) {
      setMembers([...members, '']);
    }
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index: number, value: string) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    
    if (!captainName.trim()) {
      toast.error('Please enter the captain name');
      return;
    }

    setIsLoading(true);

    try {
      const filteredMembers = members.filter(m => m.trim() !== '');
      
      const { teamCode } = await registerTeam(
        teamName.trim(),
        captainName.trim(),
        filteredMembers,
        selectedColor
      );

      setGeneratedCode(teamCode);
      setRegistrationComplete(true);
      toast.success('Team registered successfully!');
    } catch (error) {
      console.error('[v0] Registration error:', error);
      toast.error('Failed to register team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      toast.success('Team code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const proceedToDashboard = async () => {
    setIsLoading(true);
    const result = await login(generatedCode);
    if (result.success) {
      router.push('/dashboard');
    } else {
      toast.error('Could not access dashboard. Please try logging in with your team code.');
      router.push('/');
    }
  };

  if (registrationComplete) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        
        {/* Glowing orb effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-[0_0_50px_rgba(0,212,255,0.1)]">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Registration Complete!</CardTitle>
              <CardDescription>
                Your team is ready for the mission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Your Team Code</p>
                <div className="relative">
                  <div 
                    className="text-4xl font-mono font-bold tracking-[0.3em] py-4 px-6 rounded-lg bg-primary/10 border border-primary/30 text-primary shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                    style={selectedColor ? { color: selectedColor, borderColor: `${selectedColor}40`, boxShadow: `0 0 20px ${selectedColor}30` } : {}}
                  >
                    {generatedCode}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={copyCode}
                  >
                    {copied ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Share this code with your team members
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Team: {teamName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3" /> Captain: {captainName}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={proceedToDashboard}
                  className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Go to Team Dashboard
                    </>
                  )}
                </Button>
                
                <Link href="/" className="block">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      {/* Glowing orb effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-[var(--font-orbitron)] text-2xl md:text-3xl font-bold text-foreground tracking-wider mb-1">
            CREATE YOUR TEAM
          </h1>
          <p className="text-muted-foreground text-sm">
            Register your squad for the mission
          </p>
        </div>

        {/* Registration Form */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-[0_0_50px_rgba(0,212,255,0.1)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Team Details
            </CardTitle>
            <CardDescription>
              Fill in your team information to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Team Name */}
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-sm font-medium">
                  Team Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="e.g., The Code Breakers"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="h-11 bg-input border-border focus:border-primary"
                  disabled={isLoading}
                />
              </div>

              {/* Captain Name */}
              <div className="space-y-2">
                <Label htmlFor="captainName" className="text-sm font-medium flex items-center gap-2">
                  <Crown className="w-4 h-4 text-accent" />
                  Captain Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="captainName"
                  type="text"
                  placeholder="Team leader name"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  className="h-11 bg-input border-border focus:border-primary"
                  disabled={isLoading}
                />
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Team Members
                  </span>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </Label>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={`Member ${index + 1} name`}
                        value={member}
                        onChange={(e) => updateMember(index, e.target.value)}
                        className="h-10 bg-input border-border focus:border-primary"
                        disabled={isLoading}
                      />
                      {members.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => removeMember(index)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {members.length < 8 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={addMember}
                    disabled={isLoading}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Team Member
                  </Button>
                )}
              </div>

              {/* Team Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center justify-between">
                  <span>Team Color</span>
                  <span className="text-xs text-muted-foreground">Optional</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(selectedColor === color.value ? null : color.value)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-foreground scale-110 shadow-lg'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ 
                        backgroundColor: color.value,
                        boxShadow: selectedColor === color.value ? `0 0 20px ${color.value}60` : undefined
                      }}
                      title={color.name}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Register Team
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already have a team code?{' '}
          <Link href="/" className="text-primary hover:text-primary/80 underline underline-offset-4">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
