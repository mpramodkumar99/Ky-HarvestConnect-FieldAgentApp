import { Platform } from 'react-native';

// Field Agent endpoints — served by UserSvc (3002) under /v1/agents
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3002' : 'http://localhost:3002';

export type AgentStatus = 'available' | 'on_delivery' | 'offline';

export interface AgentProfile {
  id:           string;
  userId:       string;
  name:         string;
  phone:        string;
  zone:         string;
  status:       AgentStatus;
  totalDeliveries: number;
  rating:       number;
  createdAt:    string;
}

export interface StoreOnboardingRequest {
  id:          string;
  storeName:   string;
  ownerName:   string;
  phone:       string;
  location:    string;
  pincode:     string;
  storeType:   string;
  kycDocUrl?:  string;
  status:      'pending' | 'approved' | 'rejected';
  submittedAt: string;
  notes?:      string;
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json() as { success: boolean; data?: T; error?: { title: string } };
  if (!body.success) throw new Error(body.error?.title ?? 'Agent service error');
  return body.data as T;
}

export async function getAgentProfile(userId: string, token: string): Promise<AgentProfile> {
  return request<AgentProfile>(`/v1/agents/${userId}`, undefined, token);
}

export async function updateAgentStatus(
  userId:  string,
  status:  AgentStatus,
  token:   string,
): Promise<AgentProfile> {
  return request<AgentProfile>(`/v1/agents/${userId}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status }),
  }, token);
}

export async function listOnboardingRequests(token: string): Promise<StoreOnboardingRequest[]> {
  const result = await request<StoreOnboardingRequest[]>('/v1/stores/onboarding', undefined, token);
  return result ?? [];
}

export async function reviewOnboardingRequest(
  requestId: string,
  decision:  'approved' | 'rejected',
  notes:     string,
  token:     string,
): Promise<StoreOnboardingRequest> {
  return request<StoreOnboardingRequest>(`/v1/stores/onboarding/${requestId}`, {
    method: 'PATCH',
    body:   JSON.stringify({ status: decision, notes }),
  }, token);
}
