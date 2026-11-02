import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SearchSection from "@/components/SearchSection";
import WhyChoose from "@/components/WhyChoose";
import FeaturedProperties from "@/components/FeaturedProperties";

/* Homepage – Part 1: Header, Hero, Search (4 tabs), Why Choose, Featured Properties.
   Part 2 (Popular Locations, Recently Added, How it works, List CTA, Footer, bottom nav, Ask Property AI) follows
   after written approval of Part 1. */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SearchSection />
        <WhyChoose />
        <FeaturedProperties />
      </main>
    </>
  );
}
