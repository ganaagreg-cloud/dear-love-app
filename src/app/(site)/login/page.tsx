import BrandMark from '@/components/BrandMark';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { safeNext } from '@/lib/safeNext';
import { isDemo, supabaseConfigured } from '@/lib/env';
import GoogleButton from './GoogleButton';

export const metadata = { title: 'Нэвтрэх' };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getUser()) redirect(next);
  return (
    <div className="page-narrow">
      <div className="panel stack center">
        <div className="brand" style={{ justifyContent: 'center' }}><BrandMark /><span>Dear <em className="brand-love">Love</em></span></div>
        <h1>Үргэлжлүүлэхийн тулд нэвтэрнэ үү</h1>
        <p className="muted small" style={{ margin: 0 }}>
          Таны хуудсууд Google бүртгэлтэй тань холбогдоно — худалдаж авсан хуудсаа зөвхөн та засна.
        </p>
        {supabaseConfigured() && <GoogleButton next={next} />}
        {isDemo() && (
          <form action="/auth/demo" method="post" className="stack" style={{ gap: 8 }}>
            <input type="hidden" name="next" value={next} />
            <button className="google-btn" type="submit">🧪 Туршилтын горимоор нэвтрэх</button>
            <span className="small muted">Supabase тохируулаагүй тул туршилтын хэрэглэгчээр нэвтэрнэ.</span>
          </form>
        )}
        {!supabaseConfigured() && !isDemo() && <p className="err">Нэвтрэх систем тохируулагдаагүй байна.</p>}
        {sp.error && <p className="err">Нэвтрэхэд алдаа гарлаа. Дахин оролдоно уу.</p>}
        <p className="small muted" style={{ margin: 0 }}>Бид таны нэрийн өмнөөс юу ч нийтлэхгүй, найзуудын жагсаалтыг тань уншихгүй.</p>
      </div>
    </div>
  );
}
