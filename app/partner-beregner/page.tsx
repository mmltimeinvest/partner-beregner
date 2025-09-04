// app/partner-beregner/page.tsx
import { Suspense } from "react";
import ClientPage from "./client-page";

// Sørger for at siden ikke forsøges statisk-prerendret
export const dynamic = "force-dynamic";
// (valgfrit alternativ/tilføjelse)
// export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClientPage />
    </Suspense>
  );
}
