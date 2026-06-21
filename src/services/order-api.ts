import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3004' : 'http://localhost:3004';

export type OrderStatus =
  | 'new' | 'accepted' | 'dispatched' | 'delivered' | 'cancelled' | 'declined';

export interface OrderItem {
  productId:   string;
  productName: string;
  quantity:    number;
  unit:        string;
  unitPrice:   number;
}

export interface DeliveryAddress {
  name:    string;
  phone:   string;
  line1:   string;
  line2?:  string;
  pincode: string;
  city:    string;
  state:   string;
}

export interface Order {
  id:              string;
  buyerId:         string;
  buyerName:       string;
  buyerPhone:      string;
  sellerId:        string;
  sellerName:      string;
  sellerLocation:  string;
  items:           OrderItem[];
  totalAmount:     number;   // paise
  status:          OrderStatus;
  paymentMethod:   'cod' | 'online';
  deliveryAddress: DeliveryAddress;
  agentId?:        string;
  deliveryOtp?:    string;
  notes?:          string;
  createdAt:       string;
  updatedAt:       string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json() as { success: boolean; data?: T; error?: { title: string } };
  if (!body.success) throw new Error(body.error?.title ?? 'Order service error');
  return body.data as T;
}

export async function listOrders(filters?: {
  status?:   OrderStatus;
  sellerId?: string;
  agentId?:  string;
}): Promise<Order[]> {
  const params = new URLSearchParams();
  if (filters?.status)   params.set('status',   filters.status);
  if (filters?.sellerId) params.set('sellerId', filters.sellerId);
  if (filters?.agentId)  params.set('agentId',  filters.agentId);
  const qs     = params.toString();
  const result = await request<Order[]>(`/v1/orders${qs ? `?${qs}` : ''}`);
  return result ?? [];
}

export async function getOrder(id: string): Promise<Order> {
  return request<Order>(`/v1/orders/${id}`);
}

export async function updateOrderStatus(
  id:       string,
  status:   OrderStatus,
  agentId?: string,
): Promise<Order> {
  return request<Order>(`/v1/orders/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify({ status, ...(agentId ? { agentId } : {}) }),
  });
}

export async function verifyDeliveryOtp(id: string, otp: string): Promise<Order> {
  return request<Order>(`/v1/orders/${id}/verify-delivery`, {
    method: 'POST',
    body:   JSON.stringify({ otp }),
  });
}
