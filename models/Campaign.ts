export interface Campaign {
  id: string;
  name: string;
  ad_account_id: string;
  daily_budget_micro?: number;
  updated_at?: string;
  created_at?: string;
  start_time?: string;
  end_time?: string;
  status: string;
  deleted: string;
}

export interface CampaignRequestDTO {
  id?: string;
  name: string;
  ad_account_id: string;
  status: string;
  start_time?: string;
  end_time?: string;
  daily_budget_micro?: number;
  lifetime_spend_cap_micro?: number;
}
