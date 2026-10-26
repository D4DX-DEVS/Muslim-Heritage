// Organisation details as published on the legacy site (/contact, footer).
export const SITE = {
  name: "Kerala Muslim Heritage Foundation",
  shortName: "Muslim Heritage",
  nameMl: "കേരള മുസ്‌ലിം ഹെറിറ്റേജ് ഫൗണ്ടേഷന്‍",
  description:
    "Online edition of the Kerala Muslim History Conference proceedings — research papers on the history, culture and heritage of Kerala's Muslims.",
  address: ["Kerala Muslim Heritage", "Hira Centre, PB.833", "Kozhikode"],
  phone: "+91 9946 81 69 96",
  email: "heritagestudy13@gmail.com",
  facebook: "https://www.facebook.com/muslimheritage.in",
  conferenceId: 1,
} as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/confindex/1", label: "Proceedings" },
  { href: "/articles", label: "Articles" },
  { href: "/authors", label: "Authors" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
