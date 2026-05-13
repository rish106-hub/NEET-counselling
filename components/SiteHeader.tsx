import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark" aria-label="NEET Counselling Navigator home">
        <span className="brand-symbol">N</span>
        <span className="brand-copy">
          <span>NEET</span>
          <span>Counselling Navigator</span>
        </span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/how-it-works">Guide</Link>
        <Link href="/deadlines">Deadlines</Link>
        <Link href="/assess">Assess</Link>
      </nav>
      <ThemeToggle />
    </header>
  );
}
