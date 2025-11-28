import Link from "next/link";

import ImageTrail from "@/components/ImageTrailDemo2";

export default function Home() {
  const images = [
    "/imgs/1.jpg",
    "/imgs/2.jpg",
    "/imgs/3.jpg",
    "/imgs/4.jpg",
    "/imgs/5.jpg",
    "/imgs/6.jpg",
    "/imgs/7.jpg",
    "/imgs/8.jpg",
    "/imgs/9.jpg",
    "/imgs/10.jpg",
  ];

  return (
    <main className="app-container">
      <header className="site-header">
        <div className="brand">
          <h1>Sahiba Mahamud Ansari</h1>
          <p>— Personality Stylist</p>
        </div>
        <nav className="right">
  <a
    className="github"
    href="https://github.com/YOUR_GITHUB_USERNAME/image-trail-next"
    target="_blank"
    rel="noopener noreferrer"
  >
    Github
  </a>
</nav>
      </header>

      <div className="hero">
        <div className="hero-bg">OMGGG</div>
      </div>

      <ImageTrail images={images}  />

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
    </main>
  );
}
