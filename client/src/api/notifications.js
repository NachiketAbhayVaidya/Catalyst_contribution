import { apiClient, USE_MOCK, mockDelay } from "./client"
import { mockNotifications } from "./mockData"

export async function getNotifications(params = {}) {
  if (USE_MOCK) {
    let list = [...mockNotifications]
    if (params.unreadOnly) list = list.filter((n) => !n.read)
    const unreadCount = mockNotifications.filter((n) => !n.read).length
    return mockDelay(list, 300).then((r) => ({ ...r, unreadCount }))
  }
  return apiClient.get("/notifications", params)
}

export async function markNotificationRead(notificationId) {
  if (USE_MOCK) {
    const notification = mockNotifications.find((n) => n.id === notificationId)
    if (notification) notification.read = true
    return mockDelay(undefined, 200)
  }
  return apiClient.patch(`/notifications/${notificationId}/read`)
}

export async function markAllNotificationsRead() {
  if (USE_MOCK) {
    mockNotifications.forEach((n) => (n.read = true))
    return mockDelay(undefined, 200)
  }
  return apiClient.patch("/notifications/read-all")
}
