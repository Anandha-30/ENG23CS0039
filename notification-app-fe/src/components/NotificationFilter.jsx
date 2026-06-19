const filters = ["All", "Placement", "Result", "Event"];

export function NotificationFilter({ value, onChange }) {
  return (
    <div className="filter-tabs" role="tablist" aria-label="Notification type">
      {filters.map((type) => (
        <button
          className={value === type ? "filter-tab active" : "filter-tab"}
          key={type}
          onClick={() => onChange(type)}
          role="tab"
          aria-selected={value === type}
          type="button"
        >
          {type}
        </button>
      ))}
    </div>
  );
}
