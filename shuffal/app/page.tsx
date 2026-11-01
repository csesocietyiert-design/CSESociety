import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import styles from './home.module.css';

export const metadata: Metadata = {
  title: 'CSE Society | IERT Prayagraj',
  description: 'The official CSE Society portal at IERT Prayagraj for circulars, registrations and member access.',
};

const resources = [
  {
    number: '01',
    eyebrow: 'Notices & updates',
    title: 'Society circulars',
    description: 'Read official notices and documents published by the CSE Society.',
    href: '/circulars',
    action: 'Browse circulars',
  },
  {
    number: '02',
    eyebrow: 'Activities',
    title: 'Event registration',
    description: 'Find the event registration page and submit your details.',
    href: '/event-registration',
    action: 'Open registration',
  },
  {
    number: '03',
    eyebrow: 'Member access',
    title: 'Society portal',
    description: 'Sign in to access member and society portal features.',
    href: '/login',
    action: 'Member sign in',
  },
];

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.utilityBar}>
        <div className={styles.container}>
          <span>Institute of Engineering and Rural Technology</span>
          <span className={styles.utilityLocation}>Prayagraj, Uttar Pradesh</span>
        </div>
      </div>

      <header className={styles.header}>
        <div className={`${styles.container} ${styles.headerInner}`}>
          <Link className={styles.brand} href="/" aria-label="CSE Society IERT home">
            <Image src="/logo_CSESociety_IERT.png" alt="CSE Society logo" width={72} height={72} priority />
            <span className={styles.brandText}>
              <strong>CSE Society</strong>
              <span>IERT Prayagraj</span>
            </span>
          </Link>
          <nav className={styles.navigation} aria-label="Main navigation">
            <Link href="/circulars">Circulars</Link>
            <Link href="/event-registration">Events</Link>
            <Link href="/forms">Forms</Link>
            <Link className={styles.signIn} href="/login">Member sign in <span aria-hidden="true">↗</span></Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero} aria-labelledby="home-title">
        <div className={`${styles.container} ${styles.heroContent}`}>
          <div className={styles.heroEmblem}>
            <Image src="/logo_CSESociety_IERT.png" alt="CSE Society IERT emblem" width={188} height={188} priority />
          </div>
          <p className={styles.eyebrow}><span /> Official student society portal</p>
          <h1 id="home-title">CSE Society<br /><span>at IERT Prayagraj.</span></h1>
          <p className={styles.heroDescription}>
            A central place for society notices, event registrations and member access.
          </p>
          <div className={styles.heroActions}>
            <Link href="/circulars" className={styles.primaryAction}>
              View official circulars <span aria-hidden="true">→</span>
            </Link>
            <Link href="/login" className={styles.secondaryAction}>Enter the society portal</Link>
          </div>
          <a className={styles.scrollCue} href="#resources">
            Explore society resources <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className={styles.heroSignature} aria-hidden="true">
          <span>COMPUTER SCIENCE</span><i /> <span>IERT · PRAYAGRAJ</span>
        </div>
      </section>

      <section className={styles.welcome} aria-label="Welcome">
        <div className={`${styles.container} ${styles.welcomeInner}`}>
          <p className={styles.welcomeLabel}>CSE Society <span>·</span> IERT Prayagraj</p>
          <p className={styles.welcomeCopy}>
            Official information and access for the CSE Society community.
          </p>
        </div>
      </section>

      <section className={styles.resources} id="resources" aria-labelledby="resources-title">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionEyebrow}>The society portal</p>
              <h2 id="resources-title">What are you looking for?</h2>
            </div>
            <p className={styles.sectionIntro}>
              Access current society information and services from one place.
            </p>
          </div>

          <div className={styles.resourceGrid}>
            {resources.map((resource) => (
              <Link className={styles.resource} href={resource.href} key={resource.number}>
                <div className={styles.resourceTop}>
                  <span>{resource.number}</span>
                  <span className={styles.resourceArrow} aria-hidden="true">↗</span>
                </div>
                <p className={styles.resourceEyebrow}>{resource.eyebrow}</p>
                <h3>{resource.title}</h3>
                <p className={styles.resourceDescription}>{resource.description}</p>
                <span className={styles.resourceAction}>{resource.action} <span aria-hidden="true">→</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.closing}>
        <div className={`${styles.container} ${styles.closingInner}`}>
          <div>
            <p className={styles.sectionEyebrow}>CSE Society · IERT</p>
            <h2>Stay connected with your society.</h2>
            <p>Check notices, register for activities or sign in to the member portal.</p>
          </div>
          <Link href="/forms" className={styles.closingAction}>
            Browse society forms <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
