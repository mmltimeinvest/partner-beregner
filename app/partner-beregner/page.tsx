import { Suspense } from "react";
import ClientPage from "./client-page";

// Slår prerender/SSG fra for ruten og kører altid dynamisk
export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClientPage />
    </Suspense>
  );
}
