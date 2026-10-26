import type { Metadata } from "next";
import { BoardPage } from "@/components/site/board-page";

export const metadata: Metadata = {
  title: "Director Board",
  description: "Director Board of the Kerala Muslim Heritage Foundation.",
  alternates: { canonical: "/director" },
};

export default function Page() {
  return <BoardPage board="director" />;
}
