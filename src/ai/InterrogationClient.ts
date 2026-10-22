import { AI_ENDPOINT, AI_TIMEOUT_MS } from '../config';
import type { NpcId } from '../content/interrogation/types';
import { sanitizeReply } from './sanitize';

export interface AskContext {
  npc: NpcId;
  question: string;
  history: { role: 'player' | 'npc'; text: string }[];
  stated: string[];
  pressure: 0 | 1 | 2;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class InterrogationClient {
  private failures = 0;
  private openUntil = 0;

  constructor(
    private endpoint: string = AI_ENDPOINT,
    private fetchFn: FetchLike | null = null,
    private now: () => number = () => Date.now(),
    private timeoutMs: number = AI_TIMEOUT_MS,
  ) {}

  get enabled(): boolean {
    return Boolean(this.endpoint) && this.now() >= this.openUntil;
  }

  async ask(ctx: AskContext): Promise<string | null> {
    if (!this.enabled) return null;
    const doFetch: FetchLike | undefined = this.fetchFn ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined);
    if (!doFetch) return null;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), this.timeoutMs);
    try {
      const res = await doFetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ctx, history: ctx.history.slice(-6).map((h) => ({ ...h, text: h.text.slice(0, 200) })) }),
        signal: ctl.signal,
        credentials: 'omit',
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const data = (await res.json()) as { reply?: unknown };
      const clean = sanitizeReply(data.reply, ctx.npc === 'inspector');
      if (!clean) throw new Error('rejected');
      this.failures = 0;
      return clean;
    } catch {
      this.failures++;
      if (this.failures >= 2) {
        this.openUntil = this.now() + 60_000;
        this.failures = 0;
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
