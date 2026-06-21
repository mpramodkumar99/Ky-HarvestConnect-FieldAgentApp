import { Platform } from 'react-native';

const BASE_URL  = Platform.OS === 'android' ? 'http://10.0.2.2:3002' : 'http://localhost:3002';
const AUTH_URL  = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://localhost:3001';

export type AgentStatus = 'available' | 'on_delivery' | 'offline';

export interface AgentProfile {
  id:              string;
  userId:          string;
  name:            string;
  phone:           string;
  email?:          string;
  vehicleType?:    string;
  vehicleNumber?:  string;
  zone:            string;
  status:          AgentStatus;
  totalDeliveries: number;
  rating:          number;
  kycVerified:     boolean;
  bankLinked:      boolean;
  createdAt:       string;
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

export interface CreateAgentInput {
  name:   string;
  phone:  string;
  email?: string;
}

export interface UpdateAgentProfileInput {
  name?:          string;
  email?:         string;
  vehicleType?:   string;
  vehicleNumber?: string;
  zone?:          string;
}

export interface AgentBankInput {
  accountHolderName: string;
  accountNumber:     string;
  ifscCode:          string;
  bankName:          string;
  upiId?:            string;
}

export interface AgentKycInput {
  aadhaarNumber:        string;
  panNumber:            string;
  drivingLicenseNumber: string;
  vehicleRcNumber:      string;
  insurancePolicyNumber?: string;
}

async function request<T>(url: string, init?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(url, {
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

export async function createAgent(input: CreateAgentInput): Promise<void> {
  await request<void>(`${BASE_URL}/v1/users`, {
    method: 'POST',
    body:   JSON.stringify({ ...input, type: 'agent' }),
  });
}

export async function getAgentProfile(userId: string, token: string): Promise<AgentProfile> {
  return request<AgentProfile>(`${BASE_URL}/v1/agents/${userId}`, undefined, token);
}

export async function updateAgentProfile(userId: string, input: UpdateAgentProfileInput, token: string): Promise<AgentProfile> {
  return request<AgentProfile>(`${BASE_URL}/v1/agents/${userId}`, {
    method: 'PATCH',
    body:   JSON.stringify(input),
  }, token);
}

export async function updateAgentBank(userId: string, input: AgentBankInput, token: string): Promise<void> {
  await request<void>(`${BASE_URL}/v1/agents/${userId}/bank`, {
    method: 'PUT',
    body:   JSON.stringify(input),
  }, token);
}

export async function updateAgentKyc(userId: string, input: AgentKycInput, token: string): Promise<void> {
  await request<void>(`${BASE_URL}/v1/agents/${userId}/kyc`, {
    method: 'PUT',
    body:   JSON.stringify(input),
  }, token);
}

export async function updateAgentStatus(userId: string, status: AgentStatus, token: string): Promise<AgentProfile> {
  return request<AgentProfile>(`${BASE_URL}/v1/agents/${userId}/status`, {
    method: 'PATCH',
    body:   JSON.stringify({ status }),
  }, token);
}

export async function listOnboardingRequests(token: string): Promise<StoreOnboardingRequest[]> {
  const result = await request<StoreOnboardingRequest[]>(`${BASE_URL}/v1/stores/onboarding`, undefined, token);
  return result ?? [];
}

export async function reviewOnboardingRequest(requestId: string, decision: 'approved' | 'rejected', notes: string, token: string): Promise<StoreOnboardingRequest> {
  return request<StoreOnboardingRequest>(`${BASE_URL}/v1/stores/onboarding/${requestId}`, {
    method: 'PATCH',
    body:   JSON.stringify({ status: decision, notes }),
  }, token);
}
