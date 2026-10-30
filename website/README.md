# 🎓 CSE Department Website — IERT Prayagraj
## React + Vite Project

---

## 🚀 How to Run in VS Code

```bash
npm install
npm run dev
# Open: http://localhost:5173
```

---

## 📁 Project Structure

```
src/
├── assets/               ← PUT ALL YOUR IMAGES HERE
├── components/
│   ├── Navbar.jsx        ← Top navigation bar
│   └── Footer.jsx        ← Bottom footer
├── pages/
│   ├── Home.jsx          ← Home page
│   ├── About.jsx         ← About Department
│   ├── Academics.jsx     ← Courses & Curriculum
│   ├── Faculty.jsx       ← Faculty Members
│   ├── Admissions.jsx    ← Admissions Info
│   ├── Events.jsx        ← Events & News
│   ├── Gallery.jsx       ← Photo Gallery
│   ├── Placements.jsx    ← Placement Records
│   └── Contact.jsx       ← Contact Us
├── styles/
│   └── global.css        ← Global CSS (colors, fonts)
└── App.jsx               ← All routes defined here
```

---

## 🖼️ IMAGE REPLACEMENT GUIDE

Every image in the website has a placeholder with a comment like:
`⬇️ REPLACE: Add image at src/assets/...`

| Image Needed           | Save To                          | Page Used        |
|------------------------|----------------------------------|------------------|
| College Hero Photo     | src/assets/hero-bg.jpg           | Home             |
| HOD/Director Photo     | src/assets/hod-photo.jpg         | Home, About      |
| Department Building    | src/assets/dept-building.jpg     | About            |
| Wide Campus Banner     | src/assets/campus-banner.jpg     | Footer           |
| Academics/Lab Photo    | src/assets/academics-hero.jpg    | Academics        |
| Admissions Photo       | src/assets/admissions.jpg        | Admissions       |
| Placements Drive Photo | src/assets/placements.jpg        | Placements       |
| Research Photo 1       | src/assets/research1.jpg         | Home             |
| Research Photo 2       | src/assets/research2.jpg         | Home             |
| Gallery Photos (1-16)  | src/assets/gallery/1.jpg ...     | Gallery          |
| Faculty Photos (1-6)   | src/assets/faculty/f1.jpg ...    | Faculty          |
| Alumni Photos          | src/assets/alumni/alumni1.jpg    | Placements       |
| IERT Logo              | src/assets/iert-logo.png         | Navbar, Footer   |

To replace HOD photo in About.jsx, replace:
  <div className="hod-img-placeholder">[HOD Photo]</div>
With:
  <img src="/src/assets/hod-photo.jpg" alt="HOD" className="hod-img-placeholder" />

---

## ✏️ DATA TO FILL IN

| Data                 | File             | Search For            |
|----------------------|------------------|-----------------------|
| HOD Name             | About, Faculty, Contact | [HOD Name]      |
| Faculty Names        | Faculty.jsx      | faculty array         |
| Fee Structure        | Admissions.jsx   | [Contact Office]      |
| Placement Stats      | Placements.jsx   | placementStats array  |
| News & Events        | Events.jsx       | allNews array         |
| Gallery Photos       | Gallery.jsx      | galleryItems src      |
| Contact Emails       | Contact.jsx      | placeholder emails    |

---

## 🎨 Change Colors (src/styles/global.css)

--primary: #003580        (Main blue)
--primary-dark: #002060   (Darker blue)
--accent: #e8a000         (Gold accent)

---

## 📦 Build for Production

```bash
npm run build
# Upload the /dist folder to your web server
```
