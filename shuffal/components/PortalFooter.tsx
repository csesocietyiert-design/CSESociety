import Link from 'next/link';
import Image from 'next/image';

const footerLinks = [
    [
      { label: 'Sign in', href: '/login' },
      { label: 'Create account', href: '/register' },
    ],
    [
      { label: 'IERT official website', href: 'https://www.iert.ac.in', external: true },
      { label: 'CSE Department', href: 'https://www.iert.ac.in', external: true },
    ],
  ];

export default function PortalFooter() {
  return (
    <footer className="relative z-10 mt-auto w-full border-t border-white/10 bg-[#0b1935] text-slate-300">
      <div className="mx-auto grid max-w-[1428px] grid-cols-1 gap-10 px-5 py-10 sm:px-8 md:grid-cols-2 xl:grid-cols-[1.35fr_0.9fr_0.9fr_1.2fr] xl:gap-10">
        <div>
          <Image
            src="/src/assets/iert-logo.jpg"
            alt="Institute of Engineering and Rural Technology emblem"
            width={56}
            height={68}
            className="mb-2 h-[68px] w-14 bg-white object-contain p-1"
          />
          <h2 className="font-serif text-base font-bold text-white">Institute of Engineering and Rural Technology</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            26, Chaitham Lines, Near Prayag Railway Station,<br />
            Prayagraj - 211002 (U.P.), India
          </p>
          <address className="mt-3 space-y-2 text-sm not-italic text-slate-400">
            <p><span className="mr-2 text-amber-400">Phone</span><a className="transition hover:text-white" href="tel:+9153226597135">+91-532-2659-7135</a></p>
            <p><span className="mr-2 text-amber-400">Email</span><a className="transition hover:text-white" href="mailto:cse@iert.ac.in">cse@iert.ac.in</a></p>
            <p><span className="mr-2 text-amber-400">Web</span><a className="transition hover:text-white" href="https://www.iert.ac.in" target="_blank" rel="noreferrer">www.iert.ac.in</a></p>
          </address>
        </div>

        {footerLinks.map((group, index) => (
          <nav key={index} aria-label={index === 0 ? 'Quick links' : 'Explore'}>
            <h2 className="text-sm font-bold uppercase text-white">{index === 0 ? 'Quick Links' : 'Explore'}</h2>
            <div className="mb-4 mt-3 h-[3px] w-9 bg-amber-400" />
            <ul className="space-y-3">
              {group.map((link) => (
                <li key={link.label}>
                  {'external' in link && link.external ? (
                    <a href={link.href} target="_blank" rel="noreferrer" className="text-sm text-slate-300 transition hover:text-amber-300">{link.label}</a>
                  ) : (
                    <Link href={link.href} className="text-sm text-slate-300 transition hover:text-amber-300">{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <section aria-labelledby="department-stats-heading">
          <h2 id="department-stats-heading" className="text-sm font-bold uppercase text-white">Department at a Glance</h2>
          <div className="mb-4 mt-3 h-[3px] w-9 bg-amber-400" />
          <dl className="grid grid-cols-2 gap-3">
            {[
              ['2001', 'Established'],
              ['60', 'Intake / Year'],
              ['10+', 'Faculty'],
              ['500+', 'Alumni'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-center">
                <dt className="font-serif text-2xl font-bold text-amber-400">{value}</dt>
                <dd className="mt-1 text-xs text-slate-400">{label}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="border-t border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-[1428px] flex-col items-center gap-2 text-center text-xs text-slate-400 lg:flex-row lg:justify-between lg:text-left">
          <p>&copy; {new Date().getFullYear()} CSE Society, IERT Prayagraj. All Rights Reserved.</p>
          <p>Affiliated with <strong className="font-semibold text-slate-300">AKTU, Lucknow</strong> | Approved by <strong className="font-semibold text-slate-300">AICTE, New Delhi</strong></p>
          <p>Designed &amp; developed by <a href="https://www.linkedin.com/in/vibhanshu-tiwari-a08777289/" target="_blank" rel="noreferrer" className="font-semibold text-amber-300 underline decoration-amber-400/50 underline-offset-2 transition hover:text-amber-200">VBHT08</a></p>
        </div>
      </div>
    </footer>
  );
}