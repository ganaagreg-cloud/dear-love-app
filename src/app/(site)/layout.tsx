import Nav from '@/components/Nav';
import { isDemo } from '@/lib/env';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isDemo() && <div className="demo-bar">🧪 Туршилтын горим — бодит төлбөр, бүртгэл ашиглагдахгүй. Supabase түлхүүр оруулмагц жинхэнэ горимд шилжинэ.</div>}
      <Nav />
      <main>{children}</main>
      <footer className="site">
        <div className="container row between wrap">
          <span>© {new Date().getFullYear()} Dear Love · Улаанбаатарт хийв</span>
          <span>Төлбөрийг QPay-ээр (Wire) хүлээн авна</span>
        </div>
      </footer>
    </>
  );
}
