import {
  Operator,
  Property,
  Territory,
  Market,
  GeocodeResult,
  ValidationResult,
  SyncLogEntry,
  GeocodeCacheEntry
} from '../types';

const TOKEN_KEY = '2d_nexus_jwt_token';
const OPERATOR_KEY = '2d_nexus_operator';

export class ApiService {
  private token: string | null = null;
  private currentOperator: Operator | null = null;

  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY);
    const storedOp = localStorage.getItem(OPERATOR_KEY);
    if (storedOp) {
      try {
        this.currentOperator = JSON.parse(storedOp);
      } catch (e) {
        this.currentOperator = null;
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  public getOperator(): Operator | null {
    return this.currentOperator;
  }

  public setSession(token: string, operator: Operator): void {
    this.token = token;
    this.currentOperator = operator;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(OPERATOR_KEY, JSON.stringify(operator));
  }

  public clearSession(): void {
    this.token = null;
    this.currentOperator = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(OPERATOR_KEY);
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        this.clearSession();
      }
      throw new Error(data.error || `HTTP Error ${response.status}`);
    }

    return data as T;
  }

  // Auth
  public logout(): void {
    this.clearSession();
  }

  public async login(email: string, password: string): Promise<{ token: string; operator: Operator }> {
    const res = await this.request<{ token: string; operator: Operator }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setSession(res.token, res.operator);
    return res;
  }

  public async getMe(): Promise<{ operator: Operator }> {
    const res = await this.request<{ operator: Operator }>('/api/auth/me');
    this.currentOperator = res.operator;
    localStorage.setItem(OPERATOR_KEY, JSON.stringify(res.operator));
    return res;
  }

  // Operators (Admin)
  public async getOperators(): Promise<{ operators: Operator[] }> {
    return this.request<{ operators: Operator[] }>('/api/operators');
  }

  public async createOperator(data: Partial<Operator> & { password?: string }): Promise<{ operator: Operator }> {
    return this.request<{ operator: Operator }>('/api/operators', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateOperator(id: number, data: Partial<Operator> & { unlock?: boolean; failed_login_attempts?: number; is_locked?: boolean }): Promise<{ operator: Operator }> {
    return this.request<{ operator: Operator }>(`/api/operators/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public async deleteOperator(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/operators/${id}`, {
      method: 'DELETE'
    });
  }

  // Properties
  public async getProperties(params?: {
    type?: string;
    status?: string;
    search?: string;
    operatorId?: number;
  }): Promise<{ properties: Property[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.operatorId) query.set('operatorId', String(params.operatorId));

    const qs = query.toString();
    return this.request<{ properties: Property[]; total: number }>(`/api/properties${qs ? '?' + qs : ''}`);
  }

  public async getProperty(id: number | string): Promise<{
    property: Property;
    validation: ValidationResult;
    seo: any;
  }> {
    return this.request<{
      property: Property;
      validation: ValidationResult;
      seo: any;
    }>(`/api/properties/${id}`);
  }

  public async createProperty(data: Partial<Property>): Promise<{ property: Property }> {
    return this.request<{ property: Property }>('/api/properties', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateProperty(id: number, data: Partial<Property>): Promise<{ property: Property }> {
    return this.request<{ property: Property }>(`/api/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  public async deleteProperty(id: number): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/properties/${id}`, {
      method: 'DELETE'
    });
  }

  public async verifyLocation(id: number, data: {
    verified: boolean;
    latitude?: number;
    longitude?: number;
    precision?: string;
  }): Promise<{ property: Property }> {
    return this.request<{ property: Property }>(`/api/properties/${id}/verify-location`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async syncTo2D(id: number): Promise<{
    success: boolean;
    sync: any;
    property: Property;
  }> {
    return this.request<{
      success: boolean;
      sync: any;
      property: Property;
    }>(`/api/properties/${id}/sync-2d`, {
      method: 'POST'
    });
  }

  // Geocoding
  public async geocode(address: string, city?: string, province?: string): Promise<{ geocode: GeocodeResult }> {
    return this.request<{ geocode: GeocodeResult }>('/api/geocode', {
      method: 'POST',
      body: JSON.stringify({ address, city, province })
    });
  }

  // SEO
  public async generateSeo(property: Partial<Property>): Promise<{ seo: any }> {
    return this.request<{ seo: any }>('/api/seo/generate', {
      method: 'POST',
      body: JSON.stringify(property)
    });
  }

  // Validation
  public async validate(property: Partial<Property>): Promise<{ validation: ValidationResult }> {
    return this.request<{ validation: ValidationResult }>('/api/validate', {
      method: 'POST',
      body: JSON.stringify(property)
    });
  }

  // Registries
  public async getTerritories(): Promise<{ territories: Territory[] }> {
    return this.request<{ territories: Territory[] }>('/api/territories');
  }

  public async getMarkets(): Promise<{ markets: Market[] }> {
    return this.request<{ markets: Market[] }>('/api/markets');
  }

  // Logs & Cache
  public async getSyncLogs(propertyId?: string): Promise<{ logs: SyncLogEntry[] }> {
    const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
    return this.request<{ logs: SyncLogEntry[] }>(`/api/sync-logs${qs}`);
  }

  public async getGeocodeCache(): Promise<{ cache: GeocodeCacheEntry[] }> {
    return this.request<{ cache: GeocodeCacheEntry[] }>('/api/geocode-cache');
  }

  public async getSqlSchema(): Promise<string> {
    const res = await fetch('/api/export-schema');
    return res.text();
  }

  public async getSchema(): Promise<{ schema_sql: string }> {
    const sql = await this.getSqlSchema();
    return { schema_sql: sql };
  }
}

export const api = new ApiService();
