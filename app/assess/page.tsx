import { Metadata } from "next";
import { AssessForm } from "@/components/AssessForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Get your NEET counselling plan | Neetmap",
  description: "Enter your NEET score, category, and state to get a personalised free counselling action plan.",
};

export default function AssessPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="px-4 py-10 flex flex-col items-center">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Get your personalised counselling plan
          </h1>
          <p className="text-sm text-muted-foreground">
            Free | No login | Results in under 10 seconds
          </p>
        </div>
        <AssessForm />
      </div>
      </div>
    </main>
  );
}
