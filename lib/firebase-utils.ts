import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { db } from './firebase';
import type { Team, Mission, Alert } from './types';

function normalizeNumber(value: unknown, fallback: number): number {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function mapTeamDocument(docData: { id: string; data: () => DocumentData }): Team {
  const data = docData.data();

  return {
    id: docData.id,
    name: typeof data.name === 'string' ? data.name : 'Unnamed Team',
    code: typeof data.code === 'string' ? data.code : '',
    captainName: typeof data.captainName === 'string' ? data.captainName : '',
    members: Array.isArray(data.members) ? data.members : [],
    color: typeof data.color === 'string' ? data.color : null,
    currentMission: normalizeNumber(data.currentMission, 1),
    completedMissions: Array.isArray(data.completedMissions)
      ? data.completedMissions.map((missionId) => normalizeNumber(missionId, 0)).filter(Boolean)
      : [],
    score: normalizeNumber(data.score, 0),
    createdAt: data.createdAt?.toDate?.() || new Date(),
  };
}

// Teams
export async function getTeamByCode(code: string): Promise<Team | null> {
  const teamsRef = collection(db, 'teams');
  const q = query(teamsRef, where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return mapTeamDocument(snapshot.docs[0]);
}

export async function getAllTeams(): Promise<Team[]> {
  const teamsRef = collection(db, 'teams');
  const snapshot = await getDocs(teamsRef);
  
  return snapshot.docs.map(mapTeamDocument);
}

export async function createTeam(team: Omit<Team, 'id'>): Promise<string> {
  const teamsRef = collection(db, 'teams');
  const docRef = await addDoc(teamsRef, {
    ...team,
    createdAt: Timestamp.fromDate(team.createdAt),
  });
  return docRef.id;
}

// Generate a unique team code
export function generateTeamCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Check if team code exists
export async function isTeamCodeUnique(code: string): Promise<boolean> {
  const existing = await getTeamByCode(code);
  return existing === null;
}

// Register a new team with unique code
export async function registerTeam(
  name: string,
  captainName: string,
  members: string[],
  color: string | null
): Promise<{ teamId: string; teamCode: string }> {
  // Generate unique code
  let code = generateTeamCode();
  let attempts = 0;
  while (!(await isTeamCodeUnique(code)) && attempts < 10) {
    code = generateTeamCode();
    attempts++;
  }

  const teamId = await createTeam({
    name,
    code,
    captainName,
    members,
    color,
    currentMission: 1,
    completedMissions: [],
    score: 0,
    createdAt: new Date(),
  });

  return { teamId, teamCode: code };
}

export async function updateTeamProgress(
  teamId: string,
  currentMission: number,
  completedMissions: number[],
  score: number
): Promise<void> {
  const teamRef = doc(db, 'teams', teamId);
  await updateDoc(teamRef, {
    currentMission: normalizeNumber(currentMission, 1),
    completedMissions: completedMissions.map((missionId) => normalizeNumber(missionId, 0)).filter(Boolean),
    score: normalizeNumber(score, 0),
  });
}

export function subscribeToTeam(teamId: string, callback: (team: Team | null) => void) {
  const teamRef = doc(db, 'teams', teamId);
  return onSnapshot(teamRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }
    callback(mapTeamDocument(snapshot));
  });
}

export function subscribeToAllTeams(callback: (teams: Team[]) => void) {
  const teamsRef = collection(db, 'teams');
  return onSnapshot(teamsRef, (snapshot) => {
    const teams = snapshot.docs.map(mapTeamDocument);
    callback(teams);
  }, (error) => {
    console.error('[v0] Firebase subscription error:', error);
    // Still call callback with empty array on error so loading stops
    callback([]);
  });
}

// Missions
export async function getMission(missionId: number): Promise<Mission | null> {
  const missionRef = doc(db, 'missions', missionId.toString());
  const snapshot = await getDoc(missionRef);
  
  if (!snapshot.exists()) return null;
  
  return {
    id: missionId,
    ...snapshot.data(),
  } as Mission;
}

export async function getAllMissions(): Promise<Mission[]> {
  const missionsRef = collection(db, 'missions');
  const snapshot = await getDocs(missionsRef);
  
  return snapshot.docs.map(docData => ({
    id: parseInt(docData.id),
    ...docData.data(),
  })) as Mission[];
}

export async function createMission(mission: Mission): Promise<void> {
  const missionRef = doc(db, 'missions', mission.id.toString());
  await setDoc(missionRef, mission);
}

export async function updateMission(mission: Mission): Promise<void> {
  const missionRef = doc(db, 'missions', mission.id.toString());
  await updateDoc(missionRef, { ...mission });
}

export async function deleteMission(missionId: number): Promise<void> {
  const missionRef = doc(db, 'missions', missionId.toString());
  await deleteDoc(missionRef);
}

// Alerts
export async function sendAlert(alert: Omit<Alert, 'id'>): Promise<string> {
  const alertsRef = collection(db, 'alerts');
  const docRef = await addDoc(alertsRef, {
    ...alert,
    timestamp: Timestamp.fromDate(alert.timestamp),
  });
  return docRef.id;
}

export async function getAlertsForTeam(teamId: string): Promise<Alert[]> {
  const alertsRef = collection(db, 'alerts');
  const q = query(
    alertsRef,
    where('teamId', 'in', [teamId, null]),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docData => ({
    id: docData.id,
    ...docData.data(),
    timestamp: docData.data().timestamp?.toDate() || new Date(),
  })) as Alert[];
}

export function subscribeToAlerts(teamId: string, callback: (alerts: Alert[]) => void) {
  const alertsRef = collection(db, 'alerts');
  // Subscribe to all alerts and filter client-side for real-time updates
  return onSnapshot(alertsRef, (snapshot) => {
    const alerts = snapshot.docs
      .map(docData => ({
        id: docData.id,
        ...docData.data(),
        timestamp: docData.data().timestamp?.toDate() || new Date(),
      }))
      .filter(alert => alert.teamId === teamId || alert.teamId === null)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()) as Alert[];
    callback(alerts);
  });
}

export async function markAlertAsRead(alertId: string): Promise<void> {
  const alertRef = doc(db, 'alerts', alertId);
  await updateDoc(alertRef, { read: true });
}

export async function deleteAlert(alertId: string): Promise<void> {
  const alertRef = doc(db, 'alerts', alertId);
  await deleteDoc(alertRef);
}

// Initialize sample data
export async function initializeSampleData(): Promise<void> {
  // Check if missions exist
  const missions = await getAllMissions();
  if (missions.length > 0) return;

  // Create sample missions
  const sampleMissions: Mission[] = [
    {
      id: 1,
      title: 'Mission Alpha: The Awakening',
      description: 'Your first mission begins. Decrypt the initial codes to establish communication.',
      storyContext: 'The year is 2147. Earth&apos;s central AI has gone offline. Your team has been activated to restore critical systems. Begin by solving the initialization puzzle.',
      geniallyUrl: 'https://view.genially.com/YOUR_GENIALLY_ID_1',
      correctAnswer: 'ALPHA123',
      nextMissionId: 2,
    },
    {
      id: 2,
      title: 'Mission Beta: Power Grid',
      description: 'Restore the power systems by solving the energy matrix puzzle.',
      storyContext: 'With communications restored, you discover the power grid is failing. Navigate the energy maze to bring systems back online.',
      geniallyUrl: 'https://view.genially.com/YOUR_GENIALLY_ID_2',
      correctAnswer: 'POWER456',
      nextMissionId: 3,
    },
    {
      id: 3,
      title: 'Mission Gamma: Final Protocol',
      description: 'Execute the final protocol to complete your mission.',
      storyContext: 'This is it. The final challenge. All your training has led to this moment. Complete the protocol to save humanity.',
      geniallyUrl: 'https://view.genially.com/YOUR_GENIALLY_ID_3',
      correctAnswer: 'FINALE789',
      nextMissionId: null,
    },
  ];

  for (const mission of sampleMissions) {
    await createMission(mission);
  }

  // Create sample teams
  const sampleTeams = [
    { name: 'Team Alpha', code: 'TEAM1', captainName: 'Alpha Leader', members: ['Member 1', 'Member 2'], color: '#00d4ff' },
    { name: 'Team Beta', code: 'TEAM2', captainName: 'Beta Leader', members: ['Member 1', 'Member 2'], color: '#ffb800' },
    { name: 'Team Gamma', code: 'TEAM3', captainName: 'Gamma Leader', members: ['Member 1', 'Member 2'], color: '#00ff88' },
  ];

  for (const team of sampleTeams) {
    const existing = await getTeamByCode(team.code);
    if (!existing) {
      await createTeam({
        name: team.name,
        code: team.code,
        captainName: team.captainName,
        members: team.members,
        color: team.color,
        currentMission: 1,
        completedMissions: [],
        score: 0,
        createdAt: new Date(),
      });
    }
  }
}
