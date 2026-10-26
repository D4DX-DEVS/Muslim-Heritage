import { AdminPageHeader } from "@/components/admin/page-header";
import { listBoardMembers } from "@/lib/queries/admin";
import { MemberActions, NewMemberButton } from "./_components/board-controls";

export const metadata = { title: "Boards" };

export default async function AdminBoardsPage() {
  const members = await listBoardMembers();
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Boards" description="Members shown on /director and /advisory." crumbs={[{ label: "Boards" }]} />
      <div className="grid gap-6 xl:grid-cols-2">
        {(["director", "advisory"] as const).map((board) => {
          const list = members.filter((m) => m.board === board);
          return (
            <section key={board} className="rounded-lg border border-border bg-card" aria-labelledby={`${board}-heading`}>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 id={`${board}-heading`} className="font-heading font-semibold text-heritage-900">
                  {board === "director" ? "Director Board" : "Advisory Board"} <span className="text-sm font-normal text-muted-foreground">({list.length})</span>
                </h2>
                <NewMemberButton board={board} nextOrder={Math.max(0, ...list.map((m) => m.sortOrder)) + 1} />
              </div>
              {list.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <ul className="max-h-[36rem] divide-y divide-border overflow-y-auto">
                  {list.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.role}</p>
                      </div>
                      <MemberActions member={m} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
