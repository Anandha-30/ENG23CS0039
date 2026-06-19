import { useMemo, useState } from "react";
import { NotificationCard } from "../components/NotificationCard";
import { NotificationFilter } from "../components/NotificationFilter";
import { useNotifications } from "../hooks/useNotifications";

const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

const PAGE_SIZE = 6;

function comparePriority(a, b, readIds) {
  const unreadDifference =
    Number(!readIds.has(b.ID)) - Number(!readIds.has(a.ID));

  if (unreadDifference !== 0) return unreadDifference;

  const weightDifference =
    (TYPE_WEIGHT[b.Type] ?? 0) - (TYPE_WEIGHT[a.Type] ?? 0);

  if (weightDifference !== 0) return weightDifference;

  return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
}

function rankNotifications(notifications, readIds) {
  return [...notifications].sort((a, b) => comparePriority(a, b, readIds));
}

function selectTopNotifications(notifications, readIds, limit = 10) {
  const top = [];

  for (const notification of notifications) {
    if (readIds.has(notification.ID)) continue;

    const insertAt = top.findIndex(
      (current) => comparePriority(notification, current, readIds) < 0,
    );

    if (insertAt === -1) {
      if (top.length < limit) top.push(notification);
    } else {
      top.splice(insertAt, 0, notification);
      if (top.length > limit) top.pop();
    }
  }

  return top;
}

export function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [view, setView] = useState("priority");
  const [page, setPage] = useState(1);
  const [token, setToken] = useState(
    () => sessionStorage.getItem("notification-api-token") ?? "",
  );
  const [tokenDraft, setTokenDraft] = useState(token);
  const [showToken, setShowToken] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("read-notifications") ?? "[]"));
    } catch {
      return new Set();
    }
  });

  const { notifications, loading, error, lastUpdated, refresh } =
    useNotifications(token);

  const filtered = useMemo(() => {
    const byType =
      filter === "All"
        ? notifications
        : notifications.filter((item) => item.Type === filter);

    return view === "priority"
      ? selectTopNotifications(byType, readIds)
      : rankNotifications(byType, readIds);
  }, [filter, notifications, readIds, view]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleNotifications =
    view === "priority"
      ? filtered
      : filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const unreadCount = notifications.filter((item) => !readIds.has(item.ID)).length;

  function handleFilterChange(nextFilter) {
    setFilter(nextFilter);
    setPage(1);
  }

  function handleToggleRead(id) {
    setReadIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("read-notifications", JSON.stringify([...next]));
      return next;
    });
  }

  function saveToken(event) {
    event.preventDefault();
    const cleanToken = tokenDraft.trim();
    sessionStorage.setItem("notification-api-token", cleanToken);
    setToken(cleanToken);
    setShowToken(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="Campus Pulse home">
          <span className="brand-mark">CP</span>
          <span>Campus Pulse</span>
        </a>
        <div className="topbar-actions">
          <button
            className="icon-button"
            type="button"
            onClick={() => setShowToken((current) => !current)}
            aria-label="API access settings"
          >
            ⚙
          </button>
          <div className="avatar">AS</div>
        </div>
      </header>

      <section className="content">
        <div className="hero">
          <div>
            <p className="eyebrow">STUDENT DASHBOARD</p>
            <h1>Your notifications</h1>
            <p className="hero-copy">
              Important campus updates, ranked so the things that matter most
              never get buried.
            </p>
          </div>
          <button className="refresh-button" type="button" onClick={refresh}>
            <span aria-hidden="true">↻</span> Refresh
          </button>
        </div>

        {showToken && (
          <form className="token-panel" onSubmit={saveToken}>
            <div>
              <strong>Protected API access</strong>
              <p>The token stays in this browser tab and is never committed.</p>
            </div>
            <input
              type="password"
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              placeholder="Paste bearer token"
              aria-label="API bearer token"
            />
            <button type="submit">Connect</button>
          </form>
        )}

        <section className="summary-grid" aria-label="Notification summary">
          <div className="summary-card accent">
            <span>Unread</span>
            <strong>{unreadCount}</strong>
            <small>Needs your attention</small>
          </div>
          <div className="summary-card">
            <span>Placements</span>
            <strong>{notifications.filter((item) => item.Type === "Placement").length}</strong>
            <small>Highest priority</small>
          </div>
          <div className="summary-card">
            <span>Results</span>
            <strong>{notifications.filter((item) => item.Type === "Result").length}</strong>
            <small>Academic updates</small>
          </div>
          <div className="summary-card">
            <span>Events</span>
            <strong>{notifications.filter((item) => item.Type === "Event").length}</strong>
            <small>Campus activity</small>
          </div>
        </section>

        <section className="inbox">
          <div className="inbox-header">
            <div className="view-switch" aria-label="Inbox view">
              <button
                className={view === "priority" ? "active" : ""}
                onClick={() => { setView("priority"); setPage(1); }}
                type="button"
              >
                Priority inbox
              </button>
              <button
                className={view === "all" ? "active" : ""}
                onClick={() => { setView("all"); setPage(1); }}
                type="button"
              >
                All notifications
              </button>
            </div>
            {lastUpdated && (
              <span className="updated-at">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>

          <div className="filter-row">
            <NotificationFilter value={filter} onChange={handleFilterChange} />
            <span>{filtered.length} notification{filtered.length === 1 ? "" : "s"}</span>
          </div>

          {loading && (
            <div className="state-panel">
              <span className="spinner" />
              <h2>Fetching campus updates</h2>
              <p>Building your priority inbox…</p>
            </div>
          )}

          {!loading && error && (
            <div className="state-panel error">
              <span className="state-icon">!</span>
              <h2>We couldn’t load notifications</h2>
              <p>{error}</p>
              <div className="state-actions">
                <button type="button" onClick={refresh}>Try again</button>
                <button type="button" className="secondary" onClick={() => setShowToken(true)}>
                  Add API token
                </button>
              </div>
            </div>
          )}

          {!loading && !error && visibleNotifications.length === 0 && (
            <div className="state-panel">
              <span className="state-icon success">✓</span>
              <h2>You’re all caught up</h2>
              <p>No unread notifications match this filter.</p>
            </div>
          )}

          {!loading && !error && visibleNotifications.length > 0 && (
            <div className="notification-list">
              {visibleNotifications.map((notification, index) => (
                <NotificationCard
                  key={notification.ID}
                  notification={notification}
                  isRead={readIds.has(notification.ID)}
                  rank={view === "priority" ? index + 1 : null}
                  onToggleRead={handleToggleRead}
                />
              ))}
            </div>
          )}

          {!loading && !error && view === "all" && totalPages > 1 && (
            <nav className="pagination" aria-label="Notification pages">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </section>
    </main>
  );
}
