/** Schema-driven editing: each template declares exactly which parts a buyer may change. */

type Base = {
  key: string; label: string; help?: string;
  /** Editor marks the step ⚠ while this is empty (images: every slot up to `max`; list: every item). */
  required?: boolean;
  /** Preview scene to show while this field has focus — overrides the section's `previewPage`. */
  previewPage?: string | number;
  /** Show the template's `tokens` as insert-at-cursor chips above this text field. */
  tokens?: boolean;
};

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

export type Section = {
  id: string; title: string; description?: string; fields: Field[];
  /** Which slide/scene/screen/page in the template's own preview this section's fields affect — drives the editor's live-preview pinning. */
  previewPage?: string | number;
  /** Short step-tab label (e.g. «Түүх»). Without it the tab shows its number. */
  short?: string;
  /**
   * Edit these parallel fields as `count` cards (photo + title + note each) that can be
   * dragged to reorder. The stored shape stays three separate arrays; the keys must also be
   * declared in `fields` so the sanitizer keeps them. Focusing card i previews `${previewPrefix}${i}`.
   */
  cards?: { count: number; image: string; title: string; text: string; itemLabel: string; previewPrefix?: string };
};

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
  /** Placeholders the template resolves in its text (e.g. {player}) — offered as insert chips on `tokens` fields. */
  tokens?: { token: string; label: string }[];
  /** How long the editor waits after a keystroke before updating the preview (default 700ms). */
  previewDebounceMs?: number;
};

export const allFields = (m: Pick<TemplateMeta, 'schema'>) => m.schema.flatMap((s) => s.fields);
