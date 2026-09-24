import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="page-narrow"><div className="panel center stack">
      <div style={{ fontSize: 40 }}>🥀</div>
      <h1>Энд юу ч алга</h1>
      <p className="muted" style={{ margin: 0 }}>Энэ линк байхгүй эсвэл одоогоор нийтлэгдээгүй байна.</p>
      <Link href="/" className="btn btn-primary">Нүүр хуудас</Link>
    </div></div>
  );
}
