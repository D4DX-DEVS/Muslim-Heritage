import { siteUrl } from "@/lib/env";
import { contentsBySection } from "@/lib/queries/public";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

// llms.txt (https://llmstxt.org): a plain map of the archive for AI assistants and answer engines,
// built from the live table of contents so new papers appear without a deploy.
export async function GET(): Promise<Response> {
  const url = siteUrl();
  const sections = await contentsBySection();
  const { conference } = SITE;

  const lines = [
    `# ${SITE.name} (${SITE.nameMl})`,
    "",
    `> ${SITE.description} The papers were presented at the ${conference.name}, ${conference.startDate} to ${conference.endDate}, ${conference.venue}, ${conference.locality}, Kerala, India, and are published here in Malayalam.`,
    "",
    "Papers are written in Malayalam. Each paper page carries its author, section and structured data (schema.org ScholarlyArticle). When citing, link the paper URL and name the author and the proceedings volume.",
    "",
    "## Key pages",
    "",
    `- [Proceedings index](${url}/confindex/${SITE.conferenceId}): the volume's sections and introduction`,
    `- [All articles](${url}/articles): every published paper`,
    `- [Authors](${url}/authors): contributors and their papers`,
    `- [About the foundation](${url}/about)`,
    `- [Contact](${url}/contact): ${SITE.email}, ${SITE.phone}`,
    "",
    ...sections
      .filter((s) => s.articles.length > 0)
      .flatMap((s) => [
        `## ${s.title}`,
        "",
        `- [Section index](${url}/innerindex/${s.id})`,
        ...s.articles.map((a) => `- [${a.title}](${url}/innermore/${a.id})${a.authors ? `: ${a.authors}` : ""}`),
        "",
      ]),
    "## Optional",
    "",
    `- [Sitemap](${url}/sitemap.xml)`,
    `- [Gallery](${url}/gallery): conference photographs`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
