# Notification System Design

## Stage 1

### Objective

The Priority Inbox displays the ten most important unread campus notifications.
Notifications are fetched from the supplied protected Notification API and are
not hard-coded or stored in an application database.

### API integration

The frontend sends a `GET` request to:

```text
http://4.224.186.213/evaluation-service/notifications
```

The bearer token is supplied through the application's access settings and is
kept in `sessionStorage`, so it is removed when the browser tab is closed. The
token is never included in the source code or committed to Git. During local
development, Vite proxies `/evaluation-service` requests to the API host to
avoid browser cross-origin issues.

The API layer validates both the HTTP status and the expected
`notifications` array. The UI provides loading, authorization-error, empty, and
retry states.

### Priority rules

Notifications are ordered using these rules, in sequence:

1. Unread notifications are considered before read notifications.
2. Type weight determines importance:
   - Placement: `3`
   - Result: `2`
   - Event: `1`
3. If two notifications have the same weight, the newest timestamp is ranked
   first.

This creates a deterministic order: a recent Placement notification appears
before a Result or Event notification, while recency resolves ties within the
same type.

### Efficient top-10 selection

The Priority Inbox does not sort the complete notification collection. It
scans the notifications once and maintains a bounded, ordered list containing
at most ten entries:

```text
for each unread notification:
    find its position in the current top 10
    insert it only when it belongs in the top 10
    remove the lowest-priority item if the list grows beyond 10
```

For `n` notifications and a requested limit `k`, this takes `O(n × k)` time and
`O(k)` additional space. Since `k` is fixed at 10, the operation is effectively
`O(n)` and does not grow into a full `O(n log n)` sort. The separate “All
notifications” view uses a complete sort because it intentionally displays the
entire ranked collection.

At larger scale, the same bounded-list concept can be replaced by a min-heap,
giving `O(n log k)` time while retaining only `k` candidates in memory.

### Read and unread state

The supplied notification response has no read-status field. The frontend
therefore stores only notification IDs marked as read in browser
`localStorage`. It does not copy or persist notification content. This allows
the Priority Inbox to hide read items while keeping the original API as the
source of truth.

### Frontend behavior

The interface provides:

- A Priority Inbox containing up to ten unread notifications.
- An All Notifications view with pagination.
- Filters for Placement, Result, Event, and all types.
- Counts for unread notifications and each notification category.
- Controls to mark notifications as read or unread.
- Manual refresh and last-updated feedback.
- Responsive layouts for desktop and mobile screens.

React memoization recalculates filtering and ranking only when the API data,
selected filter, selected view, or read-state set changes.

### Future scaling

If the notification volume becomes too large to fetch at once, ranking should
move to the backend. The API could expose cursor pagination and a priority
endpoint that maintains a top-`k` min-heap or indexed priority queue. A
WebSocket or Server-Sent Events connection could then insert new notifications
into that bounded structure without repeatedly downloading the entire list.

### Authentication

{
    "token_type":  "Bearer",
    "access_token":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhbmFuZGhhdmFydGhhbkBnbWFpbC5jb20iLCJleHAiOjE3ODE4NTE0MjcsImlhdCI6MTc4MTg1MDUyNywiaXNzIjoiQWZmb3JkIE1lZGljYWwgVGVjaG5vbG9naWVzIFByaXZhdGUgTGltaXRlZCIsImp0aSI6ImE4MTViNTI3LTIwNGEtNGM0My05Y2Y5LTc5ZGQzMjAxZjcyOCIsImxvY2FsZSI6ImVuLUlOIiwibmFtZSI6ImNhYW5hbmRoYXZhcnRoYW4iLCJzdWIiOiI2MjY3YmE4NC0yMDQ4LTQ4YjctYWYwMi1lOGJjOGEzNDVhZTYifSwiZW1haWwiOiJhbmFuZGhhdmFydGhhbkBnbWFpbC5jb20iLCJuYW1lIjoiY2FhbmFuZGhhdmFydGhhbiIsInJvbGxObyI6ImVuZzIzY3MwMDM5IiwiYWNjZXNzQ29kZSI6IkJnV1pTVyIsImNsaWVudElEIjoiNjI2N2JhODQtMjA0OC00OGI3LWFmMDItZThiYzhhMzQ1YWU2IiwiY2xpZW50U2VjcmV0IjoiVXpLdmFrSHBwWVlyeURCaiJ9.G8lJe6WNTXZ6yTLkT1ZPzhOStHVuMGrg16eJwpkkaUs",
    "expires_in":  1781851427
}

### Registration

"email":  "anandhavarthan@gmail.com", "name":  "caanandhavarthan", "rollNo":  "eng23cs0039", "accessCode":  "BgWZSW", "clientID":  "6267ba84-2048-48b7-af02-e8bc8a345ae6", "clientSecret":  "UzKvakHppYYryDBj"