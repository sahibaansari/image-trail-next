import ImageTrail from "@/components/ImageTrail";

export default function Home() {
  const images = [
    "/imgs/1.jpg",
    "/imgs/2.jpg",
    "/imgs/3.jpg",
    "/imgs/4.jpg",
    "/imgs/5.jpg",
    "/imgs/6.jpg",
  ];

  return (
    <main className="app-container">
      <header className="site-header">
        <div className="brand">
          <h1>Sahiba Mahamud Ansari</h1>
          <p>— Personality Stylist</p>
        </div>
        <nav className="right">
          <a className="github">Github</a>
        </nav>
      </header>

      <div className="hero">
        <div className="hero-bg">loookkk</div>
      </div>

      <ImageTrail images={images} count={9} size={170} />

      <footer className="site-footer">
        <div>Image Trail Effects</div>
        <div className="links">Previous demo &nbsp; Article &nbsp; 1 — 2 3 4 5 6</div>
      </footer>
    </main>
  );
}
