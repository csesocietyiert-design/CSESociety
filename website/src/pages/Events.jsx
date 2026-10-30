import { useState } from "react";
import { Calendar, Clock, MapPin, GraduationCap } from "lucide-react";
import "./Events.css";

const allNews = [
  { id: 1, date: "June 5, 2026", tag: "Placement", title: "CSE Students Placed in Major IT Companies — Campus Drive 2026", desc: "Multiple students from the CSE batch of 2026 secured placements at TCS, Infosys, and HCL during the annual campus recruitment drive held at IERT." },
  { id: 2, date: "May 20, 2026", tag: "Seminar", title: "National Seminar on AI & Machine Learning Held at IERT", desc: "The CSE department organized a two-day national seminar on Artificial Intelligence and Machine Learning, with participation from students across UP." },
  { id: 3, date: "April 15, 2026", tag: "Achievement", title: "IERT Students Win First Prize at Inter-College Hackathon", desc: "A team of 4 CSE students bagged the first prize at the 'CodeStorm' inter-college hackathon organized in Prayagraj." },
  { id: 4, date: "March 10, 2026", tag: "Workshop", title: "Workshop on Ethical Hacking & Cybersecurity", desc: "A 3-day hands-on workshop on ethical hacking and cyber security was conducted for CSE final-year students by industry experts." },
  { id: 5, date: "February 28, 2026", tag: "Research", title: "Faculty Research Paper Published in IEEE Journal", desc: "A research paper co-authored by CSE faculty was published in the IEEE Transactions on Knowledge and Data Engineering." },
  { id: 6, date: "January 20, 2026", tag: "Event", title: "Techfest 2026 — Annual Technical Festival Concludes", desc: "The annual technical festival 'Techfest 2026' of IERT saw enthusiastic participation from students across departments with coding, robotics, and quiz competitions." },
];

const upcomingEvents = [
  { date: "June 17, 2026", title: "Final Year Project Presentation", time: "10:00 AM", venue: "Seminar Hall, CSE Block", type: "Academic" },
  { date: "June 22, 2026", title: "Alumni Talk: Career in Data Science", time: "3:00 PM", venue: "Conference Room", type: "Talk" },
  { date: "July 5, 2026", title: "Industrial Visit: IT Park Noida", time: "7:00 AM", venue: "IERT Main Gate", type: "Visit" },
  { date: "July 15, 2026", title: "New Batch Orientation Program", time: "9:00 AM", venue: "Main Auditorium", type: "Orientation" },
  { date: "August 1, 2026", title: "Workshop on Python & Data Analysis", time: "10:00 AM", venue: "Computer Lab 1", type: "Workshop" },
];

const tags = ["All", "Placement", "Seminar", "Achievement", "Workshop", "Research", "Event"];

export default function Events() {
  const [activeTag, setActiveTag] = useState("All");

  const filtered = activeTag === "All" ? allNews : allNews.filter((n) => n.tag === activeTag);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Events & News</h1>
          <p>Stay updated with the latest from CSE Department</p>
          <div className="breadcrumb">Home <span>›</span> Events & News</div>
        </div>
      </section>

      <section className="section">
        <div className="container events-layout">
          {/* News Column */}
          <div className="news-main-col">
            <h2 className="section-title">LATEST <span>NEWS</span></h2>
            <p className="sub-label" style={{ marginBottom: 4 }}>CAMPUS BULLETIN</p>
            <div className="section-divider" />

            {/* Filter Tags */}
            <div className="tag-filters">
              {tags.map((t) => (
                <button
                  key={t}
                  className={`tag-btn ${activeTag === t ? "active" : ""}`}
                  onClick={() => setActiveTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="news-full-list">
              {filtered.map((n) => (
                <div key={n.id} className="card news-full-card">
                  <div className="nfc-img-placeholder">
                    {/* ⬇️ REPLACE: Add news image at src/assets/news/news{n.id}.jpg */}
                    [News Image {n.id}]
                  </div>
                  <div className="nfc-body">
                    <div className="nfc-meta">
                      <span className="tag">{n.tag}</span>
                      <span className="news-date"><Calendar size={12} strokeWidth={2} /> {n.date}</span>
                    </div>
                    <h3>{n.title}</h3>
                    <p>{n.desc}</p>
                    <button className="btn btn-outline read-more-btn">Read More</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="events-sidebar">
            <h2 className="section-title">UPCOMING <span>EVENTS</span></h2>
            <p className="sub-label" style={{ marginBottom: 4 }}>PROGRAMS ON PLATTER</p>
            <div className="section-divider" />
            <div className="event-full-list">
              {upcomingEvents.map((e) => (
                <div key={e.title} className="card event-full-card">
                  <span className={`event-type-tag event-type-${e.type.toLowerCase()}`}>{e.type}</span>
                  <h4>{e.title}</h4>
                  <div className="event-full-meta">
                    <span><Calendar size={12} strokeWidth={2} /> {e.date}</span>
                    <span><Clock size={12} strokeWidth={2} /> {e.time}</span>
                    <span><MapPin size={12} strokeWidth={2} /> {e.venue}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* PhD Seminars box */}
            <div className="phd-seminars-box">
              <h3><GraduationCap size={18} strokeWidth={1.8} /> PhD / Seminars</h3>
              <p>SEE UPCOMING SEMINARS</p>
              <div className="seminar-card">
                <div className="seminar-photo-placeholder">[Photo]</div>
                <div>
                  <p className="seminar-name">[Student Name]</p>
                  <p className="seminar-meta"><Calendar size={11} strokeWidth={2} /> [Date] &nbsp; <Clock size={11} strokeWidth={2} /> [Time]</p>
                  <button className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "5px 12px", marginTop: 6 }}>View Details</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
