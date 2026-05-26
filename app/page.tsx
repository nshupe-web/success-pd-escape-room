'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeam } from '@/lib/team-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2, ShieldCheck, Users, Zap } from 'lucide-react';

export default function LoginPage() {
  const [teamCode, setTeamCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useTeam();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamCode.trim()) {
      setError('Please enter a team code');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await login(teamCode.trim());
    
    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      {/* Glowing orb effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Title Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-6 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
            <KeyRound className="w-10 h-10 text-primary" />
          </div>
          <h1 className="font-[var(--font-orbitron)] text-3xl md:text-4xl font-bold text-foreground tracking-wider mb-2">
            SUCCESS PD ESCAPE ROOM
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Enter your team code or create a team to begin
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-[0_0_50px_rgba(0,212,255,0.1)]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Team Login</CardTitle>
            <CardDescription>
              Use the team code given to your group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Enter Team Code (e.g., TEAM1)"
                  value={teamCode}
                  onChange={(e) => {
                    setTeamCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  className="h-12 text-center text-lg font-mono tracking-widest uppercase bg-input border-border focus:border-primary focus:ring-primary/30"
                  disabled={isLoading}
                  autoFocus
                />
                {error && (
                  <p className="text-destructive text-sm text-center animate-in fade-in slide-in-from-top-1">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-5 w-5" />
                    Enter Escape Room
                  </>
                )}
              </Button>
            </form>

            {/* Features */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Team Code</p>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-accent/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">Real-time</p>
                </div>
                <div className="space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Group Play</p>
                </div>
              </div>
            </div>

            {/* Register Link */}
            <div className="mt-6 pt-4 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                {"Don't have a team yet?"}
              </p>
              <Link href="/register">
                <Button variant="outline" className="w-full">
                  Create a New Team
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Admin Link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Game master?{' '}
          <a href="/admin" className="text-primary hover:text-primary/80 underline underline-offset-4">
            Open admin panel
          </a>
        </p>
      </div>
    </main>
  );
}
