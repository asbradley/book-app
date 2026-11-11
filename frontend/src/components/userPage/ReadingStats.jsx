import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Star } from "lucide-react";

// Chart colors: one blue for every data mark (single-series charts need no
// legend), a lighter step of the same ramp for the goal meter's track, and a
// lighter blue for hovered marks. Text always uses Tailwind gray text colors,
// never the data color. Validated for contrast against the white surface.
const MARK = "#2a78d6";
const MARK_HOVER = "#5598e7";
const TRACK = "#cde2fb";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function ReadingStats() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const loadStats = useCallback(async () => {
    try {
      const response = await axios.get("/api/history/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Error loading stats:", err);
      setError("Failed to load your reading stats.");
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!stats) return <p className="text-gray-500 text-sm">Loading stats...</p>;

  const { year, shelves, readThisYear, monthly, ratings, ratedCount, averageRating, topAuthors, goal } =
    stats;

  return (
    <div className="space-y-8">
      {/* Headline numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label={`Read in ${year}`} value={readThisYear} />
        <StatTile label="Reading now" value={shelves.reading} />
        <StatTile label="Want to read" value={shelves.want_to_read} />
        <StatTile
          label="Average rating"
          value={averageRating === null ? "–" : averageRating.toFixed(1)}
          note={ratedCount ? `from ${plural(ratedCount, "rating")}` : "no ratings yet"}
        />
      </div>

      <section>
        <h3 className="font-semibold text-gray-900 mb-3">{year} reading goal</h3>
        <GoalMeter
          year={year}
          readThisYear={readThisYear}
          goal={goal}
          onSaved={(newGoal) => setStats((s) => ({ ...s, goal: newGoal }))}
        />
      </section>

      <section>
        <h3 className="font-semibold text-gray-900 mb-3">Books finished per month, {year}</h3>
        <MonthlyChart monthly={monthly} />
      </section>

      <div className="grid sm:grid-cols-2 gap-8">
        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Your ratings</h3>
          <RatingBars ratings={ratings} ratedCount={ratedCount} />
        </section>

        <section>
          <h3 className="font-semibold text-gray-900 mb-3">Most-read authors</h3>
          {topAuthors.length === 0 ? (
            <p className="text-sm text-gray-500">Finish a few books to see your favorite authors.</p>
          ) : (
            <ol className="space-y-2">
              {topAuthors.map(({ author, count }) => (
                <li key={author} className="flex justify-between text-sm">
                  <span className="text-gray-900">{author}</span>
                  <span className="text-gray-500">{plural(count, "book")}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function StatTile({ label, value, note }) {
  return (
    <div className="p-3 rounded-xl border border-gray-200">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
      {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
    </div>
  );
}

// Progress toward this year's goal, with an inline editor to set/change it
function GoalMeter({ year, readThisYear, goal, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const saveGoal = async (target) => {
    setError("");
    try {
      const response = await axios.put("/api/history/goal", { target });
      onSaved(response.data.goal);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save goal.");
    }
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveGoal(Number(draft));
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <label className="text-sm text-gray-600" htmlFor="goal-input">
          Books to read in {year}:
        </label>
        <input
          id="goal-input"
          type="number"
          min="1"
          max="1000"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-24 text-sm border border-gray-300 rounded-lg px-2 py-1"
        />
        <button type="submit" className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        {goal && (
          <button
            type="button"
            onClick={() => saveGoal(null)}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Remove goal
          </button>
        )}
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  const startEditing = () => {
    setDraft(goal ? String(goal) : "");
    setEditing(true);
  };

  if (!goal) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500">No goal set for {year}.</p>
        <button onClick={startEditing} className="text-sm text-blue-600 hover:underline">
          Set a goal
        </button>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((readThisYear / goal) * 100));
  const reached = readThisYear >= goal;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">{readThisYear}</span> of {plural(goal, "book")}
          {reached && <span className="text-gray-600"> · Goal reached</span>}
        </p>
        <button onClick={startEditing} className="text-sm text-blue-600 hover:underline">
          Edit goal
        </button>
      </div>
      <div
        role="meter"
        aria-label={`${year} reading goal`}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(readThisYear, goal)}
        aria-valuetext={`${readThisYear} of ${goal} books (${percent}%)`}
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: TRACK }}
      >
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: MARK }} />
      </div>
    </div>
  );
}

// Column chart of books finished per month. Each column's slot is its hover and
// keyboard-focus target (larger than the bar itself); a table view lists the
// same values for anyone who can't use the chart.
function MonthlyChart({ monthly }) {
  const [active, setActive] = useState(null);
  const max = Math.max(...monthly);

  if (max === 0) {
    return <p className="text-sm text-gray-500">No books finished yet this year.</p>;
  }

  // Round the axis up to an even number so the midpoint tick is a whole book
  const top = Math.max(2, max % 2 === 0 ? max : max + 1);
  const ticks = [top, top / 2, 0];

  return (
    <div>
      <div className="flex">
        {/* Y-axis tick labels */}
        <div className="relative h-40 w-6 text-xs text-gray-500 tabular-nums">
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute right-2 -translate-y-1/2"
              style={{ top: `${100 - (t / top) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>

        <div className="relative flex-1 h-40">
          {/* Hairline gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-gray-200"
              style={{ top: `${100 - (t / top) * 100}%` }}
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {monthly.map((count, i) => (
              <div
                key={MONTHS[i]}
                role="img"
                tabIndex={0}
                aria-label={`${MONTH_NAMES[i]}: ${plural(count, "book")}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="relative flex-1 h-full flex items-end justify-center outline-none focus-visible:bg-gray-50"
              >
                <div
                  className="w-full max-w-[24px] mx-[2px] rounded-t"
                  style={{
                    height: `${(count / top) * 100}%`,
                    backgroundColor: active === i ? MARK_HOVER : MARK,
                  }}
                />
                {active === i && (
                  <div
                    className="absolute z-10 px-2 py-1 rounded bg-gray-900 text-white text-xs whitespace-nowrap pointer-events-none"
                    style={{ bottom: `calc(${(count / top) * 100}% + 6px)` }}
                  >
                    <strong>{plural(count, "book")}</strong>
                    <span className="text-gray-300"> · {MONTH_NAMES[i]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex ml-6 mt-1">
        {MONTHS.map((m) => (
          <span key={m} className="flex-1 text-center text-xs text-gray-500">
            {m}
          </span>
        ))}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-gray-600">View as table</summary>
        <table className="mt-2 text-left">
          <thead>
            <tr className="text-gray-500">
              <th className="pr-6 font-normal">Month</th>
              <th className="font-normal">Books</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {monthly.map((count, i) => (
              <tr key={MONTHS[i]}>
                <td className="pr-6 text-gray-900">{MONTH_NAMES[i]}</td>
                <td className="text-gray-900">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// Horizontal bars, 5 stars to 1, each labeled with its count at the tip
function RatingBars({ ratings, ratedCount }) {
  if (ratedCount === 0) {
    return <p className="text-sm text-gray-500">Rate some books to see how you score them.</p>;
  }

  const max = Math.max(...Object.values(ratings));

  return (
    <ul className="space-y-2">
      {[5, 4, 3, 2, 1].map((stars) => {
        const count = ratings[stars];
        const percent = Math.round((count / ratedCount) * 100);
        return (
          <li
            key={stars}
            className="flex items-center gap-2 text-sm"
            aria-label={`${plural(stars, "star")}: ${plural(count, "book")} (${percent}%)`}
          >
            <span className="flex items-center gap-0.5 w-8 text-gray-600 tabular-nums" aria-hidden="true">
              {stars}
              <Star className="w-3 h-3 fill-gray-400 text-gray-400" />
            </span>
            <div className="flex-1 flex items-center gap-2" aria-hidden="true" title={`${percent}% of rated books`}>
              {count > 0 && (
                <div
                  className="h-3 rounded-r"
                  style={{ width: `${(count / max) * 85}%`, backgroundColor: MARK }}
                />
              )}
              <span className="text-gray-900 tabular-nums">{count}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
