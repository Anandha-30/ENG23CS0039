const API_URL =
  import.meta.env.VITE_NOTIFICATIONS_API_URL ??
  "http://4.224.186.213/evaluation-service/notifications";

export async function fetchNotifications({ token, signal } = {}) {
  const headers = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }

  const response = await fetch(API_URL, { headers, signal });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Authorization failed. Add a valid API token and try again.");
    }

    throw new Error(`The notification service returned ${response.status}.`);
  }

  const data = await response.json();

  if (!Array.isArray(data.notifications)) {
    throw new Error("The notification service returned an unexpected response.");
  }

  return data.notifications;
}
