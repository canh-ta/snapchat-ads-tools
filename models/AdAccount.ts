enum BillingType {
  REVOLVING = "REVOLVING",
  IO = "IO",
}

enum Currency {
  AUD = "AUD",
  CAD = "CAD",
  EUR = "EUR",
  GBP = "GBP",
  USD = "USD",
}

enum AccountType {
  DIRECT = "DIRECT",
  PARTNER = "PARTNER",
}

export interface AdAccount {
  id: string;
  updated_at: string;
  created_at: string;
  name: string;
  type: AccountType;
  status: string;
  organization_id: string;
  funding_source_ids: string[];
  currency: Currency;
  timezone: string;
  advertiser_organization_id: string;
  billing_center_id: string;
  billing_type: BillingType;
  agency_representing_client: boolean;
  client_paying_invoices: boolean;
  regulations: {
    restricted_delivery_signals: boolean;
  };
}
