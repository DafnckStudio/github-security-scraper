import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';
import { SensitivePattern, SecurityFinding, ScanHistory, SecurityAlert } from '../types/index.js';
import logger from '../utils/logger.js';

export class SupabaseStorage {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(config.supabase.url, config.supabase.serviceRoleKey);
  }

  // Pattern Management
  async getActivePatterns(): Promise<SensitivePattern[]> {
    try {
      const { data, error } = await this.client
        .from('github_sensitive_patterns')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching patterns:', error);
      return [];
    }
  }

  // Scan History Management
  async createScanHistory(scan: Omit<ScanHistory, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await this.client
        .from('github_scan_history')
        .insert(scan)
        .select('id')
        .single();

      if (error) throw error;
      logger.info(`Created scan history: ${data.id}`);
      return data.id;
    } catch (error) {
      logger.error('Error creating scan history:', error);
      return null;
    }
  }

  async updateScanHistory(id: string, updates: Partial<ScanHistory>): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('github_scan_history')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating scan history:', error);
      return false;
    }
  }

  // Security Findings Management
  async createFinding(finding: Omit<SecurityFinding, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await this.client
        .from('github_security_findings')
        .insert(finding)
        .select('id')
        .single();

      if (error) throw error;
      logger.info(`Created security finding: ${data.id}`, {
        severity: finding.severity,
        type: finding.pattern_type,
        repo: finding.repository_name,
      });
      return data.id;
    } catch (error) {
      logger.error('Error creating finding:', error);
      return null;
    }
  }

  async findingExists(repoUrl: string, filePath: string, matchedPattern: string): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('github_security_findings')
        .select('id')
        .eq('repository_url', repoUrl)
        .eq('file_path', filePath)
        .eq('matched_pattern', matchedPattern)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      logger.error('Error checking finding existence:', error);
      return false;
    }
  }

  async getRecentFindings(limit: number = 100): Promise<SecurityFinding[]> {
    try {
      const { data, error } = await this.client
        .from('github_security_findings')
        .select('*')
        .order('discovered_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching recent findings:', error);
      return [];
    }
  }

  async getFindingsBySeverity(severity: string): Promise<SecurityFinding[]> {
    try {
      const { data, error } = await this.client
        .from('github_security_findings')
        .select('*')
        .eq('severity', severity)
        .eq('status', 'new')
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching findings by severity:', error);
      return [];
    }
  }

  // Alert Management
  async createAlert(alert: Omit<SecurityAlert, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await this.client
        .from('github_security_alerts')
        .insert(alert)
        .select('id')
        .single();

      if (error) throw error;
      logger.info(`Created alert: ${data.id}`);
      return data.id;
    } catch (error) {
      logger.error('Error creating alert:', error);
      return null;
    }
  }

  async updateAlert(id: string, updates: Partial<SecurityAlert>): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('github_security_alerts')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating alert:', error);
      return false;
    }
  }

  // Statistics
  async getStatistics(): Promise<any> {
    try {
      const [totalFindings, criticalFindings, newFindings, totalScans] = await Promise.all([
        this.client.from('github_security_findings').select('id', { count: 'exact', head: true }),
        this.client
          .from('github_security_findings')
          .select('id', { count: 'exact', head: true })
          .eq('severity', 'critical'),
        this.client
          .from('github_security_findings')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),
        this.client.from('github_scan_history').select('id', { count: 'exact', head: true }),
      ]);

      return {
        total_findings: totalFindings.count || 0,
        critical_findings: criticalFindings.count || 0,
        new_findings: newFindings.count || 0,
        total_scans: totalScans.count || 0,
      };
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      return {
        total_findings: 0,
        critical_findings: 0,
        new_findings: 0,
        total_scans: 0,
      };
    }
  }
}

export default new SupabaseStorage();
