import Link from "next/link";
import {
  FileText,
  GraduationCap,
  HeartHandshake,
  ListChecks,
  MessageSquareShare,
  ShieldAlert,
  Target,
} from "lucide-react";
import { DeadlineBanner } from "@/components/DeadlineBanner";
import { HeroScene } from "@/components/HeroScene";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <DeadlineBanner />

      <section className="hero-shell">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">
              <ShieldAlert size={15} aria-hidden="true" />
              Free, private, no login, no ads
            </span>
            <h1 className="hero-title">
              NEET counselling without the noise<span>.</span>
            </h1>
            <p className="hero-lede">
              Enter your score, category, state, and budget preference. Get a practical
              counselling plan with eligible colleges, document checks, deadline awareness,
              and risk warnings in one clean workflow.
            </p>
            <div className="hero-actions">
              <Link href="/assess" className="primary-link">
                Assess my NEET score
              </Link>
              <Link href="/how-it-works" className="secondary-link">
                Read the counselling guide
              </Link>
            </div>
            <div className="trust-row" aria-label="Product highlights">
              <div className="trust-metric">
                <strong>60 sec</strong>
                <span>Typical input time, with no account required.</span>
              </div>
              <div className="trust-metric">
                <strong>2025 data</strong>
                <span>Cutoffs are labelled clearly and never treated as guarantees.</span>
              </div>
              <div className="trust-metric">
                <strong>2 tracks</strong>
                <span>AIQ and state quota guidance shown side by side.</span>
              </div>
            </div>
          </div>
          <HeroScene />
        </div>
      </section>

      <section className="section-band">
        <div className="section-inner">
          <div className="section-heading">
            <h2>What the plan covers</h2>
            <p>
              The tool focuses on the decisions students actually face during counselling:
              where to register, how to sequence choices, which documents can delay reporting,
              and which paid claims deserve caution.
            </p>
          </div>
          <div className="feature-grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="feature-card">
                <feature.icon aria-hidden="true" />
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="section-inner">
          <div className="section-heading">
            <h2>A direct counselling workflow</h2>
            <p>
              Built for students and families who need a disciplined plan, not a sales call.
              Every screen stays focused on the next decision.
            </p>
          </div>
          <div className="process-grid">
            {PROCESS.map((item, index) => (
              <article key={item.title} className="process-card">
                <strong>{index + 1}</strong>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band">
        <div className="section-inner">
          <div className="notice-panel">
            <HeartHandshake aria-hidden="true" className="mb-3 h-7 w-7 text-primary" />
            <h2>Free because the stakes are real</h2>
            <p>
              Private counselling can be expensive, confusing, and uneven in quality. This
              tool gives students a structured starting point without ads, sponsored college
              placements, premium tiers, login walls, or fabricated certainty.
            </p>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p>NEET Counselling Navigator | Free, always | Not affiliated with NTA or MCC</p>
          <nav aria-label="Footer links">
            <Link href="/how-it-works">How it works</Link>
            <Link href="/deadlines">Deadline calendar</Link>
            <a href="https://mcc.nic.in" target="_blank" rel="noopener noreferrer">
              MCC Portal
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}

const FEATURES = [
  {
    icon: Target,
    title: "Eligible college ranges",
    desc: "Government, central, and eligible state quota options are grouped by realistic safety bands.",
  },
  {
    icon: ListChecks,
    title: "Action plan",
    desc: "Clear next steps for MCC registration, state registration, choice filling, and allotment decisions.",
  },
  {
    icon: GraduationCap,
    title: "Round strategy",
    desc: "Plain-language guidance for freeze, float, slide, mop-up, and stray vacancy decisions.",
  },
  {
    icon: ShieldAlert,
    title: "Risk warnings",
    desc: "Specific alerts for capitation fees, consultant claims, bond obligations, and private fee exposure.",
  },
  {
    icon: FileText,
    title: "Document checklist",
    desc: "Personalized AIQ and state quota document requirements with timing risk highlighted.",
  },
  {
    icon: MessageSquareShare,
    title: "Shareable summary",
    desc: "A results link can be shared with family without screenshots or account access.",
  },
];

const PROCESS = [
  {
    title: "Enter your profile",
    desc: "Score, category, state, and budget preference are enough to build the first plan.",
  },
  {
    title: "Review eligibility",
    desc: "See AIQ and state quota options with safety labels and prior cutoff context.",
  },
  {
    title: "Follow the plan",
    desc: "Work through the registration, choice filling, document, and reporting checklist.",
  },
  {
    title: "Track deadlines",
    desc: "Use the deadline view alongside official MCC and state DME announcements.",
  },
];
