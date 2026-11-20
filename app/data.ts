// Brand + mock data. Swap these to rebrand or plug in real numbers.
export const BRAND = { first: "Super", second: "Creator" };

export const user = { firstName: "Alex", fullName: "Alex Morgan" };

export const store = {
  slug: "alexmorgan",
  bio: "Welcome to my SuperCreator!🚀",
};

export const quickAdds = [
  { name: "Carousel", kind: "carousel" },
  { name: "Existing Products", emoji: "📦" },
  { name: "Lead Magnet", emoji: "🧲" },
  { name: "WhatsApp link", color: "#25d366", glyph: "wa" },
  { name: "Referral Link", color: "#1774ff", glyph: "bolt" },
  { name: "CJ Affiliate Link", color: "#0b5c43", glyph: "cj" },
] as const;

export const createAndSell = [
  { title: "Sell Digital Files", text: "Sell E-books, PDF files, Images, videos, and more.", emoji: "📂", bg: "#f6e6dc" },
  { title: "Offer 1-on-1 Session", text: "Set up a new 1-on-1 session to offer to your visitors/audience.", emoji: "📅", bg: "#f1dcef" },
  { title: "Recurring Membership", text: "Start a membership business on Telegram or Discord.", emoji: "💬", bg: "#dfe8f6" },
  { title: "Host Event or Webinar", text: "Sell live event tickets, coaching appointments, or classes.", emoji: "🚀", bg: "#f6e1df" },
  { title: "Sell a course", text: "Sell access to your video collection or online classes.", emoji: "🏅", bg: "#f6f1d2" },
  { title: "Locked Content", text: "Lock any file for a certain price. Visitors unlock to access.", emoji: "🔒", bg: "#f6e3d8" },
  { title: "Sell Affiliate Products", text: "Re-sell courses to earn big in commissions.", emoji: "💵", bg: "#dcf1df" },
];

export const themes = [
  "linear-gradient(160deg,#222 0 30%,#555 30% 45%,#888 45% 60%,#bbb 60%)",
  "linear-gradient(160deg,#ff8c00 0 40%,#ff5100 40% 60%,#8a1c00 60%)",
  "linear-gradient(160deg,#4fc3f7 0 35%,#29a3e8 35% 65%,#0b7bc4 65%)",
  "radial-gradient(circle at 30% 30%,#fff38a,#ffcc00 50%,#f2a900)",
  "linear-gradient(135deg,#ff2bd1,#8a00d4 60%,#3b0066)",
  "linear-gradient(160deg,#ff6a3d 0 30%,#c2185b 30% 60%,#4a148c 60%)",
  "linear-gradient(160deg,#ff4f8b,#a01556 60%,#3a0820)",
  "linear-gradient(160deg,#000 0 30%,#3a0000 30% 50%,#7a0000 50% 70%,#c00000 70%)",
  "repeating-linear-gradient(160deg,#ff6b1a 0 10px,#e34a00 10px 20px)",
  "linear-gradient(160deg,#0a1a5c,#1c3faa 60%,#000)",
];

/* Themes whose top section is too bright for white text */
const lightThemes = new Set([themes[1], themes[2], themes[3], themes[8]]);
export const themeInk = (theme: string) => (lightThemes.has(theme) ? { color: "#111", textShadow: "none" } : undefined);
