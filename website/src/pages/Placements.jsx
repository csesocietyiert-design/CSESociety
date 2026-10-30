import { Phone, Mail, MapPin, Briefcase, CalendarDays } from "lucide-react";
import "./Placements.css";

const companies = [
  "TCS", "Infosys", "Wipro", "HCL Technologies", "Accenture",
  "Cognizant", "Tech Mahindra", "Hexaware", "Mindtree", "Netsmartz",
  "BYJU'S", "L&T Infotech", "Tata Power", "Capgemini", "Mphasis",
];

const placementStats = [
  { year: "2025-26", placed: "[ Fill ]", highest: "[ Fill ] LPA", average: "[ Fill ] LPA", companies: "[ Fill ]" },
  { year: "2024-25", placed: "[ Fill ]", highest: "[ Fill ] LPA", average: "[ Fill ] LPA", companies: "[ Fill ]" },
  { year: "2023-24", placed: "[ Fill ]", highest: "[ Fill ] LPA", average: "[ Fill ] LPA", companies: "[ Fill ]" },
];

const testimonials = [
  {
    name: "Alumni Name 1",
    batch: "B.Tech CSE, 2024",
    company: "TCS",
    quote: "IERT gave me the foundation I needed. The faculty was supportive and the labs helped me practice what I learned in class.",
    photo: null, // 
  },
  {
    name: "Alumni Name 2",
    batch: "B.Tech CSE, 2023",
    company: "Infosys",
    quote: "The placement cell at IERT prepared us very well through mock interviews and aptitude sessions. I'm grateful for the opportunity.",
    photo: null,
  },
  {
    name: "Alumni Name 3",
    batch: "B.Tech CSE, 2025",
    company: "HCL Technologies",
    quote: "The CSE curriculum at IERT is well-designed. The project work in final year helped me gain practical skills that companies look for.",
    photo: null,
  },
];

export default function Placements() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Placements</h1>
          <p>Career opportunities for CSE students at IERT Prayagraj</p>
          <div className="breadcrumb">Home <span>›</span> Placements</div>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container place-overview-grid">
          <div>
            <h2 className="section-title">PLACEMENT <span>OVERVIEW</span></h2>
            <div className="section-divider" />
            <p>
              The Placement Cell at IERT Prayagraj facilitates campus recruitment for all departments
              including Computer Science & Engineering. Students are prepared through aptitude training,
              mock interviews, group discussions, and technical workshops throughout their academic journey.
            </p>
            <p style={{ marginTop: 12 }}>
              Top companies like TCS, Infosys, HCL, Wipro, and Accenture regularly visit the campus
              for recruitment. The CSE department has a strong track record of placements with students
              achieving competitive packages.
            </p>
            <div className="place-quick-stats">
              <div className="place-stat-box">
                <h3>6+ LPA</h3><p>Median Package</p>
              </div>
              <div className="place-stat-box">
                <h3>15+</h3><p>Companies Visit</p>
              </div>
              <div className="place-stat-box">
                <h3>High</h3><p>Placement Rate</p>
              </div>
            </div>
          </div>
          <div className="place-img-placeholder">
            {/* */}
            [ Placement Drive Photo ]<br />
            <small>src/assets/placements.jpg</small>
          </div>
        </div>
      </section>

      {/* Year-wise Stats */}
      <section className="section stats-table-section">
        <div className="container">
          <h2 className="section-title">YEAR-WISE <span>STATISTICS</span></h2>
          <div className="section-divider" />
          <div className="stats-table-wrapper">
            <table className="stats-table">
              <thead>
                <tr>
                  <th>Academic Year</th>
                  <th>Students Placed</th>
                  <th>Highest Package</th>
                  <th>Average Package</th>
                  <th>Companies Visited</th>
                </tr>
              </thead>
              <tbody>
                {placementStats.map((row) => (
                  <tr key={row.year}>
                    <td><strong>{row.year}</strong></td>
                    <td>{row.placed}</td>
                    <td>{row.highest}</td>
                    <td>{row.average}</td>
                    <td>{row.companies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--gray)", marginTop: 12 }}>
            
          </p>
        </div>
      </section>

      {/* Recruiters */}
      <section className="section recruiters-section">
        <div className="container">
          <h2 className="section-title">OUR <span>RECRUITERS</span></h2>
          <div className="section-divider" />
          <p style={{ color: "var(--text-light)", marginBottom: 28 }}>
            Leading companies that have recruited from IERT CSE Department.
          </p>
          <div className="recruiters-grid">
            {companies.map((c) => (
              <div key={c} className="recruiter-logo card">
                <span>{c}</span>
                {/* src/assets/logos/{c.toLowerCase()}.png 
                     <img src={`/src/assets/logos/${c.toLowerCase()}.png`} alt={c} /> */}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section testimonials-section">
        <div className="container">
          <h2 className="section-title">ALUMNI <span>SPEAKS</span></h2>
          <div className="section-divider" />
          <div className="testimonials-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="card testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">{t.quote}</p>
                <div className="testimonial-author">
                  {t.photo ? (
                    <img src={t.photo} alt={t.name} className="testimonial-photo" />
                  ) : (
                    <div className="testimonial-photo-placeholder">👤</div>
                  )}
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-meta">{t.batch}</p>
                    <p className="testimonial-company"><Briefcase size={13} strokeWidth={2} /> {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placement Cell Contact */}
      <section className="section placement-contact-section">
        <div className="container">
          <h2 className="section-title">PLACEMENT <span>CELL</span></h2>
          <div className="section-divider" />
          <div className="placement-contact-grid">
            <div className="card place-contact-card">
              <h3><Phone size={18} strokeWidth={1.8} /> Contact Placement Cell</h3>
              <p>For campus recruitment inquiries and student placement details:</p>
              <div className="contact-details-list">
                <p><Mail size={13} strokeWidth={2} /> placement@iert.ac.in</p>
                <p><Phone size={13} strokeWidth={2} /> +91-532-2659-7135</p>
                <p><MapPin size={13} strokeWidth={2} /> Placement Cell Office, IERT, Prayagraj</p>
              </div>
              <a href="mailto:placement@iert.ac.in" className="btn btn-primary" style={{ marginTop: 16 }}>
                Contact Us
              </a>
            </div>
            <div className="card place-contact-card">
              <h3><Briefcase size={18} strokeWidth={1.8} /> For Recruiters</h3>
              <p>Interested in recruiting from IERT CSE Department? We welcome you on campus!</p>
              <div className="contact-details-list">
                <p><Mail size={13} strokeWidth={2} /> hr.partner@iert.ac.in</p>
                <p><Phone size={13} strokeWidth={2} /> +91-532-2659-7135</p>
                <p><CalendarDays size={13} strokeWidth={2} /> Placement Season: October – March</p>
              </div>
              <a href="mailto:hr.partner@iert.ac.in" className="btn btn-accent" style={{ marginTop: 16 }}>
                Partner With Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
