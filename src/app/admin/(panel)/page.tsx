import Link from "next/link";
import { AlertTriangle, FilePen, FileText, Globe, Images, Layers, UserRound } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/list-footer";
import { formatBytes, formatDateTime } from "@/lib/format";
import { dashboardStats } from "@/lib/queries/admin";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const s = await dashboardStats();
  const cards = [
    { label: "Total articles", value: s.total, icon: FileText, href: "/admin/articles" },
    { label: "Published", value: s.published, icon: Globe, href: "/admin/articles?status=published" },
    { label: "Drafts", value: s.drafts, icon: FilePen, href: "/admin/articles?status=draft" },
    { label: "Authors", value: s.authorCount, icon: UserRound, href: "/admin/authors" },
    { label: "Sections", value: s.sectionCount, icon: Layers, href: "/admin/sections" },
    { label: `Media (${formatBytes(s.mediaBytes)})`, value: s.mediaCount, icon: Images, href: "/admin/media" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <AdminPageHeader title="Dashboard" description="Live figures from the content database." />

      {s.openIssues > 0 && (
        <Link
          href="/admin/migration"
          className="flex items-center gap-3 rounded-lg border border-gold-500/40 bg-gold-200/40 p-4 text-sm text-heritage-950 hover:bg-gold-200/60"
        >
          <AlertTriangle className="size-5 shrink-0 text-gold-700" aria-hidden="true" />
          <span>
            <strong>{s.openIssues}</strong> unresolved migration {s.openIssues === 1 ? "issue needs" : "issues need"} review.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md sm:p-5">
            <Icon className="size-4 text-gold-600 sm:size-5" aria-hidden="true" />
            <p className="mt-2 font-heading text-lg font-bold text-heritage-900 sm:text-2xl">{value}</p>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card" aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="border-b border-border px-4 py-3 font-heading font-semibold text-heritage-900 sm:px-6">
            Recently updated articles
          </h2>
          <ul className="divide-y divide-border">
            {s.recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <Link href={`/admin/articles/${a.id}`} className="line-clamp-1 font-medium text-heritage-900 hover:underline">
                    {a.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.updatedAt)}</p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-card" aria-labelledby="activity-heading">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <h2 id="activity-heading" className="font-heading font-semibold text-heritage-900">
              Recent activity
            </h2>
            <Link href="/admin/activity" className="text-sm text-heritage-700 hover:underline">
              View all
            </Link>
          </div>
          {s.activity.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground sm:px-6">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {s.activity.map((a) => (
                <li key={a.id} className="px-4 py-3 text-sm sm:px-6">
                  <span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.action.replace(/_/g, " ")}</span>{" "}
                  {a.entity !== "session" && (
                    <span>
                      {a.entity} {a.entityId ? `#${a.entityId}` : ""}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
