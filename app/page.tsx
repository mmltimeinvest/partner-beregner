// app/page.tsx
import { redirect } from "next/navigation";

// gør siden dynamisk (ingen SSG af roden)
export const dynamic = "force-dynamic";

export default function Page(): never {
  redirect("/partner-beregner");
}
