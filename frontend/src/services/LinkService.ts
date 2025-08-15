import { apiClient } from '../services/api';

export async function mlinkLogin(username: string, password: string) {
  const { data } = await apiClient.post("/mlink/token", { username, password });
  return data;
}

export async function mlinkGetCampaigns(params?: { Name?: string; StartDate?: string; EndDate?: string; }) {
  const { data } = await apiClient.get("/mlink/campaigns", { params });
  return data;
}

export async function mlinkGetReports(params?: { InfluencerID?: string; StartDate?: string; EndDate?: string; }) {
  const { data } = await apiClient.get("/mlink/reports", { params });
  return data;
}

export async function mlinkGenerateLink(body: { influencerID: string; influencerName: string; campaignID: number; }) {
  const { data } = await apiClient.put("/mlink/generate-link", body);
  return data;
}