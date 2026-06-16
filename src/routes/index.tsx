import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import Index from "@/pages/Index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Genau — Interactive German Grammar Cheatsheet" },
      {
        name: "description",
        content:
          "Tap, zoom and explore German cases, pronouns, articles and prepositions on an interactive cheatsheet.",
      },
      { property: "og:title", content: "Genau — Interactive German Grammar Cheatsheet" },
      {
        property: "og:description",
        content:
          "Tap, zoom and explore German cases, pronouns, articles and prepositions on an interactive cheatsheet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IndexRoute,
});

function IndexRoute() {
  // The cheatsheet uses window/document and DOM measurement at mount —
  // render client-only to avoid SSR mismatch.
  return (
    <ClientOnly fallback={<div className="min-h-screen bg-poster-bg" />}>
      <Index />
    </ClientOnly>
  );
}
