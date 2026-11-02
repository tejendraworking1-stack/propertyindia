import Icon from "@/components/ui/Icon";
import { SEARCH_TABS, SEARCH_TAB_ORDER, type SearchTabKey } from "@/data/homepage";

interface CategoryTabsProps {
  active: SearchTabKey;
  onSelect: (key: SearchTabKey) => void;
}

/** The four category tabs, in the original order: Rent, PG / Hostel, Commercial, Land / Plot. */
export default function CategoryTabs({ active, onSelect }: CategoryTabsProps) {
  return (
    <div className="tabs" id="smTabs" role="tablist" aria-label="Property category">
      {SEARCH_TAB_ORDER.map((key) => {
        const tab = SEARCH_TABS[key];
        return (
          <button
            key={key}
            type="button"
            className="tab"
            role="tab"
            data-t={key}
            aria-selected={key === active}
            onClick={() => onSelect(key)}
          >
            <span className="tt">
              <span className="th">
                <Icon name={tab.icon} />
                <b className="tn">
                  <span className="tl">{tab.label}</span>
                  <span className="ts">{tab.short ?? tab.label}</span>
                </b>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
