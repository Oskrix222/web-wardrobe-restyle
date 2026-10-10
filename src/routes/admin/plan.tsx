import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { WeekPlanBox } from "@/components/admin/CalendarSidebar";

// Ustawienia → Plan tygodnia: the default days/hours for every new week and the blog
// authors. Moved out of the calendar so the calendar only shows the work to do.
export const Route = createFileRoute("/admin/plan")({
  head: () => ({
    meta: [{ title: "Plan tygodnia — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminWeekPlan,
});

function AdminWeekPlan() {
  return (
    <AdminShell>
      <div className="admin-settings">
        <h1>Plan tygodnia</h1>
        <p className="admin-settings__hint">
          Każda nowa paczka trafia do kalendarza w te dni i o tych godzinach. Zmiana działa na
          kolejne paczki – już zaplanowane pozycje przestawisz w ich kartach w Kalendarzu.
        </p>
        <div className="admin-settings__box">
          <WeekPlanBox heading={false} />
        </div>
      </div>
    </AdminShell>
  );
}
