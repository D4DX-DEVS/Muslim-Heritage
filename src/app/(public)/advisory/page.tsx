import type { Metadata } from "next";
import { BoardPage } from "@/components/site/board-page";

export const metadata: Metadata = {
  title: "Advisory Board",
  description: "Advisory Board of the Kerala Muslim Heritage Foundation.",
  alternates: { canonical: "/advisory" },
};

export default function Page() {
  return <BoardPage board="advisory" />;
}
