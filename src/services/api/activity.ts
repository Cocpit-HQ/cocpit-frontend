import api from "@/lib/axios"


export interface ActivityLog {
  id: string
  user_id: string
  action_type: string
  entity_type: string
  entity_id: string
  metadata: any
  created_at: string
  // Joined fields
  post_content?: string
  post_title?: string
  post_author_name?: string
  post_author_avatar?: string
  job_title?: string
  job_company_name?: string
  event_title?: string
  event_banner?: string
}

export const getActivity = async (type?: string, limit = 20, cursor?: string) => {
  const params: any = { limit }
  if (type) params.type = type
  if (cursor) params.cursor = cursor

  const response = await api.get("/activity", { params })
  return response.data
}

export const clearActivity = async (actionType?: string) => {
  const params: any = {}
  if (actionType) params.type = actionType

  const response = await api.delete("/activity/clear", { params })
  return response.data
}

