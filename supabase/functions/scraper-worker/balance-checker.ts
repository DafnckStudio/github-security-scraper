/**
 * Balance Checker pour Edge Function (Deno)
 */

export async function checkBalance(patternType: string, codeSnippet: string): Promise<any> {
  try {
    const address = extractAddress(codeSnippet);
    
    if (!address) {
      return { hasBalance: false, error: 'No address extracted' };
    }

    if (isEthereumAddress(address)) {
      return await checkEthereumBalance(address);
    } else if (isBitcoinAddress(address)) {
      return await checkBitcoinBalance(address);
    } else if (isSolanaAddress(address)) {
      return await checkSolanaBalance(address);
    }

    return { hasBalance: false };
  } catch (error: any) {
    console.error('Balance check error:', error.message);
    return { hasBalance: false, error: error.message };
  }
}

function extractAddress(text: string): string | null {
  const ethMatch = text.match(/0x[a-fA-F0-9]{40}/);
  if (ethMatch) return ethMatch[0];

  const btcMatch = text.match(/([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})/);
  if (btcMatch) return btcMatch[1];

  const solMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
  if (solMatch) return solMatch[0];

  return null;
}

async function checkEthereumBalance(address: string): Promise<any> {
  try {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`
    );
    const data = await response.json();

    if (data.status === '1' && data.result) {
      const balanceWei = BigInt(data.result);
      const balanceETH = Number(balanceWei) / 1e18;

      if (balanceETH > 0) {
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
    return { hasBalance: false, error: error.message };
  }
}

async function checkBitcoinBalance(address: string): Promise<any> {
  try {
    const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`);
    const data = await response.json();

    if (data.final_balance !== undefined) {
      const balanceBTC = data.final_balance / 1e8;

      if (balanceBTC > 0) {
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
    return { hasBalance: false, error: error.message };
  }
}

async function checkSolanaBalance(address: string): Promise<any> {
  try {
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
      const balanceSOL = data.result.value / 1e9;

      if (balanceSOL > 0) {
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
    return { hasBalance: false, error: error.message };
  }
}

function isEthereumAddress(text: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(text);
}

function isBitcoinAddress(text: string): boolean {
  return /^([13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,87})$/.test(text);
}

function isSolanaAddress(text: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text);
}
