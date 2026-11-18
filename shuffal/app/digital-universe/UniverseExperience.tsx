'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { startTransition, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { domains, heroThoughts, projects } from './data';
import MemberAvatar from '@/components/MemberAvatar';
import styles from './universe.module.css';

const UniverseScene = dynamic(() => import('./UniverseScene'), {
  ssr: false,
  loading: () => <div className={styles.sceneLoading} />,
});

interface GalleryPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  sort_order: number;
}

interface EventAlbum {
  id: string;
  event_name: string;
  event_date: string;
  description: string | null;
  cover_url: string | null;
  photos: GalleryPhoto[];
}

interface PublicTeamMember {
  id: string;
  name: string;
  role: string;
  year?: number | null;
  department?: string | null;
  batch?: string | null;
  bio?: string | null;
  profile_image_url?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  is_verified: boolean;
}

function getDisplayPhotoUrl(url: string) {
  const trimmed = url.trim();
  const fileMatch = trimmed.match(/(?:drive\.google\.com\/file\/d\/|[?&]id=)([^/?&]+)/);
  if (fileMatch?.[1]) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1600`;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed;
}

function getDrivePreviewUrl(url: string) {
  const trimmed = url.trim();
  const fileMatch = trimmed.match(/(?:drive\.google\.com\/file\/d\/|[?&]id=)([^/?&]+)/);
  return fileMatch?.[1]
    ? `https://drive.google.com/file/d/${fileMatch[1]}/preview`
    : trimmed;
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    president: 'President',
    vice_president: 'Vice President',
    general_secretary: 'General Secretary',
    cultural_secretary: 'Cultural Secretary',
    technical_secretary: 'Technical Secretary',
    joint_secretary: 'Joint Secretary',
    treasurer: 'Treasurer',
    year_representative: 'Year Representative',
    yearrep: 'Year Representative',
    secretary: 'Secretary',
    executive: 'Executive',
  };
  const normalized = role.toLowerCase();
  return labels[normalized] || role.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const executiveOrder = ['vice_president', 'treasurer', 'president', 'joint_secretary', 'executive'];
const secretaryOrder = ['general_secretary', 'technical_secretary', 'cultural_secretary', 'secretary'];

function sortByRoleOrder(members: PublicTeamMember[], order: string[]) {
  return [...members].sort((first, second) => {
    const firstIndex = order.indexOf(first.role.toLowerCase());
    const secondIndex = order.indexOf(second.role.toLowerCase());
    return (
      (firstIndex === -1 ? order.length : firstIndex) -
        (secondIndex === -1 ? order.length : secondIndex) ||
      first.name.localeCompare(second.name)
    );
  });
}

export default function UniverseExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [heroThought, setHeroThought] = useState(heroThoughts[0]);
  const [activeSection, setActiveSection] = useState('home');
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  const [albums, setAlbums] = useState<EventAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<EventAlbum | null>(null);
  const [gallerySpinning, setGallerySpinning] = useState(false);
  const [teamMembers, setTeamMembers] = useState<PublicTeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const orbitGalleryRef = useRef<HTMLDivElement>(null);
  const orbitPhaseRef = useRef(0);
  const orbitRadiusRef = useRef(280);
  const orbitSpinRef = useRef(false);
  const team = teamMembers.filter(
    (member) => member.is_verified && !['member', 'admin'].includes(member.role.toLowerCase()),
  );
  const executiveTeam = sortByRoleOrder(
    team.filter((member) => executiveOrder.includes(member.role.toLowerCase())),
    executiveOrder,
  );
  const secretaryTeam = sortByRoleOrder(
    team.filter((member) => secretaryOrder.includes(member.role.toLowerCase())),
    secretaryOrder,
  );
  const representativeTeam = team.filter((member) =>
    ['year_representative', 'yearrep'].includes(member.role.toLowerCase()) ||
    member.role.toLowerCase().startsWith('year_rep_'),
  ).sort((first, second) =>
    (second.year || Number.MIN_SAFE_INTEGER) - (first.year || Number.MIN_SAFE_INTEGER) ||
    first.name.localeCompare(second.name),
  );
  const categorizedTeamIds = new Set(
    [...executiveTeam, ...secretaryTeam, ...representativeTeam].map((member) => member.id),
  );
  const coreTeam = team
    .filter((member) => !categorizedTeamIds.has(member.id))
    .sort((first, second) => first.name.localeCompare(second.name));
  const totalCoreTeamCount =
    executiveTeam.length + secretaryTeam.length + representativeTeam.length + coreTeam.length;
  const teamSections = [
    { title: 'Executive Council', members: executiveTeam },
    { title: 'Secretaries', members: secretaryTeam },
    { title: 'Year Representatives', members: representativeTeam },
    { title: 'Core Team', members: coreTeam },
  ].filter((section) => section.members.length > 0);

  useEffect(() => {
    const storageKey = 'cse-daily-hero-thought';
    const now = Date.now();
    const saved = window.localStorage.getItem(storageKey);
    let thoughtIndex = 0;

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { index: number; expiresAt: number };
        if (parsed.expiresAt > now && parsed.index >= 0 && parsed.index < heroThoughts.length) {
          thoughtIndex = parsed.index;
        } else {
          const nextIndex = (parsed.index + 1) % heroThoughts.length;
          window.localStorage.setItem(storageKey, JSON.stringify({
            index: nextIndex,
            expiresAt: now + 24 * 60 * 60 * 1000,
          }));
          thoughtIndex = nextIndex;
        }
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    } else {
      const dayIndex = Math.floor(now / (24 * 60 * 60 * 1000));
      thoughtIndex = dayIndex % heroThoughts.length;
      window.localStorage.setItem(storageKey, JSON.stringify({
        index: thoughtIndex,
        expiresAt: now + 24 * 60 * 60 * 1000,
      }));
    }

    startTransition(() => setHeroThought(heroThoughts[thoughtIndex]));
  }, []);

  useEffect(() => {
    window.__universePointerX = 0;
    window.__universePointerY = 0;
    window.__universeTouchX = 0;
    window.__universeTouchY = 0;
    window.__universeTouchZ = 0;
    const handlePointer = (event: PointerEvent) => {
      window.__universePointerX = (event.clientX / window.innerWidth - 0.5) * 2;
      window.__universePointerY = -(event.clientY / window.innerHeight - 0.5) * 2;
    };
    let touchDistance = 0;
    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length < 2) return;
      event.preventDefault();
      const first = event.touches[0];
      const second = event.touches[1];
      const centerX = (first.clientX + second.clientX) / 2;
      const centerY = (first.clientY + second.clientY) / 2;
      const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
      window.__universeTouchX = (centerX / window.innerWidth - 0.5) * 2;
      window.__universeTouchY = -(centerY / window.innerHeight - 0.5) * 2;
      if (touchDistance > 0) {
        window.__universeTouchZ += (distance - touchDistance) * 0.012;
        window.__universeTouchZ = Math.max(-3.5, Math.min(3.5, window.__universeTouchZ));
      }
      touchDistance = distance;
    };
    const handleTouchEnd = () => {
      touchDistance = 0;
    };
    window.addEventListener('pointermove', handlePointer);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    const timer = window.setTimeout(() => setLoaded(true), 900);
    return () => {
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const updateScrolledState = () => setNavbarScrolled(window.scrollY > 48);
    updateScrolledState();
    window.addEventListener('scroll', updateScrolledState, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (visibleSection) setActiveSection(visibleSection.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.25] },
    );
    document.querySelectorAll<HTMLElement>('.section[id]').forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener('scroll', updateScrolledState);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    fetch('/api/event-photos')
      .then((response) => (response.ok ? response.json() : { albums: [] }))
      .then((payload: { albums?: EventAlbum[] }) => setAlbums(payload.albums || []))
      .catch(() => setAlbums([]));
  }, []);

  useEffect(() => {
    let active = true;

    fetch('/api/public/team')
      .then(async (response) => {
        const payload = await response.json() as { members?: PublicTeamMember[]; error?: string };
        if (!response.ok) throw new Error(payload.error || 'Unable to load public team profiles');
        return payload.members || [];
      })
      .then((members) => {
        if (active) setTeamMembers(members);
      })
      .catch((error: unknown) => {
        if (active) setTeamError(error instanceof Error ? error.message : 'Unable to load public team profiles');
      })
      .finally(() => {
        if (active) setTeamLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const updateRadius = () => {
      if (window.innerWidth < 560) orbitRadiusRef.current = 170;
      else if (window.innerWidth < 900) orbitRadiusRef.current = 220;
      else orbitRadiusRef.current = 280;
    };
    updateRadius();
    window.addEventListener('resize', updateRadius);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let previous = performance.now();
    const animate = (time: number) => {
      const elapsed = Math.min(time - previous, 32);
      previous = time;
      const speed = orbitSpinRef.current ? 0.48 : 0.018;
      if (!prefersReducedMotion) {
        orbitPhaseRef.current = (orbitPhaseRef.current + elapsed * speed) % 360;
      }
      const cards = orbitGalleryRef.current?.querySelectorAll<HTMLButtonElement>('[data-orbit-card]');
      if (cards) {
        cards.forEach((card) => {
          const baseAngle = Number(card.dataset.orbitAngle || 0);
          const liveAngle = baseAngle + orbitPhaseRef.current;
          card.style.transform =
            `rotate(${liveAngle}deg) translateY(${-orbitRadiusRef.current}px) rotate(${-liveAngle}deg)`;
        });
      }
      frame = requestAnimationFrame(animate);
    };

    if (!prefersReducedMotion) frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', updateRadius);
    };
  }, []);

  const openGalleryAlbum = (album: EventAlbum, index: number) => {
    orbitSpinRef.current = true;
    setGallerySpinning(true);
    const cardAngle = (360 / albums.length) * index;
    orbitPhaseRef.current = (360 - cardAngle) % 360;
    window.setTimeout(() => {
      setSelectedAlbum(album);
      setGallerySpinning(false);
      orbitSpinRef.current = false;
    }, 420);
  };

  return (
    <main className={styles.universe}>
      {!loaded && (
        <div className={styles.loader} aria-label="Loading digital universe">
          <span>CSE // INITIALIZING</span>
          <div><i /></div>
        </div>
      )}

      <UniverseScene />
      <div className={styles.noise} aria-hidden="true" />

      <header className={`${styles.navbar} ${navbarScrolled ? styles.navbarScrolled : ''}`}>
        <Link className={styles.brand} href="/" aria-label="CSE Society home">
          <img src="/logo_CSESociety_IERT.png" alt="" />
          <span>
            <strong>CSE SOCIETY</strong>
            <small>IERT PRAYAGRAJ</small>
          </span>
        </Link>
        <button
          className={styles.menuButton}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        <nav
          id="primary-navigation"
          className={menuOpen ? `${styles.navLinks} ${styles.navOpen}` : styles.navLinks}
          aria-label="Main navigation"
        >
          {[
            ['Home', 'home'],
            ['About', 'about'],
            ['Domains', 'domains'],
            ['Gallery', 'gallery'],
            ['Events', 'events'],
            ['Projects', 'projects'],
            ['Community', 'community'],
            ['Contact', 'join'],
          ].map(([label, id]) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(event) => {
                event.preventDefault();
                setMenuOpen(false);
                setActiveSection(id);
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.history.replaceState(null, '', `#${id}`);
              }}
              aria-current={activeSection === id ? 'location' : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <section className={`${styles.section} ${styles.hero}`} id="home">
        <motion.div
          className={styles.heroCopy}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.25 }}
        >
          <p className={styles.eyebrow}><span /> CSE Society // IERT</p>
          <h1>
            {heroThought.line1}
            <br />
            <em>{heroThought.line2}</em>
          </h1>
          <p className={styles.heroSupport}>
            {heroThought.description}
          </p>
          <div className={styles.heroActions}>
            <a href="#domains">Explore our universe <span>↗</span></a>
            <a href="#about">Discover CSE Society <span>→</span></a>
          </div>
        </motion.div>
        <div className={styles.heroIdentity} aria-label="Society identity">
          <span>INSTITUTE OF ENGINEERING</span>
          <span>&amp; RURAL TECHNOLOGY</span>
          <strong>PRAYAGRAJ</strong>
        </div>
      </section>

      <section className={`${styles.section} ${styles.about}`} id="about">
        <div className={styles.aboutContent}>
          <motion.div
            className={styles.aboutIntro}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
          >
            <p className={styles.sectionIndex}>01 // THE CORE</p>
            <h2>Who we are</h2>
            <p>
              CSE Society is the student technology community of IERT Prayagraj, bringing together
              verified student leaders, secretaries, year representatives and the core team.
            </p>
            <div className={styles.aboutTeamSummary}>
              <span><strong>{executiveTeam.length}</strong> Executive council</span>
              <span><strong>{secretaryTeam.length}</strong> Secretaries</span>
              <span><strong>{representativeTeam.length}</strong> Year representatives</span>
              <span><strong>{totalCoreTeamCount}</strong> Core team</span>
            </div>
            <Link href="/dashboard/description">Open the complete team directory <span>→</span></Link>
          </motion.div>

          <div className={styles.teamDirectory}>
            {teamLoading ? (
              <p className={styles.teamEmpty}>Loading verified society team profiles...</p>
            ) : teamError ? (
              <p className={styles.teamEmpty} role="alert">{teamError}</p>
            ) : team.length === 0 ? (
              <p className={styles.teamEmpty}>Verified society team profiles will appear here.</p>
            ) : teamSections.map((section) => (
              <section key={section.title} className={styles.teamGroup}>
                <h3>{section.title}<span>{String(section.members.length).padStart(2, '0')}</span></h3>
                <div className={styles.teamCards}>
                  {section.members.map((member) => {
                    const socialLinks = [
                      { label: 'LinkedIn', url: member.linkedin_url },
                      { label: 'GitHub', url: member.github_url },
                      { label: 'Instagram', url: member.instagram_url },
                      { label: 'X', url: member.twitter_url },
                    ].filter((link): link is { label: string; url: string } => Boolean(link.url));
                    const isExpanded = expandedMemberId === member.id;
                    const memberDetails = [
                      member.year ? `Year ${member.year}` : null,
                      member.batch,
                      member.department,
                    ].filter(Boolean);

                    return (
                      <article
                        key={member.id}
                        className={`${styles.teamCard} ${isExpanded ? styles.teamCardExpanded : ''}`}
                        tabIndex={0}
                        aria-label={`${member.name}, ${roleLabel(member.role)}. Tap or focus to view profile details.`}
                        onClick={() => setExpandedMemberId(isExpanded ? null : member.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setExpandedMemberId(isExpanded ? null : member.id);
                          }
                        }}
                      >
                        <MemberAvatar
                          name={member.name}
                          profileImage={member.profile_image_url}
                          alt={`${member.name} profile`}
                          className={styles.teamCardPhoto}
                          imageClassName={styles.teamCardImage}
                        />
                        <div className={styles.teamCardBase}>
                          <span>{roleLabel(member.role)}</span>
                          <strong>{member.name}</strong>
                        </div>
                        <div className={styles.teamCardDetails}>
                          <span className={styles.teamCardHint}>PROFILE // {roleLabel(member.role)}</span>
                          <strong>{member.name}</strong>
                          {memberDetails.length > 0 && <p>{memberDetails.join(' · ')}</p>}
                          {member.bio && <p className={styles.teamCardBio}>{member.bio}</p>}
                          {socialLinks.length > 0 && (
                            <div className={styles.teamCardSocials}>
                              {socialLinks.map((link) => (
                                <a
                                  key={link.label}
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {link.label} ↗
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.domains}`} id="domains">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>02 // ACTIVE DOMAINS</p>
          <h2>Our technical universe</h2>
        </div>
        <div className={styles.domainGrid}>
          {domains.map((domain, index) => (
            <motion.article
              key={domain}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.035 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{domain}</h3>
              <i />
            </motion.article>
          ))}
        </div>
        <div className={styles.portalStrip}>
          {[
            ['ASTRA', 'https://astra.iert.ac.in'],
            ['IERT', 'https://iert.ac.in'],
            ['IERT Official', 'https://iert.edu.in'],
            ['CSE Society', 'https://csesociety.iert.ac.in'],
          ].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer">
              <span>{label}</span>
              <b>↗</b>
            </a>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.gallery}`} id="gallery">
        <div className={styles.galleryHeading}>
          <p className={styles.sectionIndex}>03 // EVENT GALLERY</p>
          <h2>Moments in orbit</h2>
        </div>
        {albums.length === 0 ? (
          <div className={styles.emptyGallery}>Event photo albums will appear here.</div>
        ) : (
          <div
            ref={orbitGalleryRef}
            className={`${styles.orbitGallery} ${gallerySpinning ? styles.orbitSpinning : ''}`}
          >
            {albums.map((album, index) => {
              const angle = (360 / albums.length) * index;
              return (
                <button
                  type="button"
                  key={album.id}
                  className={styles.orbitCard}
                  data-orbit-card
                  data-orbit-angle={angle}
                  style={{
                    transform: `rotate(${angle}deg) translateY(-280px) rotate(${-angle}deg)`,
                  }}
                  onClick={() => openGalleryAlbum(album, index)}
                >
                  {album.cover_url ? (
                    <img src={getDisplayPhotoUrl(album.cover_url)} alt="" loading="lazy" decoding="async" />
                  ) : (
                    <span className={styles.orbitPlaceholder}>CSE</span>
                  )}
                  <span className={styles.orbitCardCopy}>
                    <small>{new Date(`${album.event_date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</small>
                    <strong>{album.event_name}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedAlbum && (
        <div className={styles.photoModal} role="dialog" aria-modal="true" aria-label={selectedAlbum.event_name}>
          <button type="button" className={styles.photoModalBackdrop} onClick={() => setSelectedAlbum(null)} aria-label="Close event gallery" />
          <div className={styles.photoModalPanel}>
            <div className={styles.photoModalHeader}>
              <div>
                <small>{new Date(`${selectedAlbum.event_date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</small>
                <h2>{selectedAlbum.event_name}</h2>
                {selectedAlbum.description && <p>{selectedAlbum.description}</p>}
              </div>
              <button type="button" onClick={() => setSelectedAlbum(null)} aria-label="Close">×</button>
            </div>
            <div className={styles.photoGrid}>
              {selectedAlbum.photos.map((photo) => (
                <a key={photo.id} href={getDrivePreviewUrl(photo.photo_url)} target="_blank" rel="noopener noreferrer">
                  <img src={getDisplayPhotoUrl(photo.photo_url)} alt={photo.caption || selectedAlbum.event_name} loading="lazy" decoding="async" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className={`${styles.section} ${styles.events}`} id="events">
        <motion.div
          className={styles.arenaPanel}
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
        >
          <p className={styles.sectionIndex}>03 // EVENT ARENA</p>
          <h2>Learn. Build. Compete.</h2>
          <p>Workshops, technical sessions and collaborative challenges live here.</p>
          <Link href="/event-registration">Open event registration <span>↗</span></Link>
        </motion.div>
      </section>

      <section className={`${styles.section} ${styles.projects}`} id="projects">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionIndex}>04 // DISCOVERY ARCHIVE</p>
          <h2>Projects from the community</h2>
        </div>
        <div className={styles.projectGrid}>
          {projects.map((project) => (
            <motion.article
              key={project.index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <span>{project.index}</span>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <a href={project.href} target="_blank" rel="noopener noreferrer">Explore <b>→</b></a>
            </motion.article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.community}`} id="community">
        <motion.div
          className={styles.communityCopy}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <p className={styles.sectionIndex}>05 // NETWORK</p>
          <h2>One community.<br />Infinite possibilities.</h2>
          <p>Developers, learners and builders connected by curiosity and creation.</p>
          <div className={styles.communityCards}>
            {[
              {
                name: 'WhatsApp Community',
                detail: 'Join the CSE Society group',
                href: 'https://chat.whatsapp.com/IRejAsROTwl6yHbxWE6UJB?s=sh&p=a&iam=2',
                code: '01',
              },
              {
                name: 'Instagram',
                detail: '@csesocietyiert',
                href: 'https://www.instagram.com/csesocietyiert?bqrl=MTgyaXBmc2ZnNTJudw==',
                code: '02',
              },
              {
                name: 'X',
                detail: '@cse_society_08',
                href: 'https://x.com/cse_society_08',
                code: '03',
              },
              {
                name: 'Discord',
                detail: 'Join the developer server',
                href: 'https://discord.gg/RheVa7MgG',
                code: '04',
              },
              {
                name: 'LinkedIn',
                detail: 'CSE Society IERT Prayagraj',
                href: 'https://www.linkedin.com/in/cse-society-iert-prayagraj-58b52a429?utm_source=share_via&utm_content=profile&utm_medium=member_android',
                code: '05',
              },
            ].map((community) => (
              <a
                key={community.code}
                href={community.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.communityCard}
              >
                <span>{community.code} {'// CONNECT'}</span>
                <strong>{community.name}</strong>
                <small>{community.detail}</small>
                <b aria-hidden="true">↗</b>
              </a>
            ))}
          </div>
        </motion.div>
      </section>

      <section className={`${styles.section} ${styles.join}`} id="join">
        <motion.div
          className={styles.portal}
          initial={{ opacity: 0, scale: 0.88 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          <span>ACCESS // CSE SOCIETY</span>
          <h2>BUILD. INNOVATE. CONNECT.</h2>
          <div>
            <Link href="/login">Enter portal <b>→</b></Link>
            <Link href="/circulars">View circulars <b>↗</b></Link>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
