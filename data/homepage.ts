import type { IconName } from "@/components/ui/icons";

/* All homepage Part 1 content, copied from propertyindia-home-v13-contrast.html (PROPS, SEARCH_CONFIG, menu, trust). */

export type PropertyKind = "rent" | "pg" | "commercial" | "land";

export interface FeaturedProperty {
  image: { src: string; width: number; height: number };
  kind: PropertyKind;
  tag: string;
  tagColor: string;
  name: string;
  price: string;
  location: string;
  details: { icon: IconName; text: string }[];
  tags: string[];
}

export const FEATURED_PROPERTIES: FeaturedProperty[] = [
  {
    image: { src: "/images/prop-rent-2bhk.jpg", width: 560, height: 243 },
    kind: "rent", tag: "For Rent", tagColor: "#f58220",
    name: "2 BHK Apartment for Rent", price: "₹28,000/month", location: "Whitefield, Bengaluru",
    details: [{ icon: "bed", text: "2 BHK" }, { icon: "bath", text: "2 Bath" }, { icon: "area", text: "1,050 sq ft" }],
    tags: ["Semi Furnished", "Gated Society", "Good Location"],
  },
  {
    image: { src: "/images/prop-pg-girls.jpg", width: 560, height: 243 },
    kind: "pg", tag: "PG", tagColor: "#7c3aed",
    name: "Girls PG (Sharing)", price: "₹8,500/month", location: "Sector 62, Noida",
    details: [{ icon: "users", text: "Shared Room" }, { icon: "wifi", text: "Wi-Fi" }],
    tags: ["Food Included", "Safe & Secure", "Near Metro"],
  },
  {
    image: { src: "/images/prop-commercial-shop.jpg", width: 560, height: 233 },
    kind: "commercial", tag: "Commercial", tagColor: "#2563eb",
    name: "Commercial Shop for Rent", price: "₹45,000/month", location: "Indiranagar, Bengaluru",
    details: [{ icon: "area", text: "650 sq ft" }, { icon: "build", text: "Ground Floor" }],
    tags: ["Main Road", "Glass Frontage", "Parking"],
  },
  {
    image: { src: "/images/prop-land-agri.jpg", width: 560, height: 243 },
    kind: "land", tag: "Land Lease", tagColor: "#16a34a",
    name: "Agricultural Land Lease", price: "₹15,000/month", location: "Doddaballapur, Bengaluru",
    details: [{ icon: "area", text: "1 Acre" }, { icon: "leaf", text: "Agricultural Use" }],
    tags: ["Clean Title", "Good Access", "Water Available"],
  },
];

/* ---------- search module (SEARCH_CONFIG) ---------- */
export type SearchTabKey = "rent" | "pg" | "commercial" | "land";

export interface SearchTab {
  label: string;
  short?: string;
  icon: IconName;
  button: string;
  types: string[];
  /** Property types for which the extra dropdown is locked to "Any" and disabled. */
  noExtraFor?: string[];
  /** When true the extra dropdown is hidden entirely (unused for now, as in the original). */
  noExtra?: boolean;
  extraLabel: string;
  extra: string[];
}

/** Tab order is the original order: Rent, PG / Hostel, Commercial, Land / Plot. */
export const SEARCH_TAB_ORDER: SearchTabKey[] = ["rent", "pg", "commercial", "land"];
export const DEFAULT_SEARCH_TAB: SearchTabKey = "rent";

export const SEARCH_TABS: Record<SearchTabKey, SearchTab> = {
  rent: {
    label: "Rent", icon: "key", button: "Search Rentals",
    types: ["Any", "Flat / Apartment", "Independent House", "Independent Floor", "Villa", "Duplex", "Penthouse", "Studio", "1 RK", "Single Room"],
    noExtraFor: ["1 RK", "Single Room"],
    extraLabel: "BHK", extra: ["Any", "1 BHK", "2 BHK", "3 BHK", "4+ BHK"],
  },
  pg: {
    label: "PG / Hostel", short: "PG", icon: "bed", button: "Search PGs",
    types: ["Any", "Girls PG", "Boys PG", "Unisex PG", "Hostel", "Co-living"],
    extraLabel: "Sharing", extra: ["Any", "Single", "Double", "Triple", "4+ Sharing"],
  },
  commercial: {
    label: "Commercial", icon: "city", button: "Search Commercial",
    types: ["Any", "Ready to use Office Space", "Bare Shell Office Space", "Shop", "Showroom", "Warehouse / Godown", "Industrial Space / Factory", "Other"],
    extraLabel: "Area", extra: ["Any", "Up to 1,000 sq ft", "1,000–5,000 sq ft", "5,000+ sq ft"],
  },
  land: {
    label: "Land / Plot", short: "Land", icon: "plots", button: "Search Land",
    types: ["Any", "Residential Plot", "Commercial Plot", "Industrial Plot", "Agricultural Land", "Farm House"],
    /* Area is only "Any" for now (as in the original). */
    extraLabel: "Area", extra: ["Any"],
  },
};

/* ---------- header navigation ---------- */
export const NAV_LINKS: { label: string; href: string; current?: boolean }[] = [
  { label: "Home", href: "#", current: true },
  { label: "Search", href: "#search" },
  { label: "Properties", href: "#featured" },
  { label: "How it works", href: "#how" },
];

/* ---------- hamburger menu ---------- */
export interface MenuItem {
  href: string;
  icon: IconName;
  iconClass: string; // mm-ic colour class, e.g. "c-blue" or "fill c-green"
  title: string;
  subtitle: string;
}

export const MENU_SECTIONS: MenuItem[][] = [
  [
    { href: "#search", icon: "search", iconClass: "c-blue", title: "Search Properties", subtitle: "Find homes, PGs and plots" },
    { href: "#", icon: "heart", iconClass: "c-heart", title: "Saved Properties", subtitle: "Save and revisit your favourites" },
    { href: "#how", icon: "rupee-off", iconClass: "fill c-green", title: "How Zero Brokerage Works", subtitle: "Learn how PropertyIndia is different" },
  ],
  [
    { href: "#", icon: "chat", iconClass: "c-blue", title: "My Chats", subtitle: "Talk to owners and tenants" },
    { href: "#", icon: "home", iconClass: "c-orange", title: "For Owners", subtitle: "Rent or lease, zero brokerage" },
    { href: "#", icon: "key", iconClass: "c-purple", title: "For Tenants", subtitle: "Rent homes, PGs and plots" },
    { href: "#", icon: "grid", iconClass: "c-green", title: "Services", subtitle: "Agreements and legal help" },
  ],
  [
    { href: "#", icon: "help", iconClass: "fill c-grey", title: "Help & Support", subtitle: "FAQs and contact support" },
    { href: "#", icon: "info", iconClass: "fill c-grey", title: "About PropertyIndia", subtitle: "Our mission, vision and more" },
    { href: "#", icon: "doc", iconClass: "c-grey", title: "Terms & Conditions", subtitle: "Read our terms of use" },
    { href: "#", icon: "shield", iconClass: "c-grey", title: "Privacy Policy", subtitle: "How we protect your data" },
  ],
  [{ href: "#", icon: "globe", iconClass: "c-grey", title: "Language", subtitle: "English (EN)" }],
];

/* ---------- Why Choose PropertyIndia ---------- */
export const TRUST_ITEMS: { icon: IconName; background: string; title: string; subtitle: string }[] = [
  { icon: "shield", background: "var(--green)", title: "Verified Owners", subtitle: "Trusted & Safe" },
  { icon: "rupee-off", background: "var(--orange)", title: "Zero Brokerage", subtitle: "Deal directly with owners" },
  { icon: "chat", background: "var(--blue)", title: "Secure Chat", subtitle: "Safe & private calls" },
  { icon: "doc", background: "var(--purple)", title: "Digital Agreements", subtitle: "Paperless & hassle-free" },
];

/* =====================================================================================================
   PART 2 content (copied from propertyindia-home-v13-contrast.html: LOCS, LOC_COUNT, RECENT, steps, footer)
   ===================================================================================================== */

/* ---------- Popular Locations ---------- */
export const POPULAR_LOCATIONS: { name: string; image: { src: string; width: number; height: number }; count: string }[] = [
  { name: "Bengaluru", image: { src: "/images/city-bengaluru.jpg", width: 480, height: 384 }, count: "12,450+" },
  { name: "Mumbai", image: { src: "/images/city-mumbai.jpg", width: 480, height: 384 }, count: "18,320+" },
  { name: "Delhi", image: { src: "/images/city-delhi.jpg", width: 480, height: 384 }, count: "16,780+" },
  { name: "Hyderabad", image: { src: "/images/city-hyderabad.jpg", width: 480, height: 384 }, count: "9,620+" },
  { name: "Pune", image: { src: "/images/city-pune.jpg", width: 480, height: 384 }, count: "8,940+" },
  { name: "Ayodhya", image: { src: "/images/city-ayodhya.jpg", width: 480, height: 271 }, count: "2,340+" },
  { name: "Vrindavan", image: { src: "/images/city-vrindavan.jpg", width: 480, height: 281 }, count: "3,120+" },
  { name: "Mathura", image: { src: "/images/city-mathura.jpg", width: 480, height: 271 }, count: "2,890+" },
];

/* ---------- Recently Added (sample listings; images reuse the Featured photos by index) ---------- */
export interface RecentListing {
  imageIndex: number; // index into FEATURED_PROPERTIES
  tag: string;
  title: string;
  price: string;
  location: string;
  details: string;
  posted: string;
}

export const RECENT_LISTINGS: RecentListing[] = [
  { imageIndex: 0, tag: "For Rent", title: "3 BHK Flat for Rent", price: "₹42,000/month", location: "HSR Layout, Bengaluru", details: "3 BHK · 3 Bath · 1,450 sq ft", posted: "2 hrs ago" },
  { imageIndex: 1, tag: "PG", title: "Boys PG (Sharing)", price: "₹7,000/month", location: "Sector 18, Noida", details: "Shared Room · Wi-Fi · Food", posted: "5 hrs ago" },
  { imageIndex: 2, tag: "Commercial", title: "Office Space for Rent", price: "₹85,000/month", location: "Andheri East, Mumbai", details: "1,200 sq ft · 2nd Floor", posted: "Yesterday" },
  { imageIndex: 3, tag: "Land Lease", title: "Farm Land on Lease", price: "₹20,000/month", location: "Mathura, Uttar Pradesh", details: "2 Acre · Agricultural Use", posted: "Yesterday" },
  { imageIndex: 0, tag: "For Rent", title: "Studio Apartment", price: "₹18,500/month", location: "Koregaon Park, Pune", details: "Studio · 1 Bath · 480 sq ft", posted: "2 days ago" },
  { imageIndex: 1, tag: "PG", title: "Girls PG (Single)", price: "₹9,500/month", location: "Madhapur, Hyderabad", details: "Single Room · Wi-Fi · AC", posted: "3 days ago" },
];

/* ---------- How PropertyIndia works ---------- */
export const HOW_STEPS: { icon: IconName; title: string; long: string; short: string }[] = [
  { icon: "search", title: "Search", long: "Pick your city, property type and budget to see verified listings.", short: "Find verified rental listings." },
  { icon: "chat", title: "Talk to the owner", long: "Chat or call directly. No agent in between, no brokerage.", short: "Chat directly. Zero brokerage." },
  { icon: "doc", title: "Sign digitally", long: "Finish the rental or lease agreement online, without paperwork.", short: "Complete your agreement online." },
];

/* ---------- Footer ---------- */
export const FOOTER_COLUMNS: { id: string; title: string; links: string[] }[] = [
  { id: "explore", title: "Explore", links: ["Rent", "PG / Hostel / Co-Living", "Commercial / Warehouse", "Land / Plot Lease", "Search by City", "List Your Property", "How it Works"] },
  { id: "company", title: "Company", links: ["About us", "Contact", "Careers", "Blog", "Terms of Service", "Privacy Policy"] },
  { id: "support", title: "Support", links: ["Help Center", "Enquiry", "Safety Tips", "Report a Listing", "FAQ", "Feedback"] },
];

/* ---------- Ask Property AI ---------- */
export const AI_SUGGESTIONS = [
  "Find properties in Delhi",
  "Best areas for PG in Bangalore",
  "Check rent agreement process",
  "Tell me about farm land lease",
];
