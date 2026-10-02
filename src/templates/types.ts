/** Schema-driven editing: each template declares exactly which parts a buyer may change. */

type Base = {
  key: string; label: string; help?: string;
  /** Editor marks the step ⚠ while this is empty (images: every slot up to `max`; list: every item). */
  required?: boolean;
  /** Preview scene to show while this field has focus — overrides the section's `previewPage`. */
  previewPage?: string | number;
  /** List/images fields: item i previews `${itemPreview}${i}` (e.g. 'stop:' → 'stop:2'). */
  itemPreview?: string;
  /** Show the template's `tokens` as insert-at-cursor chips above this text field. */
  tokens?: boolean;
  /** One-click sample value: «Жишээ: «Анхны болзоо» ← дарж оруулах» (lists: fills the first empty item). */
  example?: string;
};

export type Field =
  | (Base & { type: 'text'; max?: number; placeholder?: string })
  | (Base & { type: 'textarea'; max?: number; rows?: number; placeholder?: string })
  | (Base & { type: 'image' })
  | (Base & { type: 'images'; max: number })
  | (Base & { type: 'audio'; maxMB?: number; /** Library track ids this template offers (src/lib/music.json); all if omitted. */ tracks?: string[] })
  | (Base & { type: 'color'; presets?: string[] })
  | (Base & { type: 'date' })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & { type: 'toggle' })
  | (Base & { type: 'list'; count: number; max?: number; itemLabel?: string; /** Edit each item by picking one of these (tap again to clear) instead of typing. */ emojis?: string[] })
  | (Base & { type: 'spotify'; placeholder?: string });

export type FieldType = Field['type'];

export type Section = {
  id: string; title: string; description?: string; fields: Field[];
  /** Which slide/scene/screen/page in the template's own preview this section's fields affect — drives the editor's live-preview pinning. */
  previewPage?: string | number;
  /** One sentence at the top of the step: what this part of the finished gift is. */
  summary?: string;
  /** Short step-tab label (e.g. «Түүх»). Without it the tab shows its number. */
  short?: string;
  /**
   * Edit these parallel fields as `count` cards (photo + title + note each) that can be
   * dragged to reorder. The stored shape stays three separate arrays; the keys must also be
   * declared in `fields` so the sanitizer keeps them. Focusing card i previews `${previewPrefix}${i}`.
   */
  /** Walk through this section one item per step (item i of every list/images field), e.g. Flight's stops. */
  perItem?: { count: number; label: string };
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
  /** Scenes (preview pins) the template page's silent autoplay walks through, ~2.5s each. */
  tour?: (string | number)[];
  /** How long the editor waits after a keystroke before updating the preview (default 700ms). */
  previewDebounceMs?: number;
};

export const allFields = (m: Pick<TemplateMeta, 'schema'>) => m.schema.flatMap((s) => s.fields);
