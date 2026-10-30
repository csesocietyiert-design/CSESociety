import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";
import Academics from "./pages/Academics";
import Faculty from "./pages/Faculty";
import Admissions from "./pages/Admissions";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Placements from "./pages/Placements";
import Contact from "./pages/Contact";
import Forms from "./pages/Forms";
import Society from "./pages/Society";
import "./styles/global.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "100px 24px" }}>
      <h1 style={{ fontSize: "5rem", color: "var(--primary)" }}>404</h1>
      <p style={{ fontSize: "1.2rem", color: "var(--text-light)", marginBottom: 24 }}>Page not found.</p>
      <Link to="/" className="btn btn-primary">← Go Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function AppRoutes() {
  const { pathname } = useLocation();
  const isFormsRoute = pathname === "/forms" || pathname.startsWith("/forms/");

  return (
    <>
      <ScrollToTop />
      {!isFormsRoute && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/academics" element={<Academics />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/events" element={<Events />} />
          <Route path="/society" element={<Society />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/placements" element={<Placements />} />
          <Route path="/forms" element={<Forms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isFormsRoute && <Footer />}
    </>
  );
}
