import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import "./Footer.css";

const bannerSlides = [
  {
    src: "/src/assets/campus-banner.jpg",
    label: "Main Gate — IERT, Prayagraj",
    pos: "center top",
  },
  {
    src: "/src/assets/hero-bg.webp",
    label: "Institute of Engineering and Rural Technology, Prayagraj",
    pos: "center center",
  },
];

function CampusBanner() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const touchStartX = useRef(null);
  const mouseStartX = useRef(null);
  const timerRef = useRef(null);

  const total = bannerSlides.length;

  const goTo = (index) => {
    if (animating) return;
    setAnimating(true);
    setCurrent((index + total) % total);
    setTimeout(() => setAnimating(false), 600);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      goTo((current + 1) % total);
    }, 4500);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const prev = () => { goTo(current - 1); resetTimer(); };
  const next = () => { goTo(current + 1); resetTimer(); };

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  const onMouseDown = (e) => { mouseStartX.current = e.clientX; };
  const onMouseUp = (e) => {
    if (mouseStartX.current === null) return;
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); }
    mouseStartX.current = null;
  };

  return (
    <div
      className="campus-carousel"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
    >
      {bannerSlides.map((slide, i) => (
        <div
          key={i}
          className={`carousel-slide ${i === current ? "active" : ""}`}
          aria-hidden={i !== current}
        >
          <img
            src={slide.src}
            alt={slide.label}
            className="carousel-img"
            style={{ objectPosition: slide.pos }}
            draggable={false}
          />
          <div className="carousel-overlay">
            <span className="carousel-label">{slide.label}</span>
          </div>
        </div>
      ))}

      <button className="carousel-btn carousel-prev" onClick={prev} aria-label="Previous">
        <ChevronLeft size={22} strokeWidth={2.5} />
      </button>
      <button className="carousel-btn carousel-next" onClick={next} aria-label="Next">
        <ChevronRight size={22} strokeWidth={2.5} />
      </button>

      <div className="carousel-dots">
        {bannerSlides.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot ${i === current ? "active" : ""}`}
            onClick={() => { goTo(i); resetTimer(); }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <CampusBanner />
      </div>

      <div className="footer-main">
        <div className="container footer-grid">
          {/* About */}
          <div className="footer-col footer-about">
            <img src="/src/assets/iert-logo.jpg" alt="IERT Logo" style={{width:54,height:54,objectFit:"contain"}} />
            <p className="footer-institute">Institute of Engineering and Rural Technology</p>
            <p className="footer-address">
              26, Chaitham Lines, Near Prayag Railway Station,<br />
              Prayagraj - 211002 (U.P.), India
            </p>
            <p><Phone size={13} strokeWidth={2} /> +91-532-2659-7135</p>
            <p><Mail size={13} strokeWidth={2} /> cse@iert.ac.in</p>
            <p><Globe size={13} strokeWidth={2} /> <a href="https://www.iert.ac.in" target="_blank" rel="noreferrer">www.iert.ac.in</a></p>
            <div className="footer-socials">
              <a href="https://x.com/IertPrayagraj" target="_blank" rel="noreferrer" aria-label="Twitter">𝕏</a>
              <a href="https://www.linkedin.com/in/tpo-iert/" target="_blank" rel="noreferrer" aria-label="LinkedIn">in</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <div className="footer-divider" />
            <ul className="footer-links">
              <li><Link to="/about">About Department</Link></li>
              <li><Link to="/faculty">Faculty Members</Link></li>
              <li><Link to="/academics">B.Tech CSE Program</Link></li>
              <li><Link to="/admissions">Admissions</Link></li>
              <li><Link to="/placements">Placements</Link></li>
              <li><a href="https://www.iert.ac.in" target="_blank" rel="noreferrer">Main IERT Website</a></li>
            </ul>
          </div>

          {/* Explore */}
          <div className="footer-col">
            <h4 className="footer-heading">Explore</h4>
            <div className="footer-divider" />
            <ul className="footer-links">
              <li><Link to="/events">Events & News</Link></li>
              <li><Link to="/society">IERT CSE Society</Link></li>
              <li><Link to="/gallery">Photo Gallery</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="https://aktu.ac.in" target="_blank" rel="noreferrer">AKTU University</a></li>
              <li><a href="#" target="_blank" rel="noreferrer">Student Portal</a></li>
              <li><a href="#" target="_blank" rel="noreferrer">NAAC / AICTE</a></li>
            </ul>
          </div>

          {/* Stats */}
          <div className="footer-col">
            <h4 className="footer-heading">Department at a Glance</h4>
            <div className="footer-divider" />
            <div className="footer-stats">
              <div className="footer-stat"><span>2001</span><p>Established</p></div>
              <div className="footer-stat"><span>60</span><p>Intake / Year</p></div>
              <div className="footer-stat"><span>10+</span><p>Faculty</p></div>
              <div className="footer-stat"><span>500+</span><p>Alumni</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-developer-credit">
            Designed &amp; Developed by <a href="https://www.linkedin.com/in/sarthak-s-338609328/" target="_blank" rel="noopener noreferrer">Sarthak Singh</a> and <a href="https://www.linkedin.com/in/isha-k-55a695325/" target="_blank" rel="noopener noreferrer">Isha Kushwaha</a>
          </p>
          <p>© {new Date().getFullYear()} Department of CSE, IERT Prayagraj. All Rights Reserved.</p>
          <p>Affiliated with <strong>AKTU, Lucknow</strong> | Approved by <strong>AICTE, New Delhi</strong></p>
        </div>
      </div>
    </footer>
  );
}
