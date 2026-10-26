import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { parseId } from "@/lib/params";
import { getAuthorForEdit } from "@/lib/queries/admin";
import { AuthorForm } from "../_components/author-form";

export const metadata = { title: "Edit author" };

export default async function EditAuthorPage({ params }: PageProps<"/admin/authors/[id]">) {
  const id = parseId((await params).id);
  const data = id ? await getAuthorForEdit(id) : null;
  if (!data) notFound();
  const { author, photo, papers } = data;
  return (
    <>
      <AdminPageHeader
        title={author.name}
        description={`${papers} paper(s) · public page /author/${author.id}`}
        crumbs={[{ label: "Authors", href: "/admin/authors" }, { label: `#${author.id}` }]}
      />
      <AuthorForm
        key={author.updatedAt}
        id={author.id}
        papers={papers}
        initial={{
          name: author.name,
          designation: author.designation,
          bio: author.bio,
          photo: photo ? { id: photo.id, url: `/${photo.key}`, filename: photo.filename, mime: photo.mime, alt: photo.alt, width: photo.width, height: photo.height } : null,
        }}
      />
    </>
  );
}
