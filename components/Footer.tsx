import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>Image Trail Effects</div>

      <div className="links">
        <Link href="/trail/1">1</Link> &nbsp;
        <Link href="/trail/2">2</Link> &nbsp;
        <Link href="/trail/3">3</Link> &nbsp;
        <Link href="/trail/4">4</Link> &nbsp;
        <Link href="/trail/5">5</Link> &nbsp;
      
      </div>
    </footer>
  );
}
