import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="brand">
        <h1>Sahiba Mahamud Ansari</h1>
        <p>— Personality Stylist</p>
      </div>

      <nav className="right">
        <a
          className="github"
          href="https://github.com/sahibaansari/image-trail-next"
          target="_blank"
          rel="noopener noreferrer"
        >
          Github
        </a>
      </nav>
    </header>
  );
}
