import gaming from "@/assets/thumb-gaming.jpg";
import music from "@/assets/thumb-music.jpg";
import tech from "@/assets/thumb-tech.jpg";
import travel from "@/assets/thumb-travel.jpg";
import fitness from "@/assets/thumb-fitness.jpg";
import food from "@/assets/thumb-food.jpg";

export type Video = {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
  channelInitial: string;
  views_count?: number;
  time: string;
  duration: string;
  badge?: "Trending" | "New" | "Live";
  category: string;
  channelAvatar?: string | null;
  isVerified?: boolean;
};

export const categories = [
  "All",
  "Trending",
  "Music",
  "Gaming",
  "Education",
  "Tech",
  "Travel",
  "Fitness",
  "Food",
];

export const videos: Video[] = [
  {
    id: "1",
    title: "Inside the neon city: a cyberpunk drone tour you have to see",
    thumbnail: gaming,
    channel: "NeonVision",
    channelInitial: "N",
    views_count: 1200000,
    time: "2 days ago",
    duration: "12:04",
    badge: "Trending",
    category: "Gaming",
  },
  {
    id: "2",
    title: "Synthwave studio session — late night vibes & new track",
    thumbnail: music,
    channel: "PulseLab",
    channelInitial: "P",
    views_count: 843000,
    time: "5 hours ago",
    duration: "08:45",
    badge: "New",
    category: "Music",
  },
  {
    id: "3",
    title: "Build a full-stack app in 2026 — modern stack walkthrough",
    thumbnail: tech,
    channel: "CodeOrbit",
    channelInitial: "C",
    views_count: 412000,
    time: "1 week ago",
    duration: "22:18",
    category: "Education",
  },
  {
    id: "4",
    title: "Sunset above the clouds — cinematic drone shots in 4K",
    thumbnail: travel,
    channel: "SkyChasers",
    channelInitial: "S",
    views_count: 2400000,
    time: "3 weeks ago",
    duration: "06:30",
    badge: "Trending",
    category: "Travel",
  },
  {
    id: "5",
    title: "10-minute neon HIIT — sweat with the lights on",
    thumbnail: fitness,
    channel: "GlowFit",
    channelInitial: "G",
    views_count: 156000,
    time: "1 day ago",
    duration: "10:02",
    badge: "New",
    category: "Fitness",
  },
  {
    id: "6",
    title: "Rainbow plate — 5 healthy recipes that look unreal",
    thumbnail: food,
    channel: "Kitchen Bloom",
    channelInitial: "K",
    views_count: 98000,
    time: "4 days ago",
    duration: "14:22",
    category: "Food",
  },
  {
    id: "7",
    title: "Why ray tracing changed gaming forever — deep dive",
    thumbnail: gaming,
    channel: "PixelTheory",
    channelInitial: "P",
    views_count: 678000,
    time: "6 days ago",
    duration: "18:55",
    category: "Gaming",
  },
  {
    id: "8",
    title: "Top 10 lo-fi tracks to code & relax to in 2026",
    thumbnail: music,
    channel: "ChillCircuit",
    channelInitial: "C",
    views_count: 1800000,
    time: "2 weeks ago",
    duration: "45:10",
    badge: "Trending",
    category: "Music",
  },
];

export type Short = {
  id: string;
  thumbnail: string;
  title: string;
  channel: string;
  likes: string;
  comments: string;
};

export const shorts: Short[] = [
  { id: "s1", thumbnail: gaming, title: "Neon city flythrough 🌃", channel: "@neonvision", likes: "248K", comments: "1.2K" },
  { id: "s2", thumbnail: music, title: "Beat drop in 3..2..1 🎧", channel: "@pulselab", likes: "182K", comments: "904" },
  { id: "s3", thumbnail: travel, title: "Sunset on the edge of the world", channel: "@skychasers", likes: "421K", comments: "3.1K" },
  { id: "s4", thumbnail: fitness, title: "30s ab burner 🔥", channel: "@glowfit", likes: "92K", comments: "612" },
];

export const leaderboard = [
  { rank: 1, name: "NeonVision", handle: "@neonvision", points: 248_910, badge: "Diamond" },
  { rank: 2, name: "PulseLab", handle: "@pulselab", points: 198_440, badge: "Diamond" },
  { rank: 3, name: "SkyChasers", handle: "@skychasers", points: 174_220, badge: "Platinum" },
  { rank: 4, name: "CodeOrbit", handle: "@codeorbit", points: 132_018, badge: "Platinum" },
  { rank: 5, name: "GlowFit", handle: "@glowfit", points: 98_310, badge: "Gold" },
  { rank: 6, name: "Kitchen Bloom", handle: "@kitchenbloom", points: 76_540, badge: "Gold" },
  { rank: 7, name: "PixelTheory", handle: "@pixeltheory", points: 62_001, badge: "Silver" },
  { rank: 8, name: "ChillCircuit", handle: "@chillcircuit", points: 51_220, badge: "Silver" },
];

export const rewards = [
  { id: "r1", title: "20% off Spotify Premium", points: 1500, color: "from-green-500/30 to-emerald-500/10" },
  { id: "r2", title: "Free Vidind Pro — 1 month", points: 3000, color: "from-purple-500/30 to-fuchsia-500/10" },
  { id: "r3", title: "Razer Mouse Giveaway", points: 12000, color: "from-cyan-500/30 to-blue-500/10" },
  { id: "r4", title: "$10 Steam Gift Card", points: 5000, color: "from-orange-500/30 to-yellow-500/10" },
];
