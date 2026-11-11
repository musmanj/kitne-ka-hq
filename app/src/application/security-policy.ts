import { isRecord } from '../domain/canonical';
import { timestamp } from '../domain/pricing';
export const PRIVATE_RESPONSE_HEADERS = Object.freeze({ 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' });
export const SHARE_RESPONSE_HEADERS = Object.freeze({ ...PRIVATE_RESPONSE_HEADERS, 'Content-Type': 'application/json; charset=utf-8' });
export const EXTERNAL_LINK_REL = 'noopener noreferrer';
export const PII_INPUT_TRANSPORT = Object.freeze({ method: 'POST', body_limit_bytes: 65536, content_encoding: 'identity', allow_query: false,
  routes: Object.freeze(['/catalogue/search', '/extractions', '/assessments', '/checks/:id/classify']) });
/** Provider/log sink settings must ALSO be verified on the real stack. This is not that proof. */
export function redactTokenBearingHeaders(headers: Record<string, unknown>): Record<string, string> {
  const present = new Set(Object.keys(headers).map(key => key.toLowerCase()));
  return Object.fromEntries(['authorization', 'cookie', 'x-check-token', 'x-extraction-token', 'x-revoke-token', 'x-device-session', 'idempotency-key'].filter(key => present.has(key)).map(key => [key, '[REDACTED]']));
}
export function safeOperationalLog(raw: unknown): Record<string, number | string> {
  if (!isRecord(raw)) return {};
  const safe: Record<string, number | string> = {};
  const routes: readonly string[] = [...PII_INPUT_TRANSPORT.routes, '/shares/:id', '/s/:id', '/s/:id/image.png', '/health/cleanup'];
  if (typeof raw.route_template === 'string' && routes.includes(raw.route_template)) safe.route_template = raw.route_template;
  if (Number.isInteger(raw.status) && (raw.status as number) >= 100 && (raw.status as number) <= 599) safe.status = raw.status as number;
  for (const key of ['count', 'duration_ms']) if (typeof raw[key] === 'number' && Number.isFinite(raw[key]) && raw[key] >= 0 && raw[key] <= 1e9) safe[key] = raw[key];
  return safe; // no URL/body/header/token/error/digest/resource ID passthrough
}
export type RateLimitRule = { device?: readonly { max: number; window: 'MINUTE' | 'HOUR' | 'DAY' | 'ACTIVE' }[];
  ip: readonly { max: number; window: 'MINUTE' | 'HOUR' | 'DAY' }[]; global_day: number; png_renders_day?: number };
const rules: Readonly<Record<string, RateLimitRule>> = {
  create_check: { device: [{ max: 5, window: 'MINUTE' }, { max: 30, window: 'DAY' }, { max: 2, window: 'ACTIVE' }], ip: [{ max: 30, window: 'MINUTE' }, { max: 300, window: 'DAY' }], global_day: 1000 },
  create_share: { device: [{ max: 10, window: 'HOUR' }, { max: 30, window: 'DAY' }], ip: [{ max: 30, window: 'HOUR' }, { max: 100, window: 'DAY' }], global_day: 300 },
  classify: { device: [{ max: 10, window: 'MINUTE' }, { max: 100, window: 'DAY' }], ip: [{ max: 60, window: 'MINUTE' }, { max: 1000, window: 'DAY' }], global_day: 5000 },
  search: { device: [{ max: 30, window: 'MINUTE' }, { max: 300, window: 'DAY' }], ip: [{ max: 120, window: 'MINUTE' }, { max: 1000, window: 'DAY' }], global_day: 10000 },
  advance_poll: { device: [{ max: 60, window: 'MINUTE' }], ip: [{ max: 300, window: 'MINUTE' }], global_day: 30000 },
  public_share: { ip: [{ max: 120, window: 'MINUTE' }], global_day: 50000, png_renders_day: 3000 },
  bootstrap: { ip: [{ max: 20, window: 'HOUR' }, { max: 50, window: 'DAY' }], global_day: 5000 }
};
export const INITIAL_RATE_POLICY = Object.freeze({ version: 'API-0-7-INITIAL-ASSUMPTIONS', daily_zone: 'Asia/Karachi', rules,
  poll_per_job_minute: 30, revoke_delete: Object.freeze({ per_capability_minute: 60, per_ip_minute: 120, independent_of_creation_caps: true }),
  enabled: false }); // real shared atomic counters/ingress HMAC+trusted IP integration PENDING
export function pktDailyWindow(now: number): { start_ms: number; end_ms: number } {
  if (!Number.isSafeInteger(now)) throw new RangeError('INVALID_CLOCK');
  const day = 86400000, offset = 18000000, start_ms = Math.floor((now + offset) / day) * day - offset;
  return { start_ms, end_ms: start_ms + day };
}
export type CleanupHeartbeat = { birth_epoch: string; last_attempt_at: string; last_attempt_status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  last_success_at: string | null; oldest_overdue_ms: number; overdue_count: number };
export interface CleanupHeartbeatStore { read(): CleanupHeartbeat | null; recordCommittedSuccess(heartbeat: CleanupHeartbeat): void }
export function cleanupHealth(heartbeat: CleanupHeartbeat | null, context: { now: string; current_epoch: string; database_reachable: boolean }):
  { status: 200 | 503; headers: typeof PRIVATE_RESPONSE_HEADERS; body: { status: 'ok' | 'unhealthy' } } {
  const now = timestamp(context.now), success = heartbeat?.last_success_at ? timestamp(heartbeat.last_success_at) : null;
  const attempt = heartbeat ? timestamp(heartbeat.last_attempt_at) : null;
  const healthy = !!context.current_epoch && context.database_reachable && heartbeat?.birth_epoch === context.current_epoch &&
    now !== null && success !== null && success <= now && attempt !== null && attempt <= now && success <= attempt &&
    heartbeat.last_attempt_status !== 'FAILED' && now - success <= 20 * 60000 && heartbeat.oldest_overdue_ms <= 15 * 60000 &&
    Number.isSafeInteger(heartbeat.oldest_overdue_ms) && heartbeat.oldest_overdue_ms >= 0 && Number.isSafeInteger(heartbeat.overdue_count) && heartbeat.overdue_count >= 0;
  return { status: healthy ? 200 : 503, headers: PRIVATE_RESPONSE_HEADERS, body: { status: healthy ? 'ok' : 'unhealthy' } };
}
export const CLEANUP_POLICY = Object.freeze({ cron: '*/15 * * * *', independent_poll_minutes: 5, max_success_age_minutes: 20,
  max_overdue_minutes: 15, close_admission_after_unresolved_minutes: 60, external_monitor_enabled: false });
