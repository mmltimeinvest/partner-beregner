"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import NextImage from "next/image";

/* ---------- Formatters ---------- */
const fmtDKK = (n: number) =>
  n.toLocaleString("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 });
const fmtPct = (n: number) =>
  `${(n * 100).toLocaleString("da-DK", { maximumFractionDigits: 2 })}%`;

// maks 2 decimaler (tekstvisning m. dansk komma)
const fmtMax2 = (n: number) =>
  new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(n);

// sikker afrunding til 2 decimaler
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/* ---------- Inputs (skrivbare, ingen pile) ---------- */

// Procentinput: viser/forventer fx 0,85 (svarer til 0.85%)
function PercentInput({
  value, onChange, placeholder,
}: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  const [text, setText] = useState<string>(fmtMax2(value * 100));
  useEffect(() => setText(fmtMax2(value * 100)), [value]);

  const commit = () => {
    const cleaned = text.trim().replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    if (!isNaN(n) && isFinite(n) && n >= 0) {
      const r = round2(n);
      onChange(r / 100);
      setText(fmtMax2(r));
    } else {
      setText(fmtMax2(value * 100));
    }
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
    />
  );
}

// Almindeligt tal (bruges her til mio. kr.)
function NumberInput({
  value, onChange, placeholder, min,
}: { value: number; onChange: (v: number) => void; placeholder?: string; min?: number }) {
  const [text, setText] = useState<string>(String(value).replace(".", ","));
  useEffect(() => setText(String(value).replace(".", ",")), [value]);

  const commit = () => {
    const cleaned = text.trim().replace(/\./g, "").replace(/\s/g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    if (!isNaN(n) && isFinite(n) && (min === undefined || n >= min)) onChange(n);
    else setText(String(value).replace(".", ","));
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
    />
  );
}

/* ---------- Små layout helpers ---------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid" }}>
      <span style={{ fontSize: 13, color: "#374151", marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="ti-kpi">
      <span className="ti-muted">{label}</span>
      <strong className={accent ? "ti-positive" : ""}>{value}</strong>
    </div>
  );
}

/* ---------- Siden ---------- */
export default function ClientPage() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const getQ = (key: string, fallback: number) => {
    const v = sp.get(key);
    if (v === null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };
  const getNum = (key: string): number | null => {
    const v = sp.get(key);
    if (v === null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  // Inputs
  // Portefølje i mio. kr. (pm). Backwards compat: hvis der findes gammel p i DKK og det ligner et stort tal, konverter til mio.
  const [portefoljeMio, setPortefoljeMio] = useState<number>(() => {
    const pm = getNum("pm");
    if (pm !== null) return pm;
    const pOld = getNum("p");
    if (pOld !== null) return pOld >= 10_000_000 ? Math.round(pOld / 1_000_000) : pOld;
    return 1000; // default: 1.000 mio. kr.
  });

  const [andelMed, setAndelMed] = useState<number>(getQ("a", 0.30));
  const [raadgPct, setRaadgPct] = useState<number>(getQ("rf", 0.006));
  const [kurtagePct, setKurtagePct] = useState<number>(getQ("k", 0.0));
  const [tiAndel, setTiAndel] = useState<number>(getQ("ti", 0.40));
  const [aarligVaekstMio, setAarligVaekstMio] = useState<number>(getQ("g", 30));

  const [currPortefOmk, setCurrPortefOmk] = useState<number>(getQ("cpo", 0.012));
  const [expPortefOmk, setExpPortefOmk] = useState<number>(getQ("epo", 0.008));
  const [currFee, setCurrFee] = useState<number>(getQ("cf", 0.0035));
  const [expFee, setExpFee] = useState<number>(getQ("ef", 0.006));

  // Opdater URL (uden scroll) – skriv pm (mio.) og undgå unødige replaces
  useEffect(() => {
    const nextQ = new URLSearchParams({
      pm: String(portefoljeMio),
      a: String(andelMed),
      rf: String(raadgPct),
      k: String(kurtagePct),
      ti: String(tiAndel),
      g: String(aarligVaekstMio),
      cpo: String(currPortefOmk),
      epo: String(expPortefOmk),
      cf: String(currFee),
      ef: String(expFee),
    }).toString();

    const currentQ = sp.toString();
    if (currentQ !== nextQ) {
      router.replace(`${pathname}?${nextQ}`, { scroll: false });
    }
  }, [
    portefoljeMio, andelMed, raadgPct, kurtagePct, tiAndel, aarligVaekstMio,
    currPortefOmk, expPortefOmk, currFee, expFee, router, pathname, sp
  ]);

  // Beregninger (konverter mio. kr. til DKK)
  const aum0 = useMemo(() => (portefoljeMio * 1_000_000) * andelMed, [portefoljeMio, andelMed]);
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

  const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 };

  return (
    <main className="ti-container">
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h1 className="ti-h1">Partnerindtjeningsmodel</h1>
        {/* Logo ude til højre */}
        <NextImage
          src="/timeinvest-logo.png"   // filen ligger i /public/timeinvest-logo.png
          alt="TimeInvest"
          width={150}
          height={36}
          priority
          style={{ marginLeft: "auto", height: "auto", width: "150px" }}
        />
      </header>

      <p className="ti-muted" style={{ marginBottom: 16 }}>
        Just antagelserne og se effekten på indtjeningen og kundens besparelse.
      </p>

      <div style={grid2}>
        <section className="ti-card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Antagelser</h2>
          <div style={{ display: "grid", gap: 12 }}>
            <Field label="Portefølje (mio. kr.)">
              <NumberInput value={portefoljeMio} onChange={setPortefoljeMio} min={0} />
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

        <section className="ti-card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Nøgletal (år 1)</h2>
          <KPI label="AuM" value={fmtDKK(topline.aum)} />
          <KPI label="Bruttoindtægt" value={fmtDKK(topline.brutto)} />
          <KPI label="TI-andel" value={`${fmtDKK(topline.tiShare)} (${fmtPct(tiAndel)})`} />
          <div className="ti-kpi">
            <span className="ti-muted">Egen indtjening</span>
            <strong>{fmtDKK(topline.egen)}</strong>
          </div>
        </section>
      </div>

      <section className="ti-card" style={{ marginTop: 16 }}>
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
                <td>{r.year}</td>
                <td>{fmtDKK(r.aum)}</td>
                <td>{fmtDKK(r.raadg)}</td>
                <td>{kurtagePct === 0 ? "-" : fmtDKK(r.kurtage)}</td>
                <td>{fmtDKK(r.brutto)}</td>
                <td>{fmtDKK(r.tiShare)}</td>
                <td style={{ fontWeight: 600 }}>{fmtDKK(r.egen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div style={{ ...grid2, marginTop: 16 }}>
        <section className="ti-card">
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

        <section className="ti-card">
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Besparelse pr. 100 mio. kr.</h2>
          <div className="ti-kpi">
            <span className="ti-muted">Sparede porteføljeomkostninger</span>
            <strong>{fmtDKK(sparedePortef)}</strong>
          </div>
          <div className="ti-kpi">
            <span className="ti-muted">Mer-/mindre rådgivningsfee</span>
            <strong>{fmtDKK(diffFee)}</strong>
          </div>
          <div className="ti-kpi">
            <span className="ti-muted">Netto besparelse</span>
            <strong className={netto >= 0 ? "ti-positive" : "ti-negative"}>{fmtDKK(netto)}</strong>
          </div>
          {/* Forklarende tekst er fjernet efter ønske */}
        </section>
      </div>
    </main>
  );
}
