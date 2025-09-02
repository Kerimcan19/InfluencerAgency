import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: null | {
    accessToken: string;
    expiration: string;
  };
  isSuccess: boolean;
  message: null | string;
  type: number;
}
// Axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Token interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/login', credentials);
  return response.data;
};

export interface Campaign {
  id: number;
  name: string;
  brief: string; // ✅ Add this line
  products: {
    name: string;
    image: string;
  }[];
  brandCommissionRate: number;
  influencerCommissionRate: number;
  otherCostsRate: number;
  endDate: string;
  brandingImage?: string;
}


export interface CampaignsResponse {
  data: Campaign[];
  isSuccess: boolean;
  message: null | string;
  type: number;
}

export const getCampaigns = async (
  name?: string,
  startDate?: string,
  endDate?: string
): Promise<CampaignsResponse> => {
  const params: any = {};
  if (name) params.Name = name;
  if (startDate) params.StartDate = startDate;
  if (endDate) params.EndDate = endDate;

  const response = await apiClient.get<CampaignsResponse>('/Affiliate/GetCampaigns', { params });
  return response.data;
};


export interface Report {
  id: number;
  influencerId: number;
  influencerName?: string | null;
  campaignId: number;
  name?: string | null;
  totalClicks: number;
  totalSales: number;
  createdAt: string;
  brandCommissionRate: string;
  brandCommissionAmount: string;
  influencerCommissionRate: string;
  influencerCommissionAmount: string;
  otherCostsRate: string;
  mimedaCommissionRate: string;
  mimedaCommissionAmount: string;
  agencyCommissionRate: string;
  agencyCommissionAmount: string;
  endDate?: string
}

export interface ReportsResponse {
  data: Report[];
  isSuccess: boolean;
  message: null | string;
  type: number;

  activeInfluencers: number;
  totalInfluencerCommission: string;
}

export const getReports = async (
  influencerId?: string,
  startDate?: string,
  endDate?: string
): Promise<ReportsResponse> => {
  const params: any = {};
  if (influencerId) params.InfluencerID = influencerId;
  if (startDate) params.StartDate = startDate;
  if (endDate) params.EndDate = endDate;

  const response = await apiClient.get<ReportsResponse>('/Affiliate/GetReport', { params });
  return response.data;
};


interface GenerateLinkRequest {
  influencerID: string;
  influencerName: string;
  campaignID: number;
}

interface GenerateLinkResponse {
  data: {
    CampaignID: string;
    Name: string;
    EndDate: string;
    url: string;
  };
  isSuccess: boolean;
  message: string | null;
  type: number;
}

export const generateTrackingLink = async (
  influencerID: string,
  influencerName: string,
  campaignID: number
): Promise<GenerateLinkResponse> => {
  const response = await apiClient.put<GenerateLinkResponse>(
    '/Affiliate/GenerateLink',
    {
      influencerID,
      influencerName,
      campaignID,
    }
  );
  return response.data;
};
// ----- Dashboard types -----
export interface DashboardSummaryResponse {
  activeCampaigns: number;
  totalClicks: number;        // backend returns number (schema shows int)
  totalSales: number;         // schema is Decimal -> treat as number in TS
  totalCommission: number;    // schema is Decimal -> treat as number in TS
}

export interface ActivityOut {
  type: string;
  label: string;
  timestamp: string;          // ISO datetime
}

// ----- Dashboard API calls -----
export const getDashboardSummary = async (): Promise<DashboardSummaryResponse> => {
  const res = await apiClient.get<DashboardSummaryResponse>('/dashboard/summary');
  return res.data; // NOTE: this endpoint returns the object directly (no { data, isSuccess, ... } wrapper)
};

export const getDashboardActivity = async (): Promise<ActivityOut[]> => {
  const res = await apiClient.get<ActivityOut[]>('/dashboard/activity');
  return res.data; // NOTE: this endpoint returns a raw list (no wrapper)
};

export const mlinkGetCampaigns = async (params?: {
  Name?: string;
  StartDate?: string; 
  EndDate?: string;   
}) => {
  const { data } = await apiClient.get("/mlink/campaigns", { params });
  return data; // { data: [...], isSuccess, message, type }
};

export const mlinkGetReports = async (params?: {
  influencer_id?: string;
  StartDate?: string; // DD.MM.YYYY
  EndDate?: string;   // DD.MM.YYYY
}) => {
  const { data } = await apiClient.get("/mlink/reports", { params });
  return data; // { data: [...], isSuccess, message, type }
};

export const mlinkGenerateLink = async (payload: {
  influencerID: string;
  influencerName: string;
  campaignID: number;
}) => {
  const { data } = await apiClient.put("/mlink/generate-link", payload);
  return data; // { data: {...}, isSuccess, message, type }
};
