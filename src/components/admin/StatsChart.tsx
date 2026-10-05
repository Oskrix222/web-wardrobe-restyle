export type ChartDay = { day: string; views: number; contactClicks: number };

const shortDate = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short" });

/** Daily views as bars, with contact clicks as the darker inner bar. Plain CSS, no chart lib. */
export function StatsChart({ days }: { days: ChartDay[] }) {
  const max = Math.max(1, ...days.map((d) => d.views));
  // Label roughly every 7th day so 90 bars stay readable.
  const labelEvery = Math.max(1, Math.round(days.length / 7));

  return (
    <div className="stats-chart">
      <div className="stats-chart__legend">
        <span className="stats-chart__key stats-chart__key--views">Wyświetlenia</span>
        <span className="stats-chart__key stats-chart__key--clicks">Kliknięcia w kontakt</span>
      </div>

      <div className="stats-chart__plot" role="img" aria-label="Wykres dziennych wyświetleń">
        {days.map((d, i) => {
          const label = shortDate.format(new Date(`${d.day}T12:00:00`));
          return (
            <div
              key={d.day}
              className="stats-chart__col"
              title={`${label}: ${d.views} wyśw., ${d.contactClicks} klik.`}
            >
              <div className="stats-chart__bar" style={{ height: `${(d.views / max) * 100}%` }}>
                <div
                  className="stats-chart__bar-inner"
                  style={{
                    height: d.views ? `${Math.min(1, d.contactClicks / d.views) * 100}%` : 0,
                  }}
                />
              </div>
              <span className="stats-chart__label">
                {i % labelEvery === 0 || i === days.length - 1 ? label : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
