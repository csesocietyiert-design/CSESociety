import { Link } from "react-router-dom";
import {
  BookOpen, Briefcase, Newspaper, Users,
  GraduationCap, FlaskConical, Trophy, BookMarked,
  Calendar, Clock, MapPin,
} from "lucide-react";
import "./Home.css";

// ─── DATA ───────────────────────────────────────────────────────────────────
const stats = [
  { value: "2001", label: "Established" },
  { value: "60+", label: "Students / Year" },
  { value: "10+", label: "Faculty Members" },
  { value: "500+", label: "Alumni Placed" },
];

const highlights = [
  { Icon: GraduationCap, title: "B.Tech CSE", desc: "4-year degree affiliated to AKTU, Lucknow with 60 seats per year." },
  { Icon: FlaskConical, title: "Research & Labs", desc: "State-of-the-art computer labs with latest software and tools." },
  { Icon: Trophy, title: "Placements", desc: "Top recruiters include TCS, Infosys, Wipro, HCL and more." },
  { Icon: BookMarked, title: "Expert Faculty", desc: "Qualified faculty from premier institutes like MNNIT Allahabad." },
];

const latestNews = [
  {
    date: "June 2026",
    title: "IERTians Secure Top Placements in Campus Drive 2026",
    desc: "Multiple students from CSE department placed in top IT companies during the annual campus recruitment drive.",
    tag: "Placements",
  },
  {
    date: "May 2026",
    title: "Department Hosts National Seminar on AI & Machine Learning",
    desc: "Faculty and students participated in a two-day seminar on emerging trends in Artificial Intelligence.",
    tag: "Events",
  },
  {
    date: "April 2026",
    title: "Students Win Inter-College Hackathon 2026",
    desc: "CSE students bagged first prize at the inter-college coding competition held in Prayagraj.",
    tag: "Achievement",
  },
];

const latestResearch = [
  {
    img: null, // ⬇️ REPLACE: Add research image at src/assets/research1.jpg
    title: "Leading AI Models Excel at Basic Tasks, Lack Scientific Reasoning",
    desc: "Study by CSE faculty reveals gaps in AI logical reasoning abilities.",
  },
  {
    img: null, // ⬇️ REPLACE: Add research image at src/assets/research2.jpg
    title: "Mobile Apps Revealing Private Location Data — IIT Study Cited",
    desc: "Research on Android apps requiring precise location permissions and privacy risks.",
  },
];

const upcomingEvents = [
  { date: "June 17, 2026", title: "Project Presentation Day — Final Year B.Tech", time: "10:00 AM" },
  { date: "June 22, 2026", title: "Alumni Talk: Career in Data Science", time: "3:00 PM" },
  { date: "July 5, 2026", title: "Industrial Visit: IT Park Noida", time: "7:00 AM" },
];

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="home">

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-img-placeholder" />
        <div className="hero-overlay" />
        <div className="hero-content container">
          <div className="hero-identity">
            <img src="/src/assets/iert-logo.jpg" alt="IERT Logo" className="hero-logo" />
            <div className="hero-college-info">
              <span className="hero-college-name">Institute of Engineering and Rural Technology</span>
              <span className="hero-college-location">Prayagraj, Uttar Pradesh</span>
            </div>
          </div>
          <p className="hero-tag">Department of Computer Science & Engineering</p>
          <h1>Shaping Innovators.<br />Building the Digital Future.</h1>
          <p className="hero-sub">
            Welcome to CSE Department, IERT Prayagraj — An AICTE-approved, AKTU-affiliated
            institute committed to excellence in technical education since 2001.
          </p>
          <div className="hero-btns">
            <Link to="/about" className="btn btn-outline-white">
              Know More <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LOCATION + MAP ───────────────────────────────── */}
      <section className="location-strip">
        <div className="container location-grid">
          <div className="location-info">
            <h3 className="location-heading">
              <MapPin size={22} strokeWidth={1.8} className="location-pin-icon" />
              Find Us Here
            </h3>
            <p className="location-address">
              <strong>Department of Computer Science & Engineering</strong><br />
              Institute of Engineering and Rural Technology (IERT)<br />
              26, Chaitham Lines, Near Prayag Railway Station,<br />
              Prayagraj – 211002 (U.P.), India
            </p>
            <a
              href="https://maps.google.com/?q=Institute+of+Engineering+and+Rural+Technology+Prayagraj"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary location-dir-btn"
            >
              Get Directions →
            </a>
          </div>
          <div className="location-map">
            <iframe
              title="IERT Prayagraj Location"
              src="https://maps.google.com/maps?q=Institute+of+Engineering+and+Rural+Technology+Prayagraj+26+Chaitham+Lines&output=embed&z=15"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ── QUICK LINKS ──────────────────────────────────── */}
      <section className="quick-links-bar">
        <div className="container quick-links-grid">
          <Link to="/academics" className="quick-link research">
            <BookOpen size={30} strokeWidth={1.6} /><p>Academics</p>
          </Link>
          <Link to="/placements" className="quick-link startups">
            <Briefcase size={30} strokeWidth={1.6} /><p>Placements</p>
          </Link>
          <Link to="/events" className="quick-link news">
            <Newspaper size={30} strokeWidth={1.6} /><p>News & Events</p>
          </Link>
          <Link to="/faculty" className="quick-link faculty">
            <Users size={30} strokeWidth={1.6} /><p>Faculty</p>
          </Link>
        </div>
      </section>

      {/* ── ABOUT + DIRECTOR ─────────────────────────────── */}
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-text">
            <h2 className="section-title">ABOUT <span>CSE DEPARTMENT</span></h2>
            <div className="section-divider" />
            <p>
              The Computer Science and Engineering Department at IERT Prayagraj was established in
              2001. It runs a B.Tech degree program affiliated to Dr. A.P.J. Abdul Kalam Technical
              University (AKTU), Lucknow, approved by AICTE.
            </p>
            <p style={{ marginTop: 12 }}>
              With an intake of 60 students per year, the department maintains an excellent
              faculty-student ratio. Students are trained in Java, Python, C/C++, Web Technologies,
              and cutting-edge tools in AI, ML, and Data Science.
            </p>
            <div className="about-actions">
              <Link to="/about" className="btn btn-primary">Read More</Link>
              <a href="#" className="btn btn-outline">Newsletter</a>
            </div>
          </div>
          <div className="director-card">
            <h3>Director's <span>Corner</span></h3>
            <div className="section-divider" />
            <img
              src="/src/assets/director-photo.jpg"
              alt="Dr. Vimal Mishra"
              className="director-card-photo"
            />
            <p className="hod-name">Dr. Vimal Mishra</p>
            <p className="hod-desc">
              Director, Institute of Engineering and Rural Technology, Prayagraj.
              Ph.D. in Computer Engineering from IIT (BHU), Varanasi.
            </p>
            <Link to="/about" className="btn btn-outline" style={{ marginTop: 12 }}>Read More</Link>
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ─────────────────────────────────── */}
      <section className="stats-banner">
        {/* ⬇️ REPLACE: Background image at src/assets/stats-bg.jpg */}
        <div className="container stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <h2>{s.value}</h2>
              <p>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HIGHLIGHTS ───────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">ACADEMIC <span>UNITS</span></h2>
          <div className="section-divider" />
          <div className="highlights-grid">
            {highlights.map((h) => (
              <div key={h.title} className="card highlight-card">
                <div className="highlight-icon"><h.Icon size={38} strokeWidth={1.4} /></div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS + UPCOMING EVENTS ────────────────── */}
      <section className="section news-section">
        <div className="container news-events-grid">
          <div className="news-col">
            <div className="news-header">
              <h2 className="section-title">LATEST <span>NEWS</span></h2>
              <Link to="/events" className="btn btn-outline view-all-btn">VIEW ALL</Link>
            </div>
            <p className="sub-label">CAMPUS BULLETIN</p>
            <div className="section-divider" />
            <div className="news-list">
              {latestNews.map((n) => (
                <div key={n.title} className="news-item card">
                  <span className="tag">{n.tag}</span>
                  <p className="news-date">{n.date}</p>
                  <h4>{n.title}</h4>
                  <p className="news-desc">{n.desc}</p>
                  <Link to="/events" className="read-more">Read more →</Link>
                </div>
              ))}
            </div>
          </div>

          <div className="events-col">
            <div className="news-header">
              <h2 className="section-title">UPCOMING <span>EVENTS</span></h2>
              <Link to="/events" className="btn btn-outline view-all-btn">VIEW ALL</Link>
            </div>
            <p className="sub-label">PROGRAMS ON PLATTER</p>
            <div className="section-divider" />
            {upcomingEvents.map((e) => (
              <div key={e.title} className="event-item card">
                <div className="event-meta">
                  <span><Calendar size={13} strokeWidth={2} /> {e.date}</span>
                  <span><Clock size={13} strokeWidth={2} /> {e.time}</span>
                </div>
                <p className="event-title">{e.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO GALLERY PREVIEW ────────────────────────── */}
      <section className="section gallery-preview-section">
        <div className="container">
          <div className="news-header">
            <h2 className="section-title">PHOTO <span>GALLERY</span></h2>
            <Link to="/gallery" className="btn btn-outline view-all-btn">VIEW ALL</Link>
          </div>
          <p className="sub-label">GLIMPSES OF CAMPUS LIFE</p>
          <div className="section-divider" />
          <div className="gallery-preview-grid">
            {[
              { src: "/src/assets/gallery/student-assembly.jpg", alt: "Student Assembly" },
              { src: "/src/assets/gallery/campus-view.jpg",      alt: "Campus View" },
              { src: "/src/assets/gallery/iert-garden.webp",     alt: "IERT Garden" },
              { src: "/src/assets/gallery/campus-building.jpg",  alt: "Department Building" },
              { src: "/src/assets/gallery/classroom-1.jpg",      alt: "CSE Classroom" },
              { src: "/src/assets/gallery/library.webp",         alt: "IERT Library" },
              { src: "/src/assets/gallery/campus-courtyard.avif",alt: "Campus Courtyard" },
              { src: "/src/assets/gallery/horizon-event.jpg",    alt: "HORIZON Cultural Fest" },
            ].map((photo) => (
              <Link to="/gallery" key={photo.alt} className="gallery-thumb">
                <img src={photo.src} alt={photo.alt} className="gallery-preview-img" />
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
