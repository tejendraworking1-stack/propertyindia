import RecentCard from "@/components/RecentCard";
import { RECENT_LISTINGS } from "@/data/homepage";

/** Recently Added: vertical list of sample listings (images reuse the Featured photos), each with a save heart. */
export default function RecentlyAdded() {
  return (
    <section className="wrap sec" id="recent" aria-labelledby="recentH">
      <div className="sec-h">
        <h2 id="recentH">Recently Added</h2>
        <a href="#">View All</a>
      </div>
      <div className="ra-list" id="raList">
        {RECENT_LISTINGS.map((r) => (
          <RecentCard key={`${r.title}-${r.location}`} listing={r} />
        ))}
      </div>
    </section>
  );
}
