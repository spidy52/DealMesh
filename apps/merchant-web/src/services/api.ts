const API_BASE = '/api';

export interface MerchantOverviewData {
  store_name: string;
  category: string;
  trust_score: number;
  metrics: {
    ai_buyers_count: number;
    total_negotiations: number;
    successful_deals: number;
    total_revenue: number;
    average_discount_percent: number;
    conversion_rate: number;
    active_negotiations_count: number;
  };
}

export interface MerchantProductData {
  id: string;
  name: string;
  brand: string;
  category: string;
  listed_price: number;
  currency: string;
  rating: number;
  review_count: number;
  inventory: number;
  is_ai_native: boolean;
  features: string[];
  image_url?: string;
  policy?: {
    preferred_price: number;
    auto_negotiation_floor: number;
    absolute_floor: number;
    human_approval_threshold: number;
    max_discount_percent: number;
  };
}

export interface MerchantAgentData {
  id: string;
  merchant_id: string;
  agent_name: string;
  personality: string;
  is_paused: boolean;
  negotiation_enabled: boolean;
  max_auto_discount_percent: number;
  human_approval_threshold: number;
  inventory_reservation_enabled: boolean;
  suggest_alternatives: boolean;
  scarcity_mode: boolean;
}

export interface MerchantNegotiationData {
  id: string;
  buyer: string;
  product_id: string;
  product: string;
  listed: number;
  buyerOffer: number;
  titanBotCounter: number;
  finalAgreed?: number | null;
  status: string;
  approval_required: boolean;
  decision_reason?: string | null;
  inventory: number;
  privateFloor: number;
  preferredPrice: number;
  autoFloor: number;
  rounds: number;
  time: string;
  created_at?: string | null;
  messages: Array<{
    id: string;
    sender_type: string;
    sender_name: string;
    offer_amount?: number | null;
    message_text: string;
    timestamp: string;
  }>;
}

export interface MerchantAnalyticsData {
  total_revenue: number;
  orders_count: number;
  aov: number;
  total_negotiations: number;
  successful_deals: number;
  conversion_rate: number;
  average_discount_percent: number;
  active_negotiations_count: number;
  waiting_approval_count: number;
  agent_metrics: {
    autonomous_acceptances: number;
    autonomous_counters: number;
    human_escalations: number;
    human_approvals: number;
    human_rejections: number;
  };
  revenue_by_product: Array<{ name: string; revenue: number; orders: number }>;
  revenue_by_buyer: Array<{ agent: string; revenue: number; deals: number }>;
}

export const merchantApi = {
  async getOverview(merchantId = 'merchant_titan_demo'): Promise<MerchantOverviewData> {
    const res = await fetch(`${API_BASE}/merchant/overview?merchant_id=${merchantId}`);
    if (!res.ok) throw new Error('Failed to fetch overview');
    return res.json();
  },

  async getProducts(merchantId = 'merchant_titan_demo'): Promise<MerchantProductData[]> {
    const res = await fetch(`${API_BASE}/merchant/products?merchant_id=${merchantId}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async updateProductPolicy(productId: string, policy: any): Promise<any> {
    const res = await fetch(`${API_BASE}/merchant/products/${productId}/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(policy),
    });
    return res.json();
  },

  async updateInventory(productId: string, inventory: number): Promise<any> {
    const res = await fetch(`${API_BASE}/merchant/products/${productId}/inventory`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventory }),
    });
    return res.json();
  },

  async getAgentSettings(merchantId = 'merchant_titan_demo'): Promise<MerchantAgentData> {
    const res = await fetch(`${API_BASE}/merchant/agent?merchant_id=${merchantId}`);
    if (!res.ok) throw new Error('Failed to fetch agent');
    return res.json();
  },

  async updateAgentSettings(settings: Partial<MerchantAgentData>, merchantId = 'merchant_titan_demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/merchant/agent?merchant_id=${merchantId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  async toggleAgentPause(merchantId = 'merchant_titan_demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/merchant/agent/toggle-pause?merchant_id=${merchantId}`, {
      method: 'POST',
    });
    return res.json();
  },

  async getNegotiations(merchantId = 'merchant_titan_demo'): Promise<MerchantNegotiationData[]> {
    const res = await fetch(`${API_BASE}/merchant/negotiations?merchant_id=${merchantId}`);
    if (!res.ok) throw new Error('Failed to fetch negotiations');
    return res.json();
  },

  async decideNegotiation(negotiationId: string, decision: 'APPROVE' | 'REJECT', approvedPrice?: number, merchantId = 'merchant_titan_demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/merchant/negotiations/${negotiationId}/decision?merchant_id=${merchantId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, approved_price: approvedPrice }),
    });
    return res.json();
  },

  async getAnalytics(merchantId = 'merchant_titan_demo'): Promise<MerchantAnalyticsData> {
    const res = await fetch(`${API_BASE}/merchant/analytics?merchant_id=${merchantId}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAuditTrail(merchantId = 'merchant_titan_demo'): Promise<any> {
    const res = await fetch(`${API_BASE}/audit/merchant/${merchantId}`);
    return res.json();
  },
};
