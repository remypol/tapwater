import { HARDNESS_BANDS, SOFTENER_THRESHOLD_MGL } from "@/lib/softener-guides";

/**
 * The hardness scale as a single ruled bar, with the softener threshold marked.
 *
 * Widths are proportional to each band's span so "very hard" reads as the wide
 * territory it is: more than half of England sits in it. Static, server-rendered,
 * and the same on every page that uses it.
 */
export function HardnessBands({
  caption = "Hardness in mg/L as calcium carbonate, the scale UK water companies report in.",
}: {
  caption?: string;
}) {
  const max = HARDNESS_BANDS[HARDNESS_BANDS.length - 1].to;
  const thresholdPct = (SOFTENER_THRESHOLD_MGL / max) * 100;

  return (
    <figure className="my-8">
      <div className="relative pt-7">
        {/* Threshold marker */}
        <div
          className="absolute top-0 flex flex-col items-center -translate-x-1/2"
          style={{ left: `${thresholdPct}%` }}
          aria-hidden="true"
        >
          <span className="font-mono text-[11px] text-amber-700 whitespace-nowrap">
            softener territory from {SOFTENER_THRESHOLD_MGL}
          </span>
          <span className="w-px h-3 bg-amber-500" />
        </div>

        <ol className="flex w-full h-10 rounded-md overflow-hidden ring-1 ring-rule">
          {HARDNESS_BANDS.map((band, i) => {
            const width = ((band.to - band.from) / max) * 100;
            const shade = [
              "bg-sky-100 text-sky-900",
              "bg-sky-200 text-sky-950",
              "bg-amber-100 text-amber-900",
              "bg-amber-200 text-amber-950",
              "bg-amber-400 text-amber-950",
            ][i];
            return (
              <li
                key={band.label}
                style={{ width: `${width}%` }}
                className={`${shade} flex items-center justify-center overflow-hidden`}
                title={`${band.label}: ${band.from}–${band.to} mg/L`}
              >
                <span
                  className={`text-xs font-medium px-1 truncate ${
                    // The 180–200 band is a sliver; its label only fits on wide screens.
                    band.to - band.from < 40 ? "hidden lg:inline" : ""
                  }`}
                >
                  {band.label}
                </span>
              </li>
            );
          })}
        </ol>

        <ol className="relative mt-1.5 h-5 font-mono text-[11px] text-muted" aria-hidden="true">
          {HARDNESS_BANDS.filter((band) => band.from !== 180).map((band) => (
            <li
              key={band.from}
              className="absolute -translate-x-1/2"
              style={{ left: `${(band.from / max) * 100}%` }}
            >
              {band.from}
            </li>
          ))}
          <li className="absolute -translate-x-full right-0">{max}+</li>
        </ol>
      </div>

      <figcaption className="text-xs text-muted mt-2">{caption}</figcaption>

      {/* Screen-reader table of the same bands */}
      <dl className="sr-only">
        {HARDNESS_BANDS.map((band) => (
          <div key={band.label}>
            <dt>{band.label}</dt>
            <dd>
              {band.from} to {band.to} mg/L
            </dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
