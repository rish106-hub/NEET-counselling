import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand-mark" aria-label="Neetmap home">
        <span className="brand-symbol">N</span>
        <span className="brand-copy">
          <span>Neetmap</span>
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
