import Image from 'next/image';

interface CircularPageHeaderProps {
  title: string;
  description: string;
}

export default function CircularPageHeader({ title, description }: CircularPageHeaderProps) {
  return (
    <header className="relative isolate overflow-hidden border-b border-[#25445b] bg-[#071b2b]">
      <div className="mx-auto flex min-h-56 w-full max-w-6xl items-center gap-6 px-5 py-10 sm:gap-8 sm:px-8 sm:py-12">
        <Image
          src="/logo.png"
          alt="CSE Society IERT logo"
          width={128}
          height={128}
          className="size-24 shrink-0 object-contain drop-shadow-lg sm:size-32"
          priority
        />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200 sm:text-sm">CSE Society · IERT Prayagraj</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
        </div>
      </div>
      <div aria-hidden="true" className="h-px bg-[#25445b]" />
    </header>
  );
}
