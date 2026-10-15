# Dear Love — хайрын дижитал бэлгийн платформ

Худалдан авагч загвараа үзнэ → Google-ээр нэвтэрнэ → **QPay (Wire)-ээр** төлнө → зөвхөн өөрийн хуудсаа засна → нийтэлнэ → **`dearlove.mn/p/anu-bat`** гэх мэт өөрийн нэртэй линкээр илгээнэ.

6 загвар: **Бидний жил (Wrapped)** · **Хайрын нислэг** · **Хайрын адал явдал** (тоглоом) · **Медальон түүх** · **Дурсамжийн ном** · **LoveFlix**

---

## 1. Шууд туршиж үзэх (ямар ч бүртгэлгүй)
```bash
npm install
cp .env.example .env.local
npm run dev
```
http://localhost:3000 → «Нэвтрэх» → **Туршилтын горимоор нэвтрэх** → загвар сонгох → туршилтын QPay дээр «Төлбөр амжилттай болсныг дуурайх» → засварлагч → «Нийтлэх» → линкээ нэрлэх → `http://localhost:3000/p/anu-bat` нээгдэнэ.
Туршилтын өгөгдөл `.demo-data/` хавтсанд хадгалагдана (устгаад дахин эхэлж болно).

## 2. Жинхэнэ ажиллуулах

### Supabase (өгөгдлийн сан + Google нэвтрэлт + зураг хадгалах)
1. supabase.com дээр project үүсгээд **URL, anon key, service_role key**-г `.env.local`-д хийнэ (# -ийг арилгана).
2. SQL editor → `supabase/migrations/0001_init.sql`-г бүтнээр нь ажиллуулна (хүснэгт, RLS, `media` bucket).
3. Authentication → Providers → **Google** асаана. Google Cloud Console → Credentials → OAuth client (Web) үүсгэж, Authorized redirect URI-д `https://<project>.supabase.co/auth/v1/callback` оруулна.
4. Authentication → URL Configuration → Site URL = `https://dearlove.mn`, Redirect URLs-д `https://dearlove.mn/**`, `http://localhost:3000/**` нэмнэ.

### Wire (QPay)
1. app.wire.mn → project → **API key** (эхлээд `sk_test_…`) → `WIRE_API_KEY`.
2. Webhooks → `https://dearlove.mn/api/webhooks/wire`, event: `payment_intent.succeeded`, `payment_intent.canceled`, `payment_intent.payment_failed` → `whsec_…` → `WIRE_WEBHOOK_SECRET`.
3. Live болохдоо `sk_live_…` болгож, `WIRE_ALLOWED_OPERATORS`-г Wire-ийн идэвхжүүлсэн operator id болгоно (ж: `qpay`).

## 3. Домэйн ба линк (dearlove.mn/p/anu-bat)

Нийтэлсэн бэлэг бүр **`https://dearlove.mn/p/<нэр>`** линк авна — нэмэлт DNS тохиргоо шаардлагагүй.

1. Кодоо **Vercel** дээр import хийж, бүх env-ээ Vercel → Settings → Environment Variables-д оруулна (`NEXT_PUBLIC_SITE_URL=https://dearlove.mn` гэх мэт).
2. Vercel → Project → **Domains**: `dearlove.mn`, `www.dearlove.mn`.
3. **`NEXT_PUBLIC_ROOT_DOMAIN`-ийг production дээр бүү тохируул.** Тохируулбал бүх линк `anu-bat.dearlove.mn` хэлбэртэй болно, харин `*.dearlove.mn` wildcard DNS тохируулаагүй тул линк бүр нээгдэхгүй. (Дэд домэйн горимыг ашиглах бол эхлээд Vercel-д `*.dearlove.mn` нэмж, nameserver-ээ `ns1/ns2.vercel-dns.com` болгож, ажиллаж байгааг шалгасны дараа л энэ хувьсагчийг тохируулна.)
4. Production-д гаргахаас өмнө `npm run preflight`-ийг production-ий env-ээр ажиллуулна (ж: `vercel env pull .env.production.local && npm run preflight`).

> Нэр давхцахгүй (unique), зөвхөн латин жижиг үсэг/тоо/зураас, `www, api, admin…` зэрэг нөөц нэрийг хориглосон.
> `NEXT_PUBLIC_*` хувьсагчид build хийх үед кодонд шингэдэг тул өөрчилсний дараа дахин deploy хийнэ.

## Аюулгүй байдал
- Үнийг зөвхөн сервер тал (`src/templates/*/meta.ts`) тогтооно.
- Хэрэглэгч өгөгдлийн санд шууд бичиж чадахгүй (RLS) — бүх бичилт нэвтрэлт, эзэмшил, төлбөрийг шалгасан API-аар явна.
- Төлбөрийг Wire-аас PaymentIntent-ийг дахин татаж, **статус болон дүн**-г шалгаж баталгаажуулна; webhook-ийн гарын үсгийг шалгаж, давхардлыг хаана.
- Засварыг схемээр шүүнэ: зөвхөн зөвшөөрөгдсөн талбар, урт, өнгө/огноо/сонголт, зөвхөн тухайн хуудасны хавтас дахь зураг/дуу.
- Зургийг хөтөч дээр жижигрүүлж дахин кодлоно (EXIF/GPS устна).
- Шалгасан (E2E): нэвтрээгүй хүн засах → нэвтрэх рүү; өөр хэрэглэгч засах → 404; гадны зураг/өнгөний injection → цэвэрлэгдэнэ; нөөц нэр → 400; хоёр дахь төлбөр → 409.

## Демо зургууд
`src/templates/photos.ts` — Unsplash-ийн үнэгүй зургууд (Unsplash License: арилжааны зорилгоор үнэгүй, заавал нэр дурдах шаардлагагүй). Зөвхөн «Жишээ» үзэхэд ашиглагдана; худалдан авагч өөрийн зургаа оруулна.

## Шинэ загвар нэмэх
1. `src/templates/<id>/View.tsx` — `({ content }) => …`
2. `src/templates/<id>/meta.ts` — нэр, үнэ, cover, **schema** (засах боломжтой талбарууд), defaults
3. `src/templates/registry.ts`, `src/templates/TemplateView.tsx`-д бүртгэж, `public/covers/<id>.jpg` нэмнэ.
Засварлагч, шалгалт, шууд харагдац, нийтлэх бүгд schema-гаас автоматаар ажиллана.

## Бүтэц
| Зам | Юу |
|---|---|
| `src/app/(site)` | нүүр, нэвтрэх, худалдан авах, төлбөр, миний хуудсууд |
| `src/app/(bare)` | бүтэн дэлгэц: жишээ, засварлагч, render, нийтлэгдсэн хуудас |
| `src/app/api` | захиалга, хадгалах/нийтлэх, Wire webhook, (demo) файл upload |
| `src/lib/store.ts` | өгөгдлийн давхарга: Supabase эсвэл demo JSON файл |
| `src/proxy.ts` | нэвтрэлтийн хамгаалалт; (сонголтоор) дэд домэйн → `/p/<нэр>` rewrite |
| `src/templates` | 6 загвар + schema/шалгалт |
