import { useState } from "react";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import "./Contact.css";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    // ⬇️ REPLACE: Connect to a backend or EmailJS to actually send emails
    setSubmitted(true);
  };

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>Get in touch with the CSE Department, IERT Prayagraj</p>
          <div className="breadcrumb">Home <span>›</span> Contact</div>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="section contact-cards-section">
        <div className="container contact-cards-grid">
          <div className="card contact-info-card">
            <div className="contact-icon"><MapPin size={28} strokeWidth={1.5} /></div>
            <h3>Address</h3>
            <p>Department of Computer Science & Engineering</p>
            <p>Institute of Engineering and Rural Technology (IERT)</p>
            <p>26, Chaitham Lines, Near Prayag Railway Station</p>
            <p>Prayagraj – 211002 (U.P.), India</p>
          </div>
          <div className="card contact-info-card">
            <div className="contact-icon"><Phone size={28} strokeWidth={1.5} /></div>
            <h3>Phone</h3>
            <p><a href="tel:+915322544810">+91-532-2544-810</a></p>
            <p><a href="tel:+915322544480">+91-532-2544-480</a></p>
            <p style={{ marginTop: 8, color: "var(--gray)", fontSize: "0.85rem" }}>Mon – Sat: 10:00 AM – 5:00 PM</p>
          </div>
          <div className="card contact-info-card">
            <div className="contact-icon"><Mail size={28} strokeWidth={1.5} /></div>
            <h3>Email</h3>
            <p><a href="mailto:cse@iert.ac.in">cse@iert.ac.in</a></p>
            <p><a href="mailto:hod.cse@iert.ac.in">hod.cse@iert.ac.in</a></p>
            <p><a href="mailto:registrar@iert.ac.in">registrar@iert.ac.in</a></p>
            <p><a href="mailto:director@iert.ac.in">director@iert.ac.in</a></p>
          </div>
          <div className="card contact-info-card">
            <div className="contact-icon"><Globe size={28} strokeWidth={1.5} /></div>
            <h3>Web & Social</h3>
            <p><a href="https://www.iert.ac.in" target="_blank" rel="noreferrer">www.iert.ac.in</a></p>
            <div className="social-links">
              <a href="https://x.com/IertPrayagraj" target="_blank" rel="noreferrer" className="social-btn">𝕏 Twitter</a>
              <a href="https://www.linkedin.com/in/tpo-iert/" target="_blank" rel="noreferrer" className="social-btn">in LinkedIn</a>
            </div>
          </div>
        </div>
      </section>

      {/* Map + Form */}
      <section className="section contact-main-section">
        <div className="container contact-main-grid">

          {/* Map */}
          <div>
            <h2 className="section-title">FIND <span>US HERE</span></h2>
            <div className="section-divider" />
            <div className="map-container">
              {/*  */}
              <iframe
                title="IERT Prayagraj Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3602.1567!2d81.8426!3d25.4358!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399acb2b5a4e8a3f%3A0x5c7e39f2e6b3a2c4!2sIERT%20Prayagraj!5e0!3m2!1sen!2sin!4v1000000000000"
                width="100%"
                height="320"
                style={{ border: 0, borderRadius: "var(--radius)" }}
                allowFullScreen=""
                loading="lazy"
              />
            </div>

          </div>

          {/* Contact Form */}
          <div>
            <h2 className="section-title">SEND US A <span>MESSAGE</span></h2>
            <div className="section-divider" />
            {submitted ? (
              <div className="form-success">
                <div className="success-icon">✅</div>
                <h3>Message Sent!</h3>
                <p>Thank you for contacting us. We will get back to you within 2-3 working days.</p>
                <button className="btn btn-primary" onClick={() => setSubmitted(false)}>Send Another</button>
              </div>
            ) : (
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Your full name" required />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="form-group">
                    <label>Subject *</label>
                    <select name="subject" value={form.subject} onChange={handleChange} required>
                      <option value="">Select subject</option>
                      <option value="Admissions">Admissions Enquiry</option>
                      <option value="Academics">Academics</option>
                      <option value="Placements">Placements / Recruitment</option>
                      <option value="Faculty">Faculty Enquiry</option>
                      <option value="General">General Query</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} rows={5} placeholder="Write your message here..." required />
                </div>
                <button type="submit" className="btn btn-primary form-submit-btn">Send Message →</button>
                <p className="form-note">
                  <a href="https://www.emailjs.com" target="_blank" rel="noreferrer">Email</a> 
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* How to Reach */}
      <section className="section reach-section">
        <div className="container">
          <h2 className="section-title">HOW TO <span>REACH US</span></h2>
          <div className="section-divider" />
          <div className="reach-grid">
            <div className="card reach-card">
              <span className="reach-icon">🚂</span>
              <h3>By Train</h3>
              <p>The nearest railway station is <strong>Prayag Junction</strong>, just 0.5 km from IERT. Allahabad Junction is 4 km away.</p>
            </div>
            <div className="card reach-card">
              <span className="reach-icon">🚌</span>
              <h3>By Bus</h3>
              <p>City buses and auto-rickshaws are available from Civil Lines and Allahabad Junction to IERT. Ask for "IERT Prayagraj".</p>
            </div>
            <div className="card reach-card">
              <span className="reach-icon">✈️</span>
              <h3>By Air</h3>
              <p><strong>Prayagraj Airport (IXD)</strong> is approximately 12 km from IERT. Taxis and autos are available from the airport.</p>
            </div>
            <div className="card reach-card">
              <span className="reach-icon">🚗</span>
              <h3>By Road</h3>
              <p>IERT is located on <strong>Chaitham Lines</strong>, near Prayag Railway Station. GPS coordinates: 25.4358° N, 81.8426° E</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
