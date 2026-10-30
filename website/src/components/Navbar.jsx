import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import "./Navbar.css";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  {
    label: "Academics",
    path: "/academics",
    dropdown: [
      { label: "B.Tech CSE Program", path: "/academics" },
      { label: "Curriculum & Syllabus", path: "/academics#curriculum" },
      { label: "Labs & Infrastructure", path: "/academics#labs" },
    ],
  },
  { label: "Faculty", path: "/faculty" },
  { label: "Admissions", path: "/admissions" },
  { label: "Events & News", path: "/events" },
  { label: "Society", path: "/society" },
  { label: "Gallery", path: "/gallery" },
  { label: "Placements", path: "/placements" },
  { label: "Forms", path: "/forms" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [location]);

  return (
    <>
      {/* Top Bar */}
      <div className="topbar">
        <div className="container topbar-inner">
          <span className="topbar-contact">
            <Mail size={13} strokeWidth={2} /> cse@iert.ac.in
            <span className="topbar-sep">|</span>
            <Phone size={13} strokeWidth={2} /> +91-532-2659-7135
          </span>
          <span className="topbar-right">
            <a href="#">Student Portal</a>
          </span>
        </div>
      </div>

      {/* Header */}
      <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
        <div className="container header-inner">
          {/* Logo */}
          <Link to="/" className="logo-area">
            <img src="/src/assets/iert-logo.jpg" alt="IERT Logo" style={{width:56,height:56,objectFit:"contain"}} />
            <div className="logo-text">
              <span className="logo-dept">Department of Computer Science & Engineering</span>
              <span className="logo-college">Institute of Engineering and Rural Technology, Prayagraj</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="nav-desktop">
            {navLinks.map((link) =>
              link.dropdown ? (
                <div
                  key={link.label}
                  className="nav-item has-dropdown"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <Link
                    to={link.path}
                    className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
                  >
                    {link.label} <span className="arrow">▾</span>
                  </Link>
                  {openDropdown === link.label && (
                    <div className="dropdown">
                      {link.dropdown.map((d) => (
                        <Link key={d.label} to={d.path} className="dropdown-item">
                          {d.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`nav-link ${location.pathname === link.path ? "active" : ""}`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Hamburger */}
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile Nav */}
      {menuOpen && (
        <div className="mobile-nav">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`mobile-nav-link ${location.pathname === link.path ? "active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
