import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
        404
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">
        We couldn't find the page you were looking for.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <MoveLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
