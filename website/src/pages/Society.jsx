import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Users,
  Target,
  Handshake,
  Microscope,
  Sparkles,
  FileText,
  Briefcase,
  GraduationCap,
  MessageSquareText,
  Lightbulb,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import "./Society.css";

const objectives = [
  {
    icon: Handshake,
    title: "Technical Cooperation",
    desc: "Promoting technical cooperation, professional development and a spirit of unity among students.",
  },
  {
    icon: Microscope,
    title: "Academic & Technical Activities",
    desc: "Organizing academic, technical, cultural and extracurricular activities including seminars and workshops for holistic development.",
  },
  {
    icon: BookOpen,
    title: "Knowledge Exchange",
    desc: "Providing access to academic, technical and professional magazines, journals, newsletters and relevant publications.",
  },
  {
    icon: Users,
    title: "Peer Learning",
    desc: "Facilitating peer learning, mentorship and knowledge exchange among students.",
  },
  {
    icon: Sparkles,
    title: "Continuous Growth",
    desc: "Pursuing additional objectives decided by the Society from time to time.",
  },
];

const executiveCommittee = [
  {
    name: "Yatharth Baranwal",
    position: "President",
    photo: null,
    responsibility: "Leads Society initiatives and represents the Society in departmental forums.",
  },
  {
    name: "Pushpendra Kumar Maurya",
    position: "Vice President",
    photo: null,
    responsibility: "Supports the President and assists in carrying out Society responsibilities.",
  },
  {
    name: "Vibhanshu Tiwari",
    position: "General Secretary",
    photo: null,
    responsibility: "Coordinates meetings, records, communication and Society activities.",
  },
  {
    name: "Siddharth Sahu",
    position: "Treasurer",
    photo: null,
    responsibility: "Maintains Society financial records and oversees expenditures in line with the bylaws.",
  },
  {
    name: "Sarthak Singh",
    position: "Technical Secretary",
    photo: null,
    responsibility: "Coordinates technical activities, seminars, workshops and competitions.",
  },
  {
    name: "Aditya Singh",
    position: "Cultural Secretary",
    photo: null,
    responsibility: "Coordinates cultural and extracurricular activities for student engagement.",
  },
  {
    name: "Kirti Singh",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
  {
    name: "Yashasvi Maurya",
    position: "Year Representative",
    photo: null,
    responsibility: "Supports Society activities and facilitates student participation.",
  },
  {
    name: "Ojas Singh",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
  {
    name: "Ayush Patel",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
  {
    name: "Ambuj Singh",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
  {
    name: "Nikhil",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
  {
    name: "Kaushiki",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
  {
    name: "Khushi Pandey",
    position: "Year Representative",
    photo: null,
    responsibility: "Represents student concerns and helps communicate Society information.",
  },
];

const roles = [
  {
    title: "President",
    summary: "Presides over Society meetings and ensures the Society objectives are pursued.",
    points: [
      "Presides over Society meetings and deliberations.",
      "Ensures Society objectives are pursued effectively.",
      "Represents the Society before relevant authorities and bodies.",
      "Oversees Society activities and promotes collaborative participation.",
    ],
  },
  {
    title: "Vice President",
    summary: "Supports the President and assists in effective implementation of Society decisions.",
    points: [
      "Assists the President in managing Society affairs.",
      "Performs delegated responsibilities as assigned.",
      "Supports implementation of decisions taken by the Society.",
      "Helps coordinate activities and communication.",
    ],
  },
  {
    title: "General Secretary",
    summary: "Coordinates meetings, records and communication for the Society.",
    points: [
      "Coordinates Society meetings and related arrangements.",
      "Maintains records, minutes and important communications.",
      "Coordinates Society activities and keeps members informed.",
      "Supports smooth execution of Society initiatives.",
    ],
  },
  {
    title: "Cultural Secretary",
    summary: "Coordinates cultural and extracurricular activities.",
    points: [
      "Coordinates cultural activities and student engagement programs.",
      "Supports extracurricular initiatives aligned with the Society’s aims.",
      "Encourages participation in creative and community-focused activities.",
    ],
  },
  {
    title: "Technical Secretary",
    summary: "Coordinates technical activities, workshops, seminars and competitions.",
    points: [
      "Coordinates technical activities and learning initiatives.",
      "Supports seminars, workshops and technical competitions.",
      "Encourages knowledge sharing and skill development.",
    ],
  },
  {
    title: "Treasurer",
    summary: "Handles Society financial records and expenditures according to the bylaws.",
    points: [
      "Maintains financial records of the Society.",
      "Oversees expenditures and fund usage according to the bylaws.",
      "Supports transparent financial administration.",
    ],
  },
  {
    title: "Year Representative",
    summary: "Represents student concerns and supports Society engagement.",
    points: [
      "Represents student concerns to the Society leadership.",
      "Communicates Society information to members.",
      "Assists in organizing Society activities and participation.",
    ],
  },
];

const activities = [
  {
    type: "Technical",
    title: "Society Induction & Tech Talk",
    date: "Oct 2026 (2nd Sat)",
    details: "Welcome meet, Git/GitHub & Open-Source setup (PPT Hall) · Only 1st and 2nd year.",
  },
  {
    type: "Sports (Mind)",
    title: "Inter-Branch Chess Championship",
    date: "Oct 2026 (5th Sat)",
    details: "Swiss-league tournament, trophies & certificates (Auditorium).",
  },
  {
    type: "Technical",
    title: "Winter Code-Rush",
    date: "Nov 2026 (1st Sat)",
    details: "4-hour algorithmic contest on HackerRank (DSA) (Computer Lab).",
  },
  {
    type: "Sports",
    title: "Table Tennis Smash Tournament",
    date: "Feb 2027 (2nd Sat)",
    details: "Singles & Doubles knockout fixtures (Sports Room, PPT Hall).",
  },
  {
    type: "Technical (Flagship)",
    title: "Flagship Hack-a-Day (12 Hrs)",
    date: "Feb 2027 (4th Sat)",
    details: "Full-day hackathon, project judging & prizes (PPT Hall).",
  },
  {
    type: "Cultural",
    title: "Cultural Event",
    date: "Mar 2027 (3rd Sat)",
    details: "Music, open mic, tech skits, DJ/sound, snacks (PPT Hall).",
  },
  {
    type: "Valedictory",
    title: "Annual Awards & Project Expo",
    date: "Apr 2027 (2nd Sat)",
    details: "End tenure rewards (participation & honors) (PPT Hall).",
  },
];

const galleryItems = [
  { title: "Society Meetings", category: "Meetings", placeholder: true },
  { title: "Workshops", category: "Workshops", placeholder: true },
  { title: "Seminars", category: "Seminars", placeholder: true },
  { title: "Competitions", category: "Competitions", placeholder: true },
];

const documents = [
  {
    title: "Society Bylaws",
    desc: "Official bylaws and organizational framework of the IERT CSE Society.",
    status: "Official document to be uploaded",
  },
];

export default function Society() {
  const [openRole, setOpenRole] = useState(0);

  return (
    <div className="society-page">
      <section className="page-hero">
        <div className="container">
          <h1>IERT CSE Society</h1>
          <p>Department of Computer Science & Engineering · Institute of Engineering and Rural Technology · Prayagraj</p>
          <div className="breadcrumb">
            Home <span>›</span> Society
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-society-grid">
          <div>
            <h2 className="section-title">ABOUT <span>THE SOCIETY</span></h2>
            <div className="section-divider" />
            <p className="society-intro">
              The IERT CSE Society is a student society of the Department of Computer Science & Engineering. It represents CSE students and works to promote technical cooperation, professional development, peer learning, mentorship, knowledge exchange and holistic student development within the department.
            </p>
            <p className="society-intro">
              The Society is intended to strengthen the academic and professional ecosystem of the department by encouraging collaboration, participation and continuous growth among students.
            </p>
            <div className="society-actions">
              <Link to="/contact" className="btn btn-primary">Contact Department</Link>
            </div>
          </div>

          <div className="society-card society-info-card">
            <h3>Society Information</h3>
            <div className="society-card-divider" />
            <div className="info-row">
              <span className="info-label">Society</span>
              <span className="info-value">IERT CSE Society</span>
            </div>
            <div className="info-row">
              <span className="info-label">Department</span>
              <span className="info-value">Computer Science & Engineering</span>
            </div>
            <div className="info-row">
              <span className="info-label">Institution</span>
              <span className="info-value">Institute of Engineering and Rural Technology</span>
            </div>
            <div className="info-row">
              <span className="info-label">Location</span>
              <span className="info-value">Prayagraj</span>
            </div>
            <div className="info-row">
              <span className="info-label">Membership</span>
              <span className="info-value">Regular Members · Honorary Members</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section society-alt-section">
        <div className="container">
          <h2 className="section-title">AIMS & <span>OBJECTIVES</span></h2>
          <div className="section-divider" />
          <div className="society-objectives-grid">
            {objectives.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="card society-objective-card">
                  <div className="society-icon-wrap">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">MEMBERSHIP</h2>
          <div className="section-divider" />
          <div className="society-membership-grid">
            <div className="card society-card society-membership-card">
              <h3>Regular Members</h3>
              <p>All bona fide students of the CSE Department whose names appear on the official Institute Roll List.</p>
            </div>
            <div className="card society-card society-membership-card">
              <h3>Honorary Members</h3>
              <p>Faculty members of the CSE Department.</p>
              <p className="membership-note">
                As per the Society bylaws, the annual membership fee for regular members is Rs. 300. Honorary members are exempt from the fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">EXECUTIVE <span>COMMITTEE</span></h2>
          <div className="section-divider" />
          <p className="society-section-intro">The current elected committee members are displayed below.</p>
          <div className="society-member-grid">
            {executiveCommittee.map((member) => (
              <div key={member.name} className="card society-member-card">
                <div className="society-member-photo">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} />
                  ) : (
                    <span>{member.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
                  )}
                </div>
                <h3>{member.name}</h3>
                <p className="society-member-role">{member.position}</p>
                <p className="society-member-responsibility">{member.responsibility}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section society-alt-section">
        <div className="container">
          <h2 className="section-title">ROLES & <span>RESPONSIBILITIES</span></h2>
          <div className="section-divider" />
          <div className="society-accordion-list">
            {roles.map((role, index) => (
              <div key={role.title} className={`society-accordion-item ${openRole === index ? "open" : ""}`}>
                <button
                  className="society-accordion-trigger"
                  onClick={() => setOpenRole(openRole === index ? -1 : index)}
                  aria-expanded={openRole === index}
                >
                  <span>{role.title}</span>
                  <ChevronDown size={18} strokeWidth={2} />
                </button>
                {openRole === index && (
                  <div className="society-accordion-body">
                    <p>{role.summary}</p>
                    <ul>
                      {role.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">ACTIVITIES, SEMINARS & <span>WEBINARS</span></h2>
          <div className="section-divider" />
          <div className="society-activity-grid">
            {activities.map((item) => (
              <div key={item.title} className="card society-activity-card">
                <div className="society-icon-wrap">
                  <CalendarDays size={20} strokeWidth={1.8} />
                </div>
                <span className="society-activity-type">{item.type}</span>
                <h3>{item.title}</h3>
                <p className="society-activity-date">{item.date}</p>
                <p>{item.details}</p>
              </div>
            ))}
          </div>
          
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">SOCIETY <span>DOCUMENTS</span></h2>
          <div className="section-divider" />
          <div className="society-document-grid">
            {documents.map((doc) => (
              <div key={doc.title} className="card society-document-card">
                <div className="society-icon-wrap">
                  <FileText size={24} strokeWidth={1.8} />
                </div>
                <h3>{doc.title}</h3>
                <p>{doc.desc}</p>
                <div className="society-doc-actions">
                  <a href="/society-bylaws.pdf" target="_blank" rel="noreferrer" className="btn btn-outline">View PDF</a>
                  <a href="/society-bylaws.pdf" download="IERT_CSE_Society_Bylaws.pdf" className="btn btn-primary">Download</a>
                </div>
                <p className="society-doc-status">{doc.status}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
