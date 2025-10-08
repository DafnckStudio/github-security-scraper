/**
 * Balance Checker Service
 * Vérifie si les wallets/adresses détectés ont des fonds
 */

import logger from '../utils/logger.js';

interface BalanceResult {
  hasBalance: boolean;
  balance?: string;
  balanceUSD?: number;
  currency?: string;
  address?: string;
  blockchain?: string;
  error?: string;
}

export class BalanceChecker {
  /**
   * Vérifie si une clé/adresse a des fonds
   */
  async checkBalance(patternType: string, codeSnippet: string): Promise<BalanceResult> {
    try {
      // Extraire l'adresse selon le type
      const address = this.extractAddress(patternType, codeSnippet);

      if (!address) {
        return { hasBalance: false, error: 'No address extracted' };
      }

      // Vérifier selon le type de blockchain
      if (this.isEthereumAddress(address)) {
        return await this.checkEthereumBalance(address);
      } else if (this.isBitcoinAddress(address)) {
        return await this.checkBitcoinBalance(address);
      } else if (this.isSolanaAddress(address)) {
        return await this.checkSolanaBalance(address);
      }

      return { hasBalance: false, error: 'Unknown address format' };
    } catch (error: any) {
      logger.error('Error checking balance:', error);
      return { hasBalance: false, error: error.message };
    }
  }

  /**
   * Extrait l'adresse du code snippet
   */
  private extractAddress(patternType: string, codeSnippet: string): string | null {
    // Ethereum/EVM address (0x...)
    const ethMatch = codeSnippet.match(/0x[a-fA-F0-9]{40}/);
    if (ethMatch) return ethMatch[0];

    // Bitcoin address (1..., 3..., bc1...)
    const btcMatch = codeSnippet.match(/(?:^|[^a-zA-Z0-9])([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})(?:[^a-zA-Z0-9]|$)/);
    if (btcMatch) return btcMatch[1];

    // Solana address (base58)
    const solMatch = codeSnippet.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    if (solMatch) return solMatch[0];

    return null;
  }

  /**
   * Vérifie balance Ethereum/EVM (via Etherscan API gratuit)
   */
  private async checkEthereumBalance(address: string): Promise<BalanceResult> {
    try {
      // API Etherscan gratuite (pas besoin de clé pour balance)
      const response = await fetch(
        `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`
      );

      const data = await response.json();

      if (data.status === '1' && data.result) {
        const balanceWei = BigInt(data.result);
        const balanceETH = Number(balanceWei) / 1e18;

        if (balanceETH > 0) {
          // Obtenir le prix ETH (approximatif via CoinGecko - gratuit)
          const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
          const priceData = await priceResponse.json();
          const ethPriceUSD = priceData.ethereum?.usd || 0;

          return {
            hasBalance: true,
            balance: balanceETH.toFixed(6),
            balanceUSD: balanceETH * ethPriceUSD,
            currency: 'ETH',
            address,
            blockchain: 'Ethereum',
          };
        }
      }

      return { hasBalance: false, address, blockchain: 'Ethereum' };
    } catch (error: any) {
      logger.error('Error checking Ethereum balance:', error);
      return { hasBalance: false, error: error.message, blockchain: 'Ethereum' };
    }
  }

  /**
   * Vérifie balance Bitcoin (via BlockCypher API gratuit)
   */
  private async checkBitcoinBalance(address: string): Promise<BalanceResult> {
    try {
      // API BlockCypher gratuite
      const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);

      const data = await response.json();

      if (data.final_balance !== undefined) {
        const balanceSatoshi = data.final_balance;
        const balanceBTC = balanceSatoshi / 1e8;

        if (balanceBTC > 0) {
          // Obtenir le prix BTC
          const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
          const priceData = await priceResponse.json();
          const btcPriceUSD = priceData.bitcoin?.usd || 0;

          return {
            hasBalance: true,
            balance: balanceBTC.toFixed(8),
            balanceUSD: balanceBTC * btcPriceUSD,
            currency: 'BTC',
            address,
            blockchain: 'Bitcoin',
          };
        }
      }

      return { hasBalance: false, address, blockchain: 'Bitcoin' };
    } catch (error: any) {
      logger.error('Error checking Bitcoin balance:', error);
      return { hasBalance: false, error: error.message, blockchain: 'Bitcoin' };
    }
  }

  /**
   * Vérifie balance Solana (via RPC public gratuit)
   */
  private async checkSolanaBalance(address: string): Promise<BalanceResult> {
    try {
      // RPC public Solana
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });

      const data = await response.json();

      if (data.result?.value !== undefined) {
        const balanceLamports = data.result.value;
        const balanceSOL = balanceLamports / 1e9;

        if (balanceSOL > 0) {
          // Obtenir le prix SOL
          const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
          const priceData = await priceResponse.json();
          const solPriceUSD = priceData.solana?.usd || 0;

          return {
            hasBalance: true,
            balance: balanceSOL.toFixed(6),
            balanceUSD: balanceSOL * solPriceUSD,
            currency: 'SOL',
            address,
            blockchain: 'Solana',
          };
        }
      }

      return { hasBalance: false, address, blockchain: 'Solana' };
    } catch (error: any) {
      logger.error('Error checking Solana balance:', error);
      return { hasBalance: false, error: error.message, blockchain: 'Solana' };
    }
  }

  /**
   * Vérifie si c'est une adresse Ethereum valide
   */
  private isEthereumAddress(text: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(text);
  }

  /**
   * Vérifie si c'est une adresse Bitcoin valide
   */
  private isBitcoinAddress(text: string): boolean {
    return /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})$/.test(text);
  }

  /**
   * Vérifie si c'est une adresse Solana valide
   */
  private isSolanaAddress(text: string): boolean {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text);
  }

  /**
   * Formate le montant en USD
   */
  formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

export default new BalanceChecker();
