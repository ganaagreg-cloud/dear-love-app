import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { store } from '@/lib/store';
import { pageUrl } from '@/lib/env';
import { getTemplate } from '@/templates/registry';
import PayButton from '@/components/PayButton';
import CopyLink from '@/components/CopyLink';

export const metadata = { title: 'Миний хуудсууд' };
export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const user = await getUser();
  if (!user) redirect('/login?next=/dashboard');
  const pages = await store().listPages(user.id);

  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="section-title">
        <h2>Миний хуудсууд</h2>
        <Link href="/#templates" className="btn btn-rose btn-sm">+ Шинэ хуудас</Link>
      </div>
      {!pages.length ? (
        <div className="empty">
          <p style={{ fontSize: 34, margin: 0 }}>💌</p>
          <p>Та одоогоор юу ч хийгээгүй байна.</p>
          <Link href="/#templates" className="btn btn-primary">Загвар сонгох</Link>
        </div>
      ) : (
        <div className="dash-list">
          {pages.map((p) => {
            const t = getTemplate(p.template_id);
            const label = p.status === 'published' ? 'Нийтлэгдсэн' : p.status === 'paid' ? 'Төлсөн · ноорог' : 'Төлбөр хүлээгдэж буй';
            const link = p.slug ? pageUrl(p.slug) : '';
            return (
              <div className="dash-item" key={p.id}>
                <img src={t?.cover} alt="" loading="lazy" />
                <div>
                  <h3>{t?.name ?? p.title}</h3>
                  <span className={`pill ${p.status === 'pending_payment' ? 'pending' : p.status}`}>{label}</span>
                  {p.status === 'published' && link && <p className="small muted" style={{ margin: '6px 0 0', wordBreak: 'break-all' }}>{link.replace(/^https?:\/\//, '')}</p>}
                  <p className="small muted" style={{ margin: '4px 0 0' }}>Шинэчилсэн: {new Date(p.updated_at).toLocaleDateString('en-CA')}</p>
                </div>
                <div className="dash-actions">
                  {p.paid_at ? (
                    <>
                      <Link href={`/edit/${p.id}`} className="btn btn-sm btn-primary">Засах</Link>
                      {p.status === 'published' && link && <><a href={link} target="_blank" rel="noreferrer" className="btn btn-sm">Үзэх</a><CopyLink url={link} /></>}
                    </>
                  ) : (
                    <PayButton pageId={p.id} label="Төлөх" size="sm" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
