import { useState } from "react";
import "./Gallery.css";

const galleryItems = [
  { id: 1,  category: "Events",       title: "HORIZON — Cultural Fest",         src: "/src/assets/gallery/horizon-event.jpg" },
  { id: 2,  category: "Lab",          title: "CSE Classroom",                   src: "/src/assets/gallery/classroom-1.jpg" },
  { id: 3,  category: "Lab",          title: "Classroom Session",               src: "/src/assets/gallery/classroom-2.jpg" },
  { id: 4,  category: "Campus",       title: "Engineering Degree Division",     src: "/src/assets/gallery/campus-building.jpg" },
  { id: 5,  category: "Campus",       title: "College Main Gate",               src: "/src/assets/campus-banner.jpg" },
  { id: 6,  category: "Events",       title: "Techfest 2026",                   src: "/src/assets/gallery/techfest-2026.jpg" },
  { id: 7,  category: "Events",       title: "Annual Seminar",                  src: "/src/assets/gallery/annual-seminar.jpg" },
  { id: 8,  category: "Events",       title: "Student Assembly",                src: "/src/assets/gallery/student-assembly.jpg" },
  { id: 9,  category: "Events",       title: "AI Workshop",                     src: "/src/assets/gallery/ai-workshop.jpg" },
  { id: 10, category: "Achievements", title: "Award Ceremony",                  src: "/src/assets/gallery/award-ceremony.jpg" },
  { id: 12, category: "Campus",       title: "IERT Garden",                     src: "/src/assets/gallery/iert-garden.webp" },
  { id: 13, category: "Campus",       title: "IERT Library",                    src: "/src/assets/gallery/library.webp" },
  { id: 14, category: "Campus",       title: "IERT Hostel",                     src: "/src/assets/gallery/hostel.webp" },
  { id: 15, category: "Campus",       title: "Campus Courtyard",                src: "/src/assets/gallery/campus-courtyard.avif" },
  { id: 16, category: "Campus",       title: "IERT Auditorium",                 src: "/src/assets/gallery/auditorium.avif" },
  { id: 17, category: "Campus",       title: "Hackathon", src: "/src/assets/gallery/gallery-new-1.jpeg" },
  { id: 18, category: "Campus",       title: "participants",     src: "/src/assets/gallery/gallery-new-2.jpeg" },
  { id: 19, category: "Campus",       title: "CSE Society's Core Members",      src: "/src/assets/gallery/gallery-new-3.jpeg" },
  { id: 20, category: "Campus",       title: "Society's Executive Council",     src: "/src/assets/gallery/gallery-new-4.jpeg" },
  { id: 21, category: "Campus",       title: "Society TECH Talks and Induction",                       src: "/src/assets/gallery/gallery-new-5.jpeg" },
];

const categories = ["All", "Lab", "Campus", "Events", "Achievements"];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxImg, setLightboxImg] = useState(null);

  const filtered = activeCategory === "All"
    ? galleryItems
    : galleryItems.filter((g) => g.category === activeCategory);

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Photo Gallery</h1>
          <p>Glimpses of campus life, events, and achievements</p>
          <div className="breadcrumb">Home <span>›</span> Gallery</div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">MULTI-HUED <span>REFLECTIONS</span></h2>
          <div className="section-divider" />

          {/* Category Filter */}
          <div className="gallery-filters">
            {categories.map((c) => (
              <button
                key={c}
                className={`gallery-filter-btn ${activeCategory === c ? "active" : ""}`}
                onClick={() => setActiveCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="gallery-grid">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="gallery-item"
                onClick={() => setLightboxImg(item)}
              >
                {item.src ? (
                  <img src={item.src} alt={item.title} />
                ) : (
                  <div className="gallery-item-placeholder">
                    📷<br />
                    <small>{item.title}</small><br />
                    <small style={{ fontSize: "0.6rem", opacity: 0.6 }}>
                      src/assets/gallery/{item.id}.jpg
                    </small>
                  </div>
                )}
                <div className="gallery-overlay">
                  <span className="gallery-item-title">{item.title}</span>
                  <span className="gallery-item-cat">{item.category}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxImg(null)}>✕</button>
            {lightboxImg.src ? (
              <img src={lightboxImg.src} alt={lightboxImg.title} />
            ) : (
              <div className="lightbox-placeholder">
                📷 {lightboxImg.title}<br />
                
              </div>
            )}
            <p className="lightbox-caption">{lightboxImg.title} — {lightboxImg.category}</p>
          </div>
        </div>
      )}
    </div>
  );
}
