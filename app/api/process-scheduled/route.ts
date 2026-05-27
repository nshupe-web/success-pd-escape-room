import { NextResponse } from 'next/server';
import { processDueScheduledAlerts } from '@/lib/firebase-utils';

export async function GET() {
  const processed = await processDueScheduledAlerts();
  return NextResponse.json({ processed });
}
