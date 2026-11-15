import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { routes } from "@/config/site";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col">
      <Container className="flex flex-1 flex-col justify-center py-20">
        <Logo />
        <p className="text-eyebrow mt-12 text-violet-ink">Error 404</p>
        <h1 className="text-display-sm mt-4 max-w-[30rem] text-ink">
          This page moved out of frame.
        </h1>
        <p className="text-lead mt-4 max-w-[34rem] text-muted-strong">
          The page you were looking for is not here. Every public Pixelise page
          is reachable from the links below.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={routes.home}>Back to home</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={routes.examples}>See examples</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href={routes.contact}>Contact support</Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
