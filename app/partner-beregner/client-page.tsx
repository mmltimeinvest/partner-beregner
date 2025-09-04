"use client";

import type React from "react";
import NextImage from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/* ---------------------- Formattere ---------------------- */
const fmtDKK = (n: number) =>
  n.toLocaleString("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 });

const fmtPct = (n: number) =>
  `${(n * 100).toLocaleString("da-DK", { maximumFractionDigits: 2 })}%`;

/* ----------------- Hjælpere til query/URL ---------------- */
function useQ(key: string, fallback: number) {
  const sp = useSearchParams();
  const v = sp.get(key);
  if (v === null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/* --------------- Inputs uden pile (skrivbare) --------------- */

/** Vis/skriv procent som 1,2 men gem 0.012. Max 2 decimaler. */
function PercentInput({
  value, // 0..1
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  // vis max 2 decimaler, fjern trailing nuller
  const toText = (v: number) => {
    const p = Math.round(v * 10000) / 100; // v*100 med 2 decimaler
    let s = p.toFixed(2).replace(".", ",");
    s = s.replace(/0+$/g, "").replace(/,$/, ""); // fjern overflødige nuller og evt. komma
    return s;
  };

  const [text, setText] = useState<string>(toText(value));
  useEffect(() => setText(toText(value)), [value]);

  const commit = () => {
    const cleaned = text.trim().replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    if (!isNaN(n) && isFinite(n) && n >= 0) onChange(n / 100);
    else setText(toText(value));
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className="ti-input"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      placeholder={placeholder ?? "0,00"}
      style={{ maxWidth: 160 }}
    />
  );
}

/** Generelle talfelter (DKK/mio. kr.) – komma eller punktum tilladt. */
function NumberInput({
  value,
  onChange,
  placeholder,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
  min?: number;
}) {
  const toText = (v: number) => {
    let s = String(v).replace(".", ",");
    return s;
  };

  const [text, setText] = useState<string>(toText(value));
  useEffect(() => setText(toText(value)), [value]);

  const commit = () => {
    const cleaned = text
      .trim()
      .replace(/\./g, "") // fjern tusindtals-punkter
      .replace(/\s/g, "")
      .replace(",", ".");
    const n = parseFloat(cleaned);
    if (!isNaN(n) && isFinite(n) && (min === undefined || n >= min)) onChange(n);
    else setText(toText(value));
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className="ti-input"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && commit()}
      placeholder={placeholder}
      style={{ maxWidth: 240 }}
    />
  );
}

/* ---------------------- Små UI-hjælpere ---------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid" }}>
      <span style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: "green" | "red" }) {
  const color = accent === "green" ? "#047857" : accent === "red" ? "#b91c1c" : "var(--color-ink)";
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
      <span className="ti-muted">{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

const card: CSSProperties = { padding: 16, border: "1px solid var(--color-primary)", borderRadius: 12, background: "var(--color-white)", boxShadow: "0 1px 2px rgba(0,0,0,.04)" };
const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 };
const td: CSSProperties = { padding: "8px 10px", borderBottom: "1px solid var(--color-primary)" };

/* ========================== Hovedkomponenten ========================== */

export default function ClientPage() {
  const router = useRouter();
  const pathname = usePathname();

  /* --------- Inputs (default fra regnearket) – sync til URL --------- */
  const [portefolje, setPortefolje] = useState<number>(useQ("p", 1_000_000_000));
  const [andelMed, setAndelMed] = useState<number>(useQ("a", 0.30));
  const [raadgPct, setRaadgPct] = useState<number>(useQ("rf", 0.005)); // 0,5%
  const [kurtagePct, setKurtagePct] = useState<number>(useQ("k", 0.0));
  const [tiAndel, setTiAndel] = useState<number>(useQ("ti", 0.40));
  const [aarligVaekstMio, setAarligVaekstMio] = useState<number>(useQ("g", 30));

  const [currPortefOmk, setCurrPortefOmk] = useState<number>(useQ("cpo", 0.012));
  const [expPortefOmk, setExpPortefOmk] = useState<number>(useQ("epo", 0.006));
  const [currFee, setCurrFee] = useState<number>(useQ("cf", 0.003));
  const [expFee, setExpFee] = useState<number>(useQ("ef", 0.006));

  // Synkronisér til URL (uden at scrolle siden)
  useEffect(() => {
    const q = new URLSearchParams({
      p: String(Math.round(portefolje)),
      a: String(andelMed),
      rf: String(raadgPct),
      k: String(kurtagePct),
      ti: String(tiAndel),
      g: String(aarligVaekstMio),
      cpo: String(currPortefOmk),
      epo: String(expPortefOmk),
      cf: String(currFee),
      ef: String(expFee),
    });
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }, [
    portefolje,
    andelMed,
    raadgPct,
    kurtagePct,
    tiAndel,
    aarligVaekstMio,
    currPortefOmk,
    expPortefOmk,
    currFee,
    expFee,
    pathname,
    router,
  ]);

  /* --------------------------- Beregninger --------------------------- */
  const aum0 = useMemo(() => portefolje * andelMed, [portefolje, andelMed]);
  const growth = useMemo(() => aarligVaekstMio * 1_000_000, [aarligVaekstMio]);

  type Row = { year: number; aum: number; raadg: number; kurtage: number; brutto: number; tiShare: number; egen: number };
  const rows: Row[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const aum = aum0 + growth * i;
        const raadg = aum * raadgPct;
        const kurtage = aum * kurtagePct;
        const brutto = raadg + kurtage;
        const tiShare = brutto * tiAndel;
        const egen = brutto - tiShare;
        return { year: i + 1, aum, raadg, kurtage, brutto, tiShare, egen };
      }),
    [aum0, growth, raadgPct, kurtagePct, tiAndel]
  );

  const topline = rows[0];

  // Kundens besparelse pr. 100 mio.
  const per100m = 100_000_000;
  const sparedePortef = (currPortefOmk - expPortefOmk) * per100m;
  const diffFee = (expFee - currFee) * per100m;
  const netto = sparedePortef - diffFee;

  /* ------------------------------- UI ------------------------------- */

  return (
    <main className="ti-container">
      {/* Header: titel (primær) + TimeInvest logo til højre */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 className="ti-h1">Partnerindtjeningsmodel</h1>
        <NextImage
          src="/timeinvest-logo.png"
          alt="TimeInvest"
          width={150}
          height={36}
          priority
          style={{ marginLeft: "auto", height: "auto", width: "150px" }}
        />
      </header>

      <p className="ti-muted" style={{ marginBottom: 16 }}>
        Leg med antagelserne og se effekten på indtjeningen og kundens besparelse.
      </p>

      <div style={grid2}>
        <section style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Antagelser</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Portefølje (DKK)">
              <NumberInput value={portefolje} onChange={setPortefolje} min={0} />
            </Field>
            <Field label={`Andel med (${fmtPct(andelMed)})`}>
              <PercentInput value={andelMed} onChange={setAndelMed} />
            </Field>
            <Field label={`Rådgivningsfee (${fmtPct(raadgPct)})`}>
              <PercentInput value={raadgPct} onChange={setRaadgPct} />
            </Field>
            <Field label={`Kurtage (${fmtPct(kurtagePct)})`}>
              <PercentInput value={kurtagePct} onChange={setKurtagePct} />
            </Field>
            <Field label={`TimeInvest andel (${fmtPct(tiAndel)})`}>
              <PercentInput value={tiAndel} onChange={setTiAndel} />
            </Field>
            <Field label="Årlig vækst (mio. kr.)">
              <NumberInput value={aarligVaekstMio} onChange={setAarligVaekstMio} min={0} />
            </Field>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Nøgletal (år 1)</h2>
          <KPI label="AuM" value={fmtDKK(topline.aum)} />
          <KPI label="Bruttoindtægt" value={fmtDKK(topline.brutto)} />
          <KPI label="TI-andel" value={`${fmtDKK(topline.tiShare)} (${fmtPct(tiAndel)})`} />
          <KPI label="Egen indtjening" value={fmtDKK(topline.egen)} />
        </section>
      </div>

      <section style={{ ...card, marginTop: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>5-årigt overblik</h2>
        <table className="ti-table">
          <thead>
            <tr>
              {["År", "AuM", "Rådgivningsfee", "Kurtage", "Brutto", "TI-andel", "Egen indtjening"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.year}>
                <td style={td}>{r.year}</td>
                <td style={td}>{fmtDKK(r.aum)}</td>
                <td style={td}>{fmtDKK(r.raadg)}</td>
                <td style={td}>{kurtagePct === 0 ? "-" : fmtDKK(r.kurtage)}</td>
                <td style={td}>{fmtDKK(r.brutto)}</td>
                <td style={td}>{fmtDKK(r.tiShare)}</td>
                <td style={{ ...td, fontWeight: 600 }}>{fmtDKK(r.egen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={{ ...grid2, marginTop: 16 }}>
        <section style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Kundens omkostninger</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <Field label={`Nuværende porteføljeomkostninger (${fmtPct(currPortefOmk)})`}>
              <PercentInput value={currPortefOmk} onChange={setCurrPortefOmk} />
            </Field>
            <Field label={`Forventede porteføljeomkostninger (${fmtPct(expPortefOmk)})`}>
              <PercentInput value={expPortefOmk} onChange={setExpPortefOmk} />
            </Field>
            <Field label={`Nuværende rådgivningsfee (${fmtPct(currFee)})`}>
              <PercentInput value={currFee} onChange={setCurrFee} />
            </Field>
            <Field label={`Forventet rådgivningsfee (${fmtPct(expFee)})`}>
              <PercentInput value={expFee} onChange={setExpFee} />
            </Field>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Besparelse pr. 100 mio. kr.</h2>
          <KPI label="Sparede porteføljeomkostninger" value={fmtDKK(sparedePortef)} />
          <KPI label="Mer-/mindre rådgivningsfee" value={fmtDKK(diffFee)} />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span className="ti-muted">Netto besparelse</span>
            <strong className={netto >= 0 ? "ti-positive" : "ti-negative"}>{fmtDKK(netto)}</strong>
          </div>
          <p className="ti-muted" style={{ fontSize: 12, marginTop: 8 }}>
            Netto = (nuværende omk. − forventede omk.) − (forventet fee − nuværende fee).
          </p>
        </section>
      </div>
    </main>
  );
}
