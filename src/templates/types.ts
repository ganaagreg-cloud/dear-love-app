/** Schema-driven editing: each template declares exactly which parts a buyer may change. */

type Base = { key: string; label: string; help?: string };

export type Field =
  | (Base & { type: 'text'; max?: number; placeholder?: string })
  | (Base & { type: 'textarea'; max?: number; rows?: number; placeholder?: string })
  | (Base & { type: 'image' })
  | (Base & { type: 'images'; max: number })
  | (Base & { type: 'audio'; maxMB?: number })
  | (Base & { type: 'color'; presets?: string[] })
  | (Base & { type: 'date' })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & { type: 'toggle' })
  | (Base & { type: 'list'; count: number; max?: number; itemLabel?: string })
  | (Base & { type: 'spotify'; placeholder?: string });

export type FieldType = Field['type'];

export type Section = { id: string; title: string; description?: string; fields: Field[] };

/** Flat map: field key → value. Stored as jsonb in pages.content. */
export type ContentValue = string | string[] | boolean;
export type Content = Record<string, ContentValue>;

export type TemplateMeta = {
  id: string;
  name: string;
  nameMn: string;
  tagline: string;
  description: string;
  category: 'Хайр' | 'Ой' | 'Төрсөн өдөр' | 'Болзоонд урих' | 'Бүх үйл явдалд' | 'Аялал';
  badge?: string;
  price: number; // whole ₮ — the ONLY source of truth for what we charge
  cover: string; // /covers/<id>.jpg
  accent: string;
  features: string[];
  schema: Section[];
  /** Values a fresh (just-paid) page starts with. */
  defaults: Content;
  /** Extra values used only on the public demo/preview. */
  demo?: Content;
};

export const allFields = (m: Pick<TemplateMeta, 'schema'>) => m.schema.flatMap((s) => s.fields);
