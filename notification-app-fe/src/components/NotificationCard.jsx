const typeIcons = {
  Placement: "↗",
  Result: "✓",
  Event: "◇",
};

function formatDate(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationCard({ notification, rank, isRead, onToggleRead }) {
  const type = notification.Type ?? "General";

  return (
    <article className={`notification-card ${isRead ? "read" : ""}`}>
      <div className={`type-icon ${type.toLowerCase()}`} aria-hidden="true">
        {typeIcons[type] ?? "•"}
      </div>

      <div className="notification-content">
        <div className="notification-meta">
          <span className={`type-pill ${type.toLowerCase()}`}>{type}</span>
          {rank && <span className="priority-label">Priority #{rank}</span>}
          {!isRead && <span className="unread-dot" title="Unread" />}
        </div>
        <h3>{notification.Message || "New campus notification"}</h3>
        <time dateTime={notification.Timestamp}>
          {formatDate(notification.Timestamp)}
        </time>
      </div>

      <button
        className="read-button"
        type="button"
        onClick={() => onToggleRead(notification.ID)}
      >
        {isRead ? "Mark unread" : "Mark read"}
      </button>
    </article>
  );
}
