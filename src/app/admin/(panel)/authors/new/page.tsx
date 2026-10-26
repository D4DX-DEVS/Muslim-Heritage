import { AdminPageHeader } from "@/components/admin/page-header";
import { AuthorForm } from "../_components/author-form";

export const metadata = { title: "New author" };

export default function NewAuthorPage() {
  return (
    <>
      <AdminPageHeader title="New author" crumbs={[{ label: "Authors", href: "/admin/authors" }, { label: "New" }]} />
      <AuthorForm id={null} papers={0} initial={{ name: "", designation: "", bio: "", photo: null }} />
    </>
  );
}
