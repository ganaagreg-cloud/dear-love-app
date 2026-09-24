import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { isDemo } from './env';
import { supabaseAdmin } from './supabase/admin';

export type PageStatus = 'pending_payment' | 'paid' | 'published';
export type PageRow = {
  id: string; user_id: string; template_id: string; title: string | null; slug: string | null;
  content: Record<string, unknown>; status: PageStatus;
  paid_at: string | null; published_at: string | null; created_at: string; updated_at: string;
};
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'canceled';
export type OrderRow = {
  id: string; user_id: string; page_id: string; template_id: string; amount: number; currency: string;
  status: OrderStatus; provider: 'wire' | 'mock'; wire_payment_intent_id: string | null; checkout_url: string | null;
  paid_at: string | null; created_at: string;
};

/** Everything the app needs from a database. Two implementations: Supabase (real) and a JSON file (demo). */
export interface Store {
  getPage(id: string): Promise<PageRow | null>;
  getPublishedBySlug(slug: string): Promise<PageRow | null>;
  slugTaken(slug: string, exceptId?: string): Promise<boolean>;
  listPages(userId: string): Promise<PageRow[]>;
  createPage(userId: string, templateId: string, title: string): Promise<PageRow>;
  updatePage(id: string, patch: Partial<PageRow>): Promise<void>;
  /** Marks paid only if not paid yet (idempotent). */
  markPagePaid(id: string, at: string): Promise<void>;
  createOrder(o: Pick<OrderRow, 'user_id' | 'page_id' | 'template_id' | 'amount' | 'provider'>): Promise<OrderRow>;
  getOrder(id: string): Promise<OrderRow | null>;
  getOrderByIntent(pi: string): Promise<OrderRow | null>;
  updateOrder(id: string, patch: Partial<OrderRow>, onlyIfStatus?: OrderStatus): Promise<OrderRow | null>;
  /** Returns false if this webhook event id was already recorded. */
  recordEvent(id: string, type: string): Promise<boolean>;
  forgetEvent(id: string): Promise<void>;
}

/* ───────────────── Supabase ───────────────── */
const sbStore: Store = {
  async getPage(id) {
    const { data } = await supabaseAdmin().from('pages').select('*').eq('id', id).maybeSingle();
    return (data as PageRow) ?? null;
  },
  async getPublishedBySlug(slug) {
    const { data } = await supabaseAdmin().from('pages').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
    return (data as PageRow) ?? null;
  },
  async slugTaken(slug, exceptId) {
    let q = supabaseAdmin().from('pages').select('id').eq('slug', slug);
    if (exceptId) q = q.neq('id', exceptId);
    const { data } = await q.limit(1);
    return !!data?.length;
  },
  async listPages(userId) {
    const { data } = await supabaseAdmin().from('pages').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data as PageRow[]) ?? [];
  },
  async createPage(userId, templateId, title) {
    const { data, error } = await supabaseAdmin().from('pages').insert({ user_id: userId, template_id: templateId, title, content: {} }).select('*').single();
    if (error || !data) throw error ?? new Error('insert failed');
    return data as PageRow;
  },
  async updatePage(id, patch) {
    const { error } = await supabaseAdmin().from('pages').update(patch).eq('id', id);
    if (error) throw error;
  },
  async markPagePaid(id, at) {
    await supabaseAdmin().from('pages').update({ status: 'paid', paid_at: at }).eq('id', id).is('paid_at', null);
  },
  async createOrder(o) {
    const { data, error } = await supabaseAdmin().from('orders').insert(o).select('*').single();
    if (error || !data) throw error ?? new Error('insert failed');
    return data as OrderRow;
  },
  async getOrder(id) {
    const { data } = await supabaseAdmin().from('orders').select('*').eq('id', id).maybeSingle();
    return (data as OrderRow) ?? null;
  },
  async getOrderByIntent(pi) {
    const { data } = await supabaseAdmin().from('orders').select('*').eq('wire_payment_intent_id', pi).maybeSingle();
    return (data as OrderRow) ?? null;
  },
  async updateOrder(id, patch, onlyIfStatus) {
    let q = supabaseAdmin().from('orders').update(patch).eq('id', id);
    if (onlyIfStatus) q = q.eq('status', onlyIfStatus);
    const { data } = await q.select('*').maybeSingle();
    return (data as OrderRow) ?? null;
  },
  async recordEvent(id, type) {
    const { error } = await supabaseAdmin().from('webhook_events').insert({ id, type });
    return !error;
  },
  async forgetEvent(id) { await supabaseAdmin().from('webhook_events').delete().eq('id', id); },
};

/* ───────────────── Demo (JSON file) ───────────────── */
type DB = { pages: PageRow[]; orders: OrderRow[]; events: string[] };
export const DEMO_DIR = path.join(process.cwd(), '.demo-data');
const DB_FILE = path.join(DEMO_DIR, 'db.json');
let chain: Promise<unknown> = Promise.resolve();
async function load(): Promise<DB> {
  try { return JSON.parse(await fs.readFile(DB_FILE, 'utf8')) as DB; } catch { return { pages: [], orders: [], events: [] }; }
}
/** Serialises read-modify-write so concurrent requests can't clobber each other. */
function tx<T>(fn: (db: DB) => T | Promise<T>, write = true): Promise<T> {
  const run = chain.then(async () => {
    const db = await load();
    const out = await fn(db);
    if (write) { await fs.mkdir(DEMO_DIR, { recursive: true }); await fs.writeFile(DB_FILE, JSON.stringify(db, null, 1)); }
    return out;
  });
  chain = run.catch(() => undefined);
  return run;
}
const now = () => new Date().toISOString();
const fileStore: Store = {
  getPage: (id) => tx((db) => db.pages.find((p) => p.id === id) ?? null, false),
  getPublishedBySlug: (slug) => tx((db) => db.pages.find((p) => p.slug === slug && p.status === 'published') ?? null, false),
  slugTaken: (slug, exceptId) => tx((db) => db.pages.some((p) => p.slug === slug && p.id !== exceptId), false),
  listPages: (userId) => tx((db) => db.pages.filter((p) => p.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at)), false),
  createPage: (userId, templateId, title) => tx((db) => {
    const p: PageRow = { id: randomUUID(), user_id: userId, template_id: templateId, title, slug: null, content: {}, status: 'pending_payment',
      paid_at: null, published_at: null, created_at: now(), updated_at: now() };
    db.pages.push(p); return p;
  }),
  updatePage: (id, patch) => tx((db) => { const p = db.pages.find((x) => x.id === id); if (p) Object.assign(p, patch, { updated_at: now() }); }),
  markPagePaid: (id, at) => tx((db) => { const p = db.pages.find((x) => x.id === id); if (p && !p.paid_at) Object.assign(p, { status: 'paid', paid_at: at, updated_at: now() }); }),
  createOrder: (o) => tx((db) => {
    const r: OrderRow = { ...o, id: randomUUID(), currency: 'MNT', status: 'pending', wire_payment_intent_id: null, checkout_url: null, paid_at: null, created_at: now() };
    db.orders.push(r); return r;
  }),
  getOrder: (id) => tx((db) => db.orders.find((o) => o.id === id) ?? null, false),
  getOrderByIntent: (pi) => tx((db) => db.orders.find((o) => o.wire_payment_intent_id === pi) ?? null, false),
  updateOrder: (id, patch, onlyIfStatus) => tx((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o || (onlyIfStatus && o.status !== onlyIfStatus)) return null;
    Object.assign(o, patch); return o;
  }),
  recordEvent: (id) => tx((db) => { if (db.events.includes(id)) return false; db.events.push(id); return true; }),
  forgetEvent: (id) => tx((db) => { db.events = db.events.filter((e) => e !== id); }),
};

export const store = (): Store => (isDemo() ? fileStore : sbStore);
