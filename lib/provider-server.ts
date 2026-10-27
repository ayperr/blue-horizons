import { NextResponse } from 'next/server';
import { validateTrip } from './travel';
const usage = new Map<string,{ count:number; reset:number }>();
// Best-effort per-instance protection. Use Vercel WAF or a shared rate limiter before enabling publicly.
export function withinBudget(service: string, cost = 1) {
  const now = Date.now(), day = new Date().toISOString().slice(0,10), key = `${service}:${day}`;
  for (const [k,v] of usage) if (v.reset < now) usage.delete(k);
  const item = usage.get(key) ?? { count:0, reset:now+86400000 };
  if (item.count+cost > 20) return false;
  item.count += cost; usage.set(key,item); return true;
}
export async function readTrip(request: Request) {
  const text = await request.text();
  if (text.length > 5000) return null;
  try { return validateTrip(JSON.parse(text)); } catch { return null; }
}
export function reply(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers:{ 'Cache-Control':'no-store' } });
}
export function safeBookingURL(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'booking.com' || u.hostname.endsWith('.booking.com')) ? u.toString() : null; } catch { return null; }
}
