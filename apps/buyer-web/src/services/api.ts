const API_BASE = '/api';

export interface PetData {
  id: string;
  name: string;
  species: string;
  personality: string;
  appearance: string;
  state: string;
  current_thought: string;
}

export interface BuyerPolicyData {
  id: string;
  user_id: string;
  target_price: number;
  auto_negotiation_cap: number;
  absolute_max: number;
  allowed_categories: string;
  allowed_merchants: string;
}

export interface RankedProductData {
  product_id: string;
  merchant_id: string;
  merchant_name: string;
  product_name: string;
  brand: string;
  original_price: number;
  current_price: number;
  currency: string;
  trust_score: number;
  trust_reasons: string[];
  rating: number;
  review_count: number;
  delivery_days: number;
  return_days: number;
  inventory: number;
  is_ai_native: boolean;
  negotiated_savings: number;
  value_composite_score: number;
  recommendation_badge?: string;
  win_explanation?: string;
  image_url?: string;
  url?: string;
}

export interface SearchResponse {
  search_session_id: string;
  query: string;
  strategy: string;
  stores_checked: number;
  products_found: number;
  ai_merchants_count: number;
  store_reports: Array<{
    merchant_id: string;
    merchant_name: string;
    status: string;
    is_ai_native: boolean;
    product_count: number;
  }>;
  ranked_products: RankedProductData[];
}

export interface NegotiationResult {
  negotiation_id: string;
  status: string;
  deal_id?: string;
  deal_ref?: string;
  original_price?: number;
  final_price?: number;
  savings?: number;
  current_merchant_counter?: number;
  message?: string;
  history?: Array<{ sender: string; price: number }>;
}

export interface TransactionPassportData {
  deal_ref: string;
  product_name: string;
  merchant_name: string;
  original_price: number;
  final_price: number;
  savings: number;
  currency: string;
  deal_status: string;
  payment_status: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  buyer_privacy_guarantee: string;
  merchant_privacy_guarantee: string;
  timeline: Array<{
    step: string;
    title: string;
    status: string;
    timestamp: string;
    details: string;
  }>;
}

export const api = {
  // Pet
  async getPet(): Promise<PetData> {
    const res = await fetch(`${API_BASE}/buyer/pet`);
    if (!res.ok) throw new Error('Failed to fetch pet');
    return res.json();
  },

  async updatePet(data: Partial<PetData>): Promise<any> {
    const res = await fetch(`${API_BASE}/buyer/pet`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updatePetState(state: string, current_thought = ''): Promise<any> {
    const res = await fetch(`${API_BASE}/buyer/pet/state`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state, current_thought }),
    });
    return res.json();
  },

  async chatWithPet(message: string): Promise<{ reply: string; pet_name: string }> {
    const res = await fetch(`${API_BASE}/buyer/pet/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error('Pet chat failed');
    return res.json();
  },

  // Policy
  async getPolicy(): Promise<BuyerPolicyData> {
    const res = await fetch(`${API_BASE}/buyer/policy`);
    if (!res.ok) throw new Error('Failed to fetch policy');
    return res.json();
  },

  async updatePolicy(data: Partial<BuyerPolicyData>): Promise<any> {
    const res = await fetch(`${API_BASE}/buyer/policy`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Search
  async searchMarket(
    query: string,
    min_price?: number,
    max_price?: number,
    strategy = 'BEST_VALUE'
  ): Promise<SearchResponse> {
    const body: Record<string, any> = { query, strategy };
    if (min_price !== undefined) body.min_price = min_price;
    if (max_price !== undefined) body.max_price = max_price;

    const res = await fetch(`${API_BASE}/search/market`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  async searchLive(
    query: string,
    min_price?: number,
    max_price?: number
  ): Promise<any> {
    const body: Record<string, any> = { query };
    if (min_price !== undefined) body.min_price = min_price;
    if (max_price !== undefined) body.max_price = max_price;

    const res = await fetch(`${API_BASE}/search/live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Live search failed');
    return res.json();
  },

  // Negotiation
  async startNegotiation(
    productId: string,
    merchantId: string,
    simulateAboveCap = false
  ): Promise<NegotiationResult> {
    const res = await fetch(`${API_BASE}/negotiations/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        merchant_id: merchantId,
        simulate_above_cap: simulateAboveCap,
      }),
    });
    if (!res.ok) throw new Error('Negotiation failed');
    return res.json();
  },

  async getNegotiationTranscript(negotiationId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/negotiations/${negotiationId}/transcript`);
    return res.json();
  },

  async submitApprovalDecision(
    negotiationId: string,
    decision: 'APPROVE' | 'REJECT',
    approvedPrice?: number
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/negotiations/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        negotiation_id: negotiationId,
        decision,
        approved_price: approvedPrice,
      }),
    });
    return res.json();
  },

  // Deals & Payments
  async getDeal(dealId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/deals/${dealId}`);
    return res.json();
  },

  async createPaymentOrder(dealId: string, simulateFailure = false): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, simulate_failure: simulateFailure }),
    });
    return res.json();
  },

  async simulateCheckout(dealId: string, simulateFailure = false): Promise<any> {
    const res = await fetch(`${API_BASE}/payments/simulate-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, simulate_failure: simulateFailure }),
    });
    return res.json();
  },

  // Recovery
  async executeRecovery(dealId: string, attemptNumber = 1): Promise<any> {
    const res = await fetch(`${API_BASE}/recovery/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deal_id: dealId, attempt_number: attemptNumber }),
    });
    return res.json();
  },

  // Passport
  async getTransactionPassport(dealId: string): Promise<TransactionPassportData> {
    const res = await fetch(`${API_BASE}/audit/passport/${dealId}`);
    if (!res.ok) throw new Error('Failed to fetch transaction passport');
    return res.json();
  },

  // Per-User Settings & Customization
  async getSettings(userId: string = 'user_buyer_default'): Promise<UserSettingsData> {
    try {
      const res = await fetch(`${API_BASE}/buyer/settings?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    } catch {
      return {
        user_id: userId,
        accent_color: '#00F0FF',
        eye_color: '#00F0FF',
        voice_name: 'default',
        voice_pitch: 1.0,
        voice_rate: 1.0,
        dock_x_percent: 0.85,
        dock_y_percent: 0.82,
      };
    }
  },

  async updateSettings(settings: Partial<UserSettingsData>, userId: string = 'user_buyer_default'): Promise<any> {
    const res = await fetch(`${API_BASE}/buyer/settings?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  },

  // Authentication
  async login(email: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async registerBuyer(name: string, email: string): Promise<any> {
    const res = await fetch(`${API_BASE}/auth/register/buyer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    return res.json();
  },
};

export interface UserSettingsData {
  user_id: string;
  accent_color: string;
  eye_color: string;
  voice_name: string;
  voice_pitch: number;
  voice_rate: number;
  dock_x_percent: number;
  dock_y_percent: number;
}
