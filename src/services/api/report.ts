import api from "@/lib/axios";

export interface ReportReason {
  id: number;
  code: string;
  label: string;
}

export interface CreateReportRequest {
  targetType: 'POST' | 'USER' | 'COMMENT' | 'COMPANY' | 'THOUGHT';
  targetId: string | number;
  reasonId?: number;
  customReason?: string;
}

export const getReportReasons = async (): Promise<ReportReason[]> => {
  const response = await api.get<ReportReason[]>("/report/report-reasons");
  return response.data;
};

export const createReport = async (data: CreateReportRequest): Promise<{ message: string }> => {
  const headers: Record<string, string> = {};
  
  if (api.defaults.headers.common["x-actor-type"]) {
    headers["x-actor-type"] = api.defaults.headers.common["x-actor-type"] as string;
  }
  if (api.defaults.headers.common["x-actor-id"]) {
    headers["x-actor-id"] = api.defaults.headers.common["x-actor-id"] as string;
  }

  const response = await api.post<{ message: string }>("/report/reports", data, { headers });
  return response.data;
};
