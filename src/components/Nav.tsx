import BrandMark from './BrandMark';
import Link from 'next/link';
import { getUser } from '@/lib/supabase/server';

export default async function Nav() {
  const user = await getUser();
  return (
    <header className="nav">
      <div className="container nav-in">
        <Link href="/" className="brand"><BrandMark /><span>Dear <em className="brand-love">Love</em></span></Link>
        <nav className="nav-links">
          <Link href="/#templates" className="btn btn-ghost btn-sm hide-sm">Загварууд</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="btn btn-sm">Миний хуудсууд</Link>
              <form action="/auth/signout" method="post">
                <button className="btn btn-ghost btn-sm" type="submit">Гарах</button>
              </form>
              {user.avatar && <img className="avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />}
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Нэвтрэх</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
