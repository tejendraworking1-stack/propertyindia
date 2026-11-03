import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SearchSection from "@/components/SearchSection";
import WhyChoose from "@/components/WhyChoose";
import FeaturedProperties from "@/components/FeaturedProperties";
import PopularLocations from "@/components/PopularLocations";
import RecentlyAdded from "@/components/RecentlyAdded";
import HowItWorks from "@/components/HowItWorks";
import ListPropertyCta from "@/components/ListPropertyCta";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import AskPropertyAi from "@/components/AskPropertyAi";

/* Homepage: Part 1 (Header, Hero, Search, Why Choose, Featured) + Part 2 (Popular Locations, Recently Added,
   How it works, List CTA, Footer, bottom nav, Ask Property AI). Section order is the original order. */
export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SearchSection />
        <WhyChoose />
        <FeaturedProperties />
        <PopularLocations />
        <RecentlyAdded />
        <HowItWorks />
        <ListPropertyCta />
      </main>
      <Footer />
      <BottomNav />
      <AskPropertyAi />
    </>
  );
}
