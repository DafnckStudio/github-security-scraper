export interface SensitivePattern {
  id: string;
  pattern_name: string;
  pattern_regex: string;
  pattern_type: 'private_key' | 'api_key' | 'wallet_address' | 'database_credential' | 'seed_phrase' | 'mnemonic';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  is_active: boolean;
}

export interface SecurityFinding {
  id?: string;
  scan_id?: string;
  pattern_id?: string;
  repository_url: string;
  repository_name: string;
  repository_owner: string;
  file_path?: string;
  line_number?: number;
  code_snippet: string;
  matched_pattern: string;
  pattern_type: string;
  severity: string;
  is_verified?: boolean;
  is_false_positive?: boolean;
  notification_sent?: boolean;
  github_notified?: boolean;
  status?: 'new' | 'investigating' | 'confirmed' | 'resolved' | 'ignored';
  metadata?: Record<string, any>;
  discovered_at?: string;
}

export interface ScanHistory {
  id?: string;
  scan_type: 'code' | 'repositories' | 'issues' | 'commits';
  query: string;
  total_results?: number;
  findings_count?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  metadata?: Record<string, any>;
}

export interface SecurityAlert {
  id?: string;
  finding_id: string;
  alert_type: 'email' | 'webhook' | 'github_issue' | 'slack';
  recipient: string;
  message: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  error_message?: string;
  metadata?: Record<string, any>;
}

export interface ScraperConfig {
  github: {
    token: string;
    maxResultsPerScan: number;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  scraper: {
    intervalMinutes: number;
    enableNotifications: boolean;
    dryRun: boolean;
  };
  alerts: {
    email?: string;
    webhookUrl?: string;
  };
  logging: {
    level: string;
  };
}

export interface GitHubSearchResult {
  repository: {
    full_name: string;
    html_url: string;
    owner: {
      login: string;
    };
  };
  path: string;
  html_url: string;
  text_matches?: Array<{
    fragment: string;
    matches: Array<{
      text: string;
      indices: number[];
    }>;
  }>;
}
