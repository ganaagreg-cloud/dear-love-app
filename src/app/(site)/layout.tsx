import Link from 'next/link';
import Nav from '@/components/Nav';
import Contact from '@/components/Contact';
import { hasContact } from '@/lib/contact';
import MetaPixel from '@/components/MetaPixel';
import { isDemo } from '@/lib/env';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isDemo() && <div className="demo-bar">🧪 Туршилтын горим — бодит төлбөр, бүртгэл ашиглагдахгүй. Supabase түлхүүр оруулмагц жинхэнэ горимд шилжинэ.</div>}
      <Nav />
      <MetaPixel />
      <main>{children}</main>
      <footer className="site">
        <div className="container row between wrap">
          <span>© {new Date().getFullYear()} Dear Love · Улаанбаатарт хийв</span>
          <span>Төлбөрийг QPay-ээр (Wire) хүлээн авна</span>
        </div>
        <div className="container row between wrap" style={{ marginTop: 12 }}>
          <nav aria-label="Бодлого">
            <Link href="/terms">Үйлчилгээний нөхцөл</Link>
            <Link href="/privacy">Нууцлал</Link>
            <Link href="/refund">Буцаалт</Link>
          </nav>
          {hasContact() && <span>Тусламж: <Contact inline /></span>}
        </div>
      </footer>
    </>
  );
}
