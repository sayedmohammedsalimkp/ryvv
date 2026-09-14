export type User = {
  id: string;
  full_name: string;
  email?: string | null;
  currency: string;
};

export type Contact = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
  balance_paise: number;
  created_at?: string | null;
};

export type Account = {
  id: string;
  name: string;
  type: "upi" | "bank" | "other" | "cash";
  opening_balance_paise: number;
  balance_paise: number;
};

export type Category = {
  id: string;
  name: string;
  kind: "income" | "expense";
  is_system: boolean;
};

export type TxnType =
  | "income"
  | "expense"
  | "gave"
  | "received"
  | "borrowed"
  | "lent"
  | "settle";

export type Transaction = {
  id: string;
  type: TxnType;
  amount_paise: number;
  amount_rupees: number;
  txn_date: string;
  note?: string | null;
  contact_id?: string | null;
  contact_name?: string | null;
  account_id?: string | null;
  account_name?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  settled_at?: string | null;
  created_at?: string | null;
};

export type AccountBalance = {
  id: string;
  name: string;
  type: "upi" | "bank" | "other" | "cash";
  balance_paise: number;
};

export type MonthStat = {
  year: number;
  month: number;
  label: string;
  is_current: boolean;
  income_paise: number;
  expense_paise: number;
  net_paise: number;
};

export type Activity = {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  title: string;
  detail?: string | null;
  amount_paise?: number | null;
  created_at?: string | null;
};

export type Dashboard = {
  total_balance_paise: number;
  accounts_balance_paise: number;
  on_hand_paise: number;
  accounts: AccountBalance[];
  month_income_paise: number;
  month_expense_paise: number;
  month_net_paise: number;
  months: MonthStat[];
  you_will_get_paise: number;
  you_will_give_paise: number;
  get_contacts: Contact[];
  give_contacts: Contact[];
  unsettled_contacts: Contact[];
  contacts: Contact[];
  recent: Transaction[];
  activity: Activity[];
};
