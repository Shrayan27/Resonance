import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resonance",
    short_name: "Resonance",
    description: "High-fidelity music streaming player with studio equalization",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c0e",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
