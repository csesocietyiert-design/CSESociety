import { useState } from "react";
import lab1Image from "../assets/academics/lab-1.jpeg";
import lab2Image from "../assets/academics/lab-2.jpeg";
import "./Academics.css";

const semesters = [
  {
    sem: "Semester 1",
    subjects: ["Engineering Mathematics I", "Engineering Physics", "Programming for Problem Solving", "Basic Electrical Engg.", "Environment And Ecology", "Workshop Practice Lab"],
  },
  {
    sem: "Semester 2",
    subjects: ["Engineering Mathematics II", "Chemistry", "Basic Electronics Engineering", "Fundamentals of Mechanical Engineering", "Engineering Graphics and Design Lab", "Soft Skills"],
  },
  {
    sem: "Semester 3",
    subjects: ["Discrete Mathematics", "Computer Architecture", "Data Structures", "Engineering Mathematics IV", "Technical Communication", "Cyber Security"],
  },
  {
    sem: "Semester 4",
    subjects: ["Theory of Computation", "Operating System", "Digital Electronics", "Python Programming", "Object Oriented Programming (Java)", "Universal Human Values and Professional Ethics"],
  },
  {
    sem: "Semester 5",
    subjects: ["Database Management Systems", "Design and Analysis of Algorithms", "Web Technology", "Computer Graphics", "Machine Learning Techniques", "Constitution of India"],
  },
  {
    sem: "Semester 6",
    subjects: ["Software Engineering", "Compiler Design", "Blockchain Architectural Design", "Computer Based Numerical Techniques", "Essence of Indian Traditional Knowledge"],
  },
  {
    sem: "Semester 7",
    subjects: ["Artificial Intelligence", "Cloud Computing", "Renewable Energy Resources"],
  },
  {
    sem: "Semester 8",
    subjects: ["Natural Langauge Processing", "Data Warehousimg and Data Mining", "Project - II"],
  },
];

const labs = [
  { icon: "🖥️", name: "Programming Lab", desc: "60+ high-performance computers with latest OS and compilers. Languages: Java, Python, C/C++." },
  { icon: "🌐", name: "Networking Lab", desc: "Cisco routers, switches, and network simulation tools for hands-on networking experience." },
  { icon: "🤖", name: "AI & ML Lab", desc: "GPU-enabled workstations with TensorFlow, PyTorch, and Scikit-learn for ML experiments." },
  { icon: "🗄️", name: "Database Lab", desc: "Oracle, MySQL, PostgreSQL database servers for practical database management training." },
  { icon: "📱", name: "Project Lab", desc: "Dedicated space for final-year projects, IoT kits, Raspberry Pi, and Arduino boards." },
  { icon: "📚", name: "Department Library", desc: "Collection of 1000+ books on CS/IT, journals, and digital resources for students." },
];

export default function Academics() {
  const [openSem, setOpenSem] = useState(0);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Academics</h1>
          <p>B.Tech Computer Science & Engineering Program</p>
          <div className="breadcrumb">Home <span>›</span> Academics</div>
        </div>
      </section>

      {/* Program Overview */}
      <section className="section">
        <div className="container prog-overview-grid">
          <div>
            <h2 className="section-title">B.TECH <span>CSE PROGRAM</span></h2>
            <div className="section-divider" />
            <p>
              The B.Tech in Computer Science and Engineering is a 4-year undergraduate program
              affiliated to AKTU, Lucknow and approved by AICTE, New Delhi. The program is designed
              to provide students with strong theoretical foundations combined with practical
              hands-on experience.
            </p>
            <div className="prog-facts">
              {[
                ["Duration", "4 Years (8 Semesters)"],
                ["Intake", "60 Students / Year"],
                ["Affiliation", "AKTU, Lucknow"],
                ["Approval", "AICTE, New Delhi"],
                ["Degree", "Bachelor of Technology (B.Tech)"],
              ].map(([k, v]) => (
                <div key={k} className="prog-fact-row">
                  <span className="prog-fact-key">{k}</span>
                  <span className="prog-fact-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="facility-photo-grid">
            <figure className="facility-photo-card">
              <img src={lab1Image} alt="Lab 1" className="facility-photo" />
              <figcaption>Lab 1</figcaption>
            </figure>
            <figure className="facility-photo-card">
              <img src={lab2Image} alt="Lab 2" className="facility-photo" />
              <figcaption>Lab 2</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="section curriculum-section" id="curriculum">
        <div className="container">
          <h2 className="section-title">CURRICULUM & <span>SYLLABUS</span></h2>
          <div className="section-divider" />
          <p style={{ color: "var(--text-light)", marginBottom: 28, maxWidth: 600 }}>
            The curriculum follows AKTU guidelines and is regularly updated to match industry requirements.
          </p>
          <div className="curriculum-accordion">
            {semesters.map((s, i) => (
              <div key={s.sem} className={`accordion-item ${openSem === i ? "open" : ""}`}>
                <button className="accordion-header" onClick={() => setOpenSem(openSem === i ? -1 : i)}>
                  <span>{s.sem}</span>
                  <span className="accordion-arrow">{openSem === i ? "▲" : "▼"}</span>
                </button>
                {openSem === i && (
                  <div className="accordion-body">
                    {s.subjects.map((subj) => (
                      <div key={subj} className="subject-chip">📘 {subj}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <a href="/cse-syllabus-aktu.pdf" download="CSE_Syllabus_AKTU.pdf" className="btn btn-primary">
              ⬇ Download Full Syllabus (AKTU)
            </a>
          </div>
        </div>
      </section>

      {/* Labs */}
      <section className="section labs-section" id="labs">
        <div className="container">
          <h2 className="section-title">LABS & <span>INFRASTRUCTURE</span></h2>
          <div className="section-divider" />
          <div className="labs-grid">
            {labs.map((lab) => (
              <div key={lab.name} className="card lab-card">
                <div className="lab-icon">{lab.icon}</div>
                <h3>{lab.name}</h3>
                <p>{lab.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Calendar */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">ACADEMIC <span>CALENDAR</span></h2>
          <div className="section-divider" />
          <div className="cal-table-wrapper">
            <table className="cal-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Odd Semester (Jul–Dec)</th>
                  <th>Even Semester (Jan–May)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Classes Begin", "July 14", "January 7"],
                  ["Mid-Semester Exam", "September", "March"],
                  ["Practical Exams", "December", "May"],
                  ["End Semester Exam", "December", "May"],
                  ["Result Declaration", "January", "July"],
                  ["Vacation", "December–January", "June–July"],
                ].map(([e, odd, even]) => (
                  <tr key={e}>
                    <td>{e}</td>
                    <td>{odd}</td>
                    <td>{even}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--gray)", marginTop: 12 }}>
            * Exact dates are declared by AKTU. Please check the official AKTU website for latest schedule.
          </p>
          <div style={{ marginTop: 20 }}>
            <a href="/academic-calendar.pdf" download="Academic_Calendar_IERT_2025-26.pdf" className="btn btn-primary">
              ⬇ Download Academic Calendar
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
