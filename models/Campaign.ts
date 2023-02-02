export interface Campaign {
  id: string;
  name: string;
  daily_budget_micro?: number;
  updated_at?: string;
  created_at?: string;
  start_time?: string;
  end_time?: string;
  status: string;
  deleted: string;
}
