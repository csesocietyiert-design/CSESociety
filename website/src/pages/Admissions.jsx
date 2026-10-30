import { GraduationCap } from "lucide-react";
import "./Admissions.css";

const steps = [
  { step: "01", title: "Check Eligibility", desc: "Passed 10+2 with Physics, Chemistry, and Mathematics with minimum 45% marks (40% for reserved categories)." },
  { step: "02", title: "Appear in JEE Mains", desc: "Register and appear in JEE Mains Exam conducted by NTA." },
  { step: "03", title: "UPTAC Counselling", desc: "Participate in centralized counselling (UPTAC) conducted by AKTU based on JEE rank." },
  { step: "04", title: "Document Verification", desc: "Submit required documents at the college admission office for verification at the time of college counselling date (Given by the college)." },
  { step: "05", title: "Fee Payment", desc: "Pay the prescribed annual fee to complete your admission process." },
  { step: "06", title: "Attend Orientation", desc: "Attend the orientation program and receive your timetable and course details." },
];

const docs = [
  "10th Mark Sheet & Certificate",
  "12th Mark Sheet & Certificate",
  "JEE Mains Rank Card",
  "Counselling Allotment Letter",
  "Category Certificate (if applicable)",
  "Domicile Certificate",
  "Character Certificate",
  "Passport Size Photographs (6 nos.)",
  "Aadhaar Card",
  "Gap Year (if applicable)",
  "Anti Ragging",
  "Migration/Transfer Certificate (if applicable)",
];

export default function Admissions() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Admissions</h1>
          <p>Join the Department of Computer Science & Engineering</p>
          <div className="breadcrumb">Home <span>›</span> Admissions</div>
        </div>
      </section>

      {/* Overview */}
      <section className="section">
        <div className="container adm-overview-grid">
          <div>
            <h2 className="section-title">ADMISSION <span>OVERVIEW</span></h2>
            <div className="section-divider" />
            <p>
              Admissions to the B.Tech Computer Science & Engineering program at IERT Prayagraj
              are based on merit in the JEE Mains exam conducted by
              National Testing Agency (NTA), Lucknow.
            </p>
            <p style={{ marginTop: 12 }}>
              The total intake is <strong>60 students per year</strong>. Seats are allocated as
              per UP government reservation policy including SC/ST/OBC/EWS categories.
            </p>
            <div className="adm-highlights">
              <div className="adm-highlight-box">
                <h3>60</h3><p>Total Seats</p>
              </div>
              <div className="adm-highlight-box">
                <h3>45%</h3><p>Min. 12th % (Gen)</p>
              </div>
              <div className="adm-highlight-box">
                <h3>JEE Mains</h3><p>Entrance Exam</p>
              </div>
              <div className="adm-highlight-box">
                <h3>4 Yr</h3><p>Program Duration</p>
              </div>
            </div>
          </div>
          <div className="adm-image-wrap">
            <img
              src="/src/assets/admissions/campus-admission.jpeg"
              alt="Campus admission photo"
              className="adm-photo"
            />
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section className="section steps-section">
        <div className="container">
          <h2 className="section-title">HOW TO <span>APPLY</span></h2>
          <div className="section-divider" />
          <div className="steps-grid">
            {steps.map((s) => (
              <div key={s.step} className="step-card card">
                <div className="step-number">{s.step}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Structure */}
      <section className="section fee-section">
        <div className="container">
          <h2 className="section-title">FEE <span>STRUCTURE</span></h2>
          <div className="section-divider" />
          <p style={{ color: "var(--text-light)", marginBottom: 24, fontSize: "0.9rem" }}>
            * Fee is subject to change as per AKTU/Government norms. Contact the admissions office for the latest fee details.
          </p>
          <div className="fee-table-wrapper">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Fee Component</th>
                  <th>Amount (Approx.)</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Tuition Fee", "₹ 58,500", "Annually"],
                  ["Examination Fee", "₹ 7,500", "Annually"],
                  ["Library Fee", "₹ [Contact Office]", "Per Year"],
                  ["Lab Fee", "₹ [Contact Office]", "Per Semester"],
                  ["Development Fee", "₹ [Contact Office]", "Per Year"],
                  ["Hostel Fee (Boys/Girls)", "₹ 22,500", "Per Year"],
                  ["Hostel Mess Fee ", "₹ 4,000", "Per Month"],
                ].map(([comp, amt, freq]) => (
                  <tr key={comp}>
                    <td>{comp}</td>
                    <td>{amt}</td>
                    <td>{freq}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--gray)", marginTop: 12 }}>
             Contact: +91-532-2659-7135
          </p>
        </div>
      </section>

      {/* Documents Required */}
      <section className="section docs-section">
        <div className="container docs-grid">
          <div>
            <h2 className="section-title">DOCUMENTS <span>REQUIRED</span></h2>
            <div className="section-divider" />
            <ul className="docs-list">
              {docs.map((d) => (
                <li key={d}><span className="doc-icon">📄</span> {d}</li>
              ))}
            </ul>
          </div>
          <div className="important-dates">
            <h3>Important Dates</h3>
            <div className="date-list">
              {[
                
                ["Counselling Begins", "June – July"],
                ["Classes Start", "July / August"],
              ].map(([event, date]) => (
                <div key={event} className="date-row">
                  <span className="date-event">{event}</span>
                  <span className="date-val">{date}</span>
                </div>
              ))}
            </div>
            <div className="adm-contact-box">
              <h4>Admission Enquiry</h4>
              <p>+91-532-2659-7135</p>
              <p>cse@iert.ac.in</p>
              <p>Mon–Sat: 10 AM – 5 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Scholarships */}
      <section className="section scholarship-section">
        <div className="container">
          <h2 className="section-title">SCHOLARSHIPS & <span>FINANCIAL AID</span></h2>
          <div className="section-divider" />
          <div className="scholarship-grid">
            {[
              { name: "UP State Government Scholarship", desc: "For SC/ST/OBC students based on family income. Apply via UP Scholarship Portal." },
              { name: "EWS Scholarship", desc: "For Economically Weaker Section students. Apply via the college scholarship committee." },
              { name: "Merit Scholarship", desc: "For students with exceptional academic performance. Contact the college academic office." },
              { name: "National Scholarship Portal", desc: "Various central government scholarships available. Visit scholarships.gov.in for details." },
            ].map((s) => (
              <div key={s.name} className="card scholarship-card">
                <h3><GraduationCap size={16} strokeWidth={1.8} /> {s.name}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
