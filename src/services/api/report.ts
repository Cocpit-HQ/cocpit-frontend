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
  const response = await api.post<{ message: string }>("/report/reports", data);
  return response.data;
};
