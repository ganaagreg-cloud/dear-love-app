# Dear Love — хайрын дижитал бэлгийн платформ

Худалдан авагч загвараа үзнэ → Google-ээр нэвтэрнэ → **QPay (Wire)-ээр** төлнө → зөвхөн өөрийн хуудсаа засна → нийтэлнэ → **`anu-bat.dearlove.mn`** гэх мэт өөрийн нэртэй линкээр илгээнэ.

6 загвар: **Бидний жил (Wrapped)** · **Хайрын нислэг** · **Хайрын адал явдал** (тоглоом) · **Медальон түүх** · **Дурсамжийн ном** · **LoveFlix**

---

## 1. Шууд туршиж үзэх (ямар ч бүртгэлгүй)
```bash
npm install
cp .env.example .env.local
npm run dev
```
http://localhost:3000 → «Нэвтрэх» → **Туршилтын горимоор нэвтрэх** → загвар сонгох → туршилтын QPay дээр «Төлбөр амжилттай болсныг дуурайх» → засварлагч → «Нийтлэх» → линкээ нэрлэх → `http://anu-bat.localhost:3000` нээгдэнэ.
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

## 3. Домэйн ба дэд домэйн (anu-bat.dearlove.mn)

Худалдан авсан хуудас бүр **тусдаа дэд домэйн** авна — нэг wildcard тохиргоогоор бүгд ажиллана, хуудас тус бүрд DNS хийх шаардлагагүй.

1. Домэйн худалдаж авна (ж: `dearlove.mn` — Datacom.mn гэх мэт, эсвэл `.com` — Namecheap/Cloudflare).
2. Кодоо GitHub руу хийгээд **Vercel** дээр import хийнэ, бүх env-ээ Vercel → Settings → Environment Variables-д оруулна:
   - `NEXT_PUBLIC_SITE_URL=https://dearlove.mn`
   - `NEXT_PUBLIC_ROOT_DOMAIN=dearlove.mn`
3. Vercel → Project → **Domains**: `dearlove.mn`, `www.dearlove.mn` болон **`*.dearlove.mn`** гурвыг нэмнэ.
4. Wildcard (`*.`) домэйн ажиллахын тулд домэйн худалдаж авсан газраа **nameserver**-ээ `ns1.vercel-dns.com`, `ns2.vercel-dns.com` болгож солино. Vercel SSL (https) сертификатыг бүх дэд домэйнд автоматаар гаргана.
5. Дууслаа: хэрэглэгч «Нийтлэх» дээр `anu-bat` гэж бичихэд `https://anu-bat.dearlove.mn` шууд ажиллана. `dearlove.mn/p/anu-bat` линк ч мөн ажиллана.

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
| `src/proxy.ts` | дэд домэйн → `/p/<нэр>` rewrite, нэвтрэлтийн хамгаалалт |
| `src/templates` | 6 загвар + schema/шалгалт |
