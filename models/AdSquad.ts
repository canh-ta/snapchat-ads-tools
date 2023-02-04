import { EAdSquadType, EBidStrategy, EDeliveryConstraint, EOptimizationGoal, EStatus } from './enums';

export interface AdTargeting {
  demographics: {
    min_age: number;
    max_age: number;
    gender: 'FEMALE' | 'MALE' | undefined;
  }[];
  geos: {
    country_code: string;
  }[];
  devices: {
    os_type: 'iOS' | 'Android';
  }[];
}

export interface AdSquadCreateDTO {
  campaign_id: string;
  bid_strategy: EBidStrategy;
  bid_micro?: string; // R if BidStrategy = LOWEST_COST_WITH_MAX_BID or TARGET_COST
  roas_value_micro?: string; // R if BidStrategy = MIN_ROAS
  child_ad_type?: string;
  daily_budget_micro?: number;
  lifetime_budget_micro?: number;
  end_time?: string;
  name: string;
  optimization_goal: EOptimizationGoal;
  placement_v2?: any;
  start_time?: string;
  targeting: AdTargeting;
  type: EAdSquadType;
  delivery_constraint: EDeliveryConstraint;
}

export interface AdSquadDTO extends AdSquadCreateDTO {
  id: string;
  status: EStatus;
  updated_at?: string;
  created_at?: string;
  delivery_status?: string;
}
