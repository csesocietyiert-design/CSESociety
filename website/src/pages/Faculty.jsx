import induSir from "../assets/faculty/indu-sir.jpeg";
import richaMaam from "../assets/faculty/richa-maam.jpeg";
import sp from "../assets/faculty/sp.jpeg";
import anoop from "../assets/faculty/anoop.jpeg";
import "./Faculty.css";

const faculty = [
  {
    id: 1,
    name: "Mr. Indu Bhushan Dubey",
    designation: "Assistant Professor",
    photo: induSir,
  },
  {
    id: 2,
    name: "Mrs. Richa Singh",
    designation: "Assistant Professor",
    photo: richaMaam,
  },
  {
    id: 3,
    name: "Mr. Satya Prakash Singh",
    designation: "Assistant Professor",
    photo: sp,
  },
  {
    id: 4,
    name: "Mrs. Anoop Srivastava",
    designation: "Assistant Professor",
    photo: anoop,
  },
];

export default function Faculty() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Faculty & Staff</h1>
          <p>Meet the experts shaping future engineers</p>
          <div className="breadcrumb">Home <span>›</span> Faculty</div>
        </div>
      </section>

      {/* Faculty Cards */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">OUR <span>FACULTY</span></h2>
          <div className="section-divider" />
          <p style={{ color: "var(--text-light)", marginBottom: 32, maxWidth: 620 }}>
            Our faculty members are highly qualified professionals from premier institutes, bringing
            a blend of academic expertise and industry experience to the classroom.
          </p>

          <div className="faculty-grid">
            {faculty.map((f) => (
              <div key={f.id} className="card faculty-card">
                <div className="faculty-photo-wrap">
                  {f.photo ? (
                    <img src={f.photo} alt={f.name} className="faculty-photo" />
                  ) : (
                    <div className="faculty-photo-placeholder">
                      👤<br />
                      <small>[ Add photo:<br />faculty/f{f.id}.jpg ]</small>
                    </div>
                  )}
                </div>
                <div className="faculty-info">
                  <h3>{f.name}</h3>
                  <p className="faculty-designation">{f.designation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
