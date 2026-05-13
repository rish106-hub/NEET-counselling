import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";

export default function NotFound() {
  return (
    <main className="min-h-screen">
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-primary mb-4">404</p>
      <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        If you had a saved results link, it may have expired (links last 90 days).
        Generate a new plan below.
      </p>
      <Link href="/assess">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Get new counselling plan
        </Button>
      </Link>
      </div>
    </main>
  );
}
