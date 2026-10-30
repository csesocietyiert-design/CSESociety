import { useState, useEffect, useRef } from "react";
import { Target, Rocket, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import "./About.css";

const deptPhotos = [
  { src: "/src/assets/dept-photo-1.jpg", caption: "CSE Seminar Hall" },
  { src: "/src/assets/dept-photo-2.webp", caption: "Campus Grounds" },
  { src: "/src/assets/dept-photo-3.webp", caption: "Second Year Block" },
];

function DeptPhotoSlider() {
  const [current, setCurrent] = useState(0);
  const timer = useRef(null);
  const total = deptPhotos.length;

  const goTo = (i) => setCurrent((i + total) % total);

  useEffect(() => {
    timer.current = setInterval(() => setCurrent((c) => (c + 1) % total), 3500);
    return () => clearInterval(timer.current);
  }, []);

  const handleNav = (dir) => {
    clearInterval(timer.current);
    goTo(current + dir);
    timer.current = setInterval(() => setCurrent((c) => (c + 1) % total), 3500);
  };

  return (
    <div className="dept-slider">
      {deptPhotos.map((p, i) => (
        <div key={i} className={`dept-slide ${i === current ? "active" : ""}`}>
          <img src={p.src} alt={p.caption} />
          <div className="dept-slide-caption">{p.caption}</div>
        </div>
      ))}
      <button className="dept-btn dept-prev" onClick={() => handleNav(-1)} aria-label="Previous">
        <ChevronLeft size={18} strokeWidth={2.5} />
      </button>
      <button className="dept-btn dept-next" onClick={() => handleNav(1)} aria-label="Next">
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
      <div className="dept-dots">
        {deptPhotos.map((_, i) => (
          <button
            key={i}
            className={`dept-dot ${i === current ? "active" : ""}`}
            onClick={() => { clearInterval(timer.current); goTo(i); }}
          />
        ))}
      </div>
    </div>
  );
}

const visionPoints = [
  "To produce Creators of Intelligent Innovative Technology.",
  "To impart knowledge in state-of-the-art Computer Science & Engineering with strong theoretical fundamentals.",
  "To participate in R&D processes with industry and academia.",
  "To promote quality research and innovation.",
];

const milestones = [
  { year: "1955", event: "IERT established as Civil Engineering School" },
  { year: "1962", event: "UP Government takes over the institute" },
  { year: "2001", event: "B.Tech CSE Department established" },
  { year: "2005", event: "AICTE approval for B.Tech programs" },
  { year: "2010", event: "Affiliation to AKTU, Lucknow" },
  { year: "2024", event: "State-of-the-art computer lab expansion" },
];

export default function About() {
  const [directorExpanded, setDirectorExpanded] = useState(false);
  return (
    <div>
      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <h1>About the Department</h1>
          <p>Computer Science & Engineering — IERT Prayagraj</p>
          <div className="breadcrumb">
            Home <span>›</span> About Department
          </div>
        </div>
      </section>

      {/* About Intro */}
      <section className="section">
        <div className="container about-intro-grid">
          <div>
            <h2 className="section-title">ABOUT <span>IERT CSE</span></h2>
            <div className="section-divider" />
            <p>
              The Computer Science and Engineering Department at the Institute of Engineering and
              Rural Technology (IERT), Prayagraj was established in 2001. It runs a B.Tech degree
              program in Computer Science and Engineering, affiliated to Dr. A.P.J. Abdul Kalam
              Technical University (AKTU), Lucknow and approved by AICTE, New Delhi.
            </p>
            <p style={{ marginTop: 14 }}>
              With an annual intake of 60 students, the department maintains an excellent
              faculty-student ratio as per AICTE norms. The department continuously strives to
              build advanced infrastructure with state-of-the-art technology to meet the demands
              of the ever-evolving IT industry.
            </p>
            <p style={{ marginTop: 14 }}>
              Students are trained in modern programming languages and technologies including Java,
              Python, C/C++, Visual Basic, HTML/XML/DHTML, JavaScript, and various web and mobile
              development frameworks. Theory lectures are supplemented with lab experiments,
              assignments, and regular assessments to ensure comprehensive learning.
            </p>
          </div>
          <div>
            <DeptPhotoSlider />
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section vision-section">
        <div className="container">
          <h2 className="section-title">VISION & <span>MISSION</span></h2>
          <div className="section-divider" />
          <div className="vision-grid">
            <div className="vision-box">
              <div className="vision-icon"><Target size={40} strokeWidth={1.4} /></div>
              <h3>Vision</h3>
              <p>
                To be a globally acclaimed department in Technical Education and research that
                provides transformative education to create innovators and leaders serving the
                betterment of society and humanity at large.
              </p>
            </div>
            <div className="mission-box">
              <div className="vision-icon"><Rocket size={40} strokeWidth={1.4} /></div>
              <h3>Mission</h3>
              <ul>
                {visionPoints.map((v) => (
                  <li key={v}>
                    <CheckCircle size={16} strokeWidth={2} className="check" /> {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Director's Corner */}
      <section className="section hod-section">
        <div className="container hod-grid">
          <div className="hod-photo-box">
            <img
              src="/src/assets/director-photo.jpg"
              alt="Dr. Vimal Mishra"
              className="director-photo"
            />
            <p className="hod-name">Dr. Vimal Mishra</p>
            <p className="hod-designation">Director</p>
            <p className="hod-designation">IERT, Prayagraj</p>
          </div>
          <div className="hod-message">
            <h2 className="section-title">DIRECTOR's <span>MESSAGE</span></h2>
            <div className="section-divider" />
            <p>
              Welcome to the Department of Computer Science and Engineering at IERT Prayagraj.
              Our department has been steadily growing since its establishment in 2001, and we
              take pride in producing skilled engineers who excel in both industry and research.
            </p>
            {directorExpanded && (
              <div className="director-expanded">
                <p style={{ marginTop: 14 }}>
                  <strong>Dr. Vimal Mishra</strong> is the Director of the Institute of Engineering
                  and Rural Technology (IERT), Prayagraj, and a distinguished academician with
                  extensive experience in technical education, research, and institutional leadership.
                  He holds a B.Tech. and M.Tech. in Computer Science and Engineering from Kamla Nehru
                  Institute of Technology and earned his Ph.D. in Computer Engineering from IIT (BHU),
                  Varanasi.
                </p>
                <p style={{ marginTop: 14 }}>
                  With over two decades of experience in teaching, research, and academic
                  administration, Dr. Mishra has made significant contributions to the fields of
                  computational linguistics, cloud computing, e-learning systems, sentiment analysis,
                  and recommendation systems.
                </p>
                <p style={{ marginTop: 14 }}>
                  As the Director of IERT, Dr. Mishra is committed to fostering academic excellence,
                  innovation, and holistic student development. Under his leadership, the institute
                  continues to strengthen its legacy of quality technical education while preparing
                  students to meet the challenges of a rapidly evolving technological world.
                </p>
                <p style={{ marginTop: 14 }}>
                  His vision emphasizes the development of technically competent, ethically
                  responsible, and socially conscious professionals who can contribute meaningfully
                  to society and industry. Through his dedication to education, research, and
                  institutional growth, Dr. Mishra continues to inspire students, faculty, and the
                  broader academic community.
                </p>
              </div>
            )}
            <button
              className="btn btn-outline director-read-more"
              onClick={() => setDirectorExpanded(!directorExpanded)}
              style={{ marginTop: 18 }}
            >
              {directorExpanded ? "Read Less ↑" : "Read More ↓"}
            </button>
            <p className="hod-sign">— Dr. Vimal Mishra, Director, IERT Prayagraj</p>
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="section milestones-section">
        <div className="container">
          <h2 className="section-title">OUR <span>JOURNEY</span></h2>
          <div className="section-divider" />
          <div className="milestones-timeline">
            {milestones.map((m, i) => (
              <div key={m.year} className={`milestone-item ${i % 2 === 0 ? "left" : "right"}`}>
                <div className="milestone-dot" />
                <div className="milestone-card card">
                  <span className="milestone-year">{m.year}</span>
                  <p>{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Institute Info */}
      <section className="section institute-info-section">
        <div className="container">
          <h2 className="section-title">INSTITUTE <span>INFORMATION</span></h2>
          <div className="section-divider" />
          <div className="info-grid">
            {[
              { label: "Institute", value: "Institute of Engineering and Rural Technology (IERT)" },
              { label: "Location", value: "26, Chaitham Lines, Prayagraj - 211002 (U.P.)" },
              { label: "Established", value: "1955 (CSE Dept: 2001)" },
              { label: "Affiliation", value: "Dr. A.P.J. Abdul Kalam Technical University (AKTU), Lucknow" },
              { label: "Approval", value: "AICTE, New Delhi" },
              { label: "Type", value: "Government-aided Self-Finance Institute" },
              { label: "Intake (CSE)", value: "60 Students per year" },
              { label: "Duration", value: "4 Years (B.Tech)" },
            ].map((item) => (
              <div key={item.label} className="info-row">
                <span className="info-label">{item.label}</span>
                <span className="info-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
