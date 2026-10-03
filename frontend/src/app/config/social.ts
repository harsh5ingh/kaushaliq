import github from "../../assets/social/github.svg";
import linkedin from "../../assets/social/linkedin.svg";
import x from "../../assets/social/x.svg";
import youtube from "../../assets/social/youtube.svg";

export type SocialPlatform = "GitHub" | "LinkedIn" | "X" | "YouTube";
export type SocialLink = { platform: SocialPlatform; href: string; icon: string };

// Only public, absolute HTTPS profile URLs are accepted. Missing/invalid settings stay hidden.
function profileUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
const configured: { platform: SocialPlatform; value: unknown; icon: string }[] = [
  { platform: "GitHub", value: import.meta.env.VITE_GITHUB_URL, icon: github },
  { platform: "LinkedIn", value: import.meta.env.VITE_LINKEDIN_URL, icon: linkedin },
  { platform: "X", value: import.meta.env.VITE_X_URL, icon: x },
  { platform: "YouTube", value: import.meta.env.VITE_YOUTUBE_URL, icon: youtube },
];
export const socialLinks: readonly SocialLink[] = configured.flatMap(({ platform, value, icon }) => {
  const href = profileUrl(value);
  return href ? [{ platform, href, icon }] : [];
});
