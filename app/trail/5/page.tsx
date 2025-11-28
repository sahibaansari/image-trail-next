import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ImageTrail from "@/components/ImageTrailDemo5";

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
     <Header />

      <div className="hero">
        <div className="hero-bg">Faabb</div>
      </div>

      <ImageTrail images={images} />

       <Footer />
    </main>
  );
}
