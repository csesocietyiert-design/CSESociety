import { redirect } from 'next/navigation';

export default function Home() {
  redirect(process.env.NEXT_PUBLIC_HOMEPAGE_URL ?? 'http://localhost:5173');
}
