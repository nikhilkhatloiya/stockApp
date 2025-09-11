import axios from 'axios';
import Stock, { IStock } from '../models/Stock';

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  marketCap?: number;
  metadata?: {
    exchange?: string;
    sector?: string;
    industry?: string;
  };
}

interface APIProvider {
  name: string;
  fetchQuote: (symbol: string) => Promise<StockQuote>;
  fetchMultiple: (symbols: string[]) => Promise<StockQuote[]>;
}

class StockDataService {
  private providers: APIProvider[] = [];
  private currentProviderIndex = 0;
  private rateLimits = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Alpha Vantage Provider
    if (process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY !== 'JNDJNAUSHHKZOMOH') {
      this.providers.push({
        name: 'Alpha Vantage',
        fetchQuote: this.fetchAlphaVantageQuote.bind(this),
        fetchMultiple: this.fetchAlphaVantageMultiple.bind(this)
      });
    }

    // Finnhub Provider
    if (process.env.FINNHUB_API_KEY && process.env.FINNHUB_API_KEY !== 'd2vtfi9r01qm5lo9rmhgd2vtfi9r01qm5lo9rmi0d2vtfi9r01qm5lo9rmhgd2vtfi9r01qm5lo9rmi0') {
      this.providers.push({
        name: 'Finnhub',
        fetchQuote: this.fetchFinnhubQuote.bind(this),
        fetchMultiple: this.fetchFinnhubMultiple.bind(this)
      });
    }

    // IEX Cloud Provider
    if (process.env.IEX_CLOUD_API_KEY && process.env.IEX_CLOUD_API_KEY !== 'your-iex-cloud-api-key') {
      this.providers.push({
        name: 'IEX Cloud',
        fetchQuote: this.fetchIEXQuote.bind(this),
        fetchMultiple: this.fetchIEXMultiple.bind(this)
      });
    }

    console.log(`📈 Initialized ${this.providers.length} stock data provider(s): ${this.providers.map(p => p.name).join(', ')}`);
  }

  private async fetchAlphaVantageQuote(symbol: string): Promise<StockQuote> {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    
    const response = await axios.get(url);
    const quote = response.data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      throw new Error(`No data found for symbol ${symbol}`);
    }

    return {
      symbol: quote['01. symbol'],
      name: symbol, // Alpha Vantage doesn't provide company name in this endpoint
      price: parseFloat(quote['05. price']),
      previousClose: parseFloat(quote['08. previous close']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      dayHigh: parseFloat(quote['03. high']),
      dayLow: parseFloat(quote['04. low'])
    };
  }

  private async fetchAlphaVantageMultiple(symbols: string[]): Promise<StockQuote[]> {
    const results = [];
    for (const symbol of symbols) {
      try {
        const quote = await this.fetchAlphaVantageQuote(symbol);
        results.push(quote);
        // Rate limiting: Alpha Vantage allows 5 requests per minute
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 seconds between requests
      } catch (error) {
        console.error(`Failed to fetch ${symbol} from Alpha Vantage:`, error);
      }
    }
    return results;
  }

  private async fetchFinnhubQuote(symbol: string): Promise<StockQuote> {
    const [quoteResponse, profileResponse] = await Promise.all([
      axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`),
      axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`)
    ]);

    const quote = quoteResponse.data;
    const profile = profileResponse.data;

    if (!quote.c) {
      throw new Error(`No data found for symbol ${symbol}`);
    }

    return {
      symbol,
      name: profile.name || symbol,
      price: quote.c,
      previousClose: quote.pc,
      change: quote.d,
      changePercent: quote.dp,
      volume: 0, // Finnhub doesn't provide volume in quote endpoint
      dayHigh: quote.h,
      dayLow: quote.l,
      marketCap: profile.marketCapitalization,
      metadata: {
        exchange: profile.exchange,
        sector: profile.finnhubIndustry,
        industry: profile.finnhubIndustry
      }
    };
  }

  private async fetchFinnhubMultiple(symbols: string[]): Promise<StockQuote[]> {
    const promises = symbols.map(symbol => this.fetchFinnhubQuote(symbol));
    const results = await Promise.allSettled(promises);
    
    return results
      .filter((result): result is PromiseFulfilledResult<StockQuote> => result.status === 'fulfilled')
      .map(result => result.value);
  }

  private async fetchIEXQuote(symbol: string): Promise<StockQuote> {
    const url = `https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${process.env.IEX_CLOUD_API_KEY}`;
    const response = await axios.get(url);
    const quote = response.data;

    return {
      symbol: quote.symbol,
      name: quote.companyName,
      price: quote.latestPrice,
      previousClose: quote.previousClose,
      change: quote.change,
      changePercent: quote.changePercent * 100, // IEX returns as decimal
      volume: quote.latestVolume,
      dayHigh: quote.high,
      dayLow: quote.low,
      marketCap: quote.marketCap,
      metadata: {
        exchange: quote.primaryExchange,
        sector: quote.sector
      }
    };
  }

  private async fetchIEXMultiple(symbols: string[]): Promise<StockQuote[]> {
    const symbolsStr = symbols.join(',');
    const url = `https://cloud.iexapis.com/stable/stock/market/batch?symbols=${symbolsStr}&types=quote&token=${process.env.IEX_CLOUD_API_KEY}`;
    
    const response = await axios.get(url);
    const data = response.data;

    return symbols.map(symbol => {
      const quote = data[symbol]?.quote;
      if (!quote) return null;

      return {
        symbol: quote.symbol,
        name: quote.companyName,
        price: quote.latestPrice,
        previousClose: quote.previousClose,
        change: quote.change,
        changePercent: quote.changePercent * 100,
        volume: quote.latestVolume,
        dayHigh: quote.high,
        dayLow: quote.low,
        marketCap: quote.marketCap,
        metadata: {
          exchange: quote.primaryExchange,
          sector: quote.sector
        }
      };
    }).filter(Boolean) as StockQuote[];
  }

  private checkRateLimit(providerName: string): boolean {
    const limit = this.rateLimits.get(providerName);
    const now = Date.now();

    if (!limit) {
      this.rateLimits.set(providerName, { count: 1, resetTime: now + 60000 }); // 1 minute window
      return true;
    }

    if (now > limit.resetTime) {
      this.rateLimits.set(providerName, { count: 1, resetTime: now + 60000 });
      return true;
    }

    // Different rate limits per provider
    const maxRequests = providerName === 'Alpha Vantage' ? 5 : 
                       providerName === 'Finnhub' ? 60 : 100; // IEX Cloud

    if (limit.count < maxRequests) {
      limit.count++;
      return true;
    }

    return false;
  }

  async fetchQuote(symbol: string): Promise<StockQuote> {
    if (this.providers.length === 0) {
      throw new Error('No API providers configured. Please set up API keys in .env file.');
    }

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex];
      
      if (!this.checkRateLimit(provider.name)) {
        console.log(`Rate limit exceeded for ${provider.name}, trying next provider...`);
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        continue;
      }

      try {
        const quote = await provider.fetchQuote(symbol);
        console.log(`✅ Fetched ${symbol} from ${provider.name}: $${quote.price}`);
        return quote;
      } catch (error) {
        console.error(`❌ ${provider.name} failed for ${symbol}:`, (error as Error).message);
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
      }
    }

    throw new Error(`All API providers failed for symbol ${symbol}`);
  }

  async fetchMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    if (this.providers.length === 0) {
      throw new Error('No API providers configured. Please set up API keys in .env file.');
    }

    for (const provider of this.providers) {
      if (!this.checkRateLimit(provider.name)) {
        continue;
      }

      try {
        const quotes = await provider.fetchMultiple(symbols);
        console.log(`✅ Fetched ${quotes.length}/${symbols.length} quotes from ${provider.name}`);
        return quotes;
      } catch (error) {
        console.error(`❌ ${provider.name} failed for batch fetch:`, (error as Error).message);
      }
    }

    // Fallback: fetch individually
    const quotes: StockQuote[] = [];
    for (const symbol of symbols) {
      try {
        const quote = await this.fetchQuote(symbol);
        quotes.push(quote);
      } catch (error) {
        console.error(`Failed to fetch individual quote for ${symbol}`);
      }
    }

    return quotes;
  }

  async updateStockInDatabase(quote: StockQuote): Promise<IStock> {
    try {
      const existingStock = await Stock.findOne({ symbol: quote.symbol });

      if (existingStock) {
        // Update existing stock
        Object.assign(existingStock, {
          ...quote,
          lastUpdated: new Date()
        });
        
        // Add to history if price changed
        if (existingStock.price !== quote.price) {
          existingStock.history.push({ price: quote.price, timestamp: new Date() });
          // Keep only last 100 entries
          if (existingStock.history.length > 100) {
            existingStock.history = existingStock.history.slice(-100);
          }
        }
        
        return await existingStock.save();
      } else {
        // Create new stock entry
        const newStock = new Stock({
          ...quote,
          lastUpdated: new Date(),
          history: [{ price: quote.price, timestamp: new Date() }]
        });
        
        return await newStock.save();
      }
    } catch (error) {
      console.error(`❌ Failed to update stock ${quote.symbol} in database:`, error);
      throw error;
    }
  }

  async updateMultipleStocksInDatabase(quotes: StockQuote[]): Promise<IStock[]> {
    const results = [];
    
    for (const quote of quotes) {
      try {
        const stock = await this.updateStockInDatabase(quote);
        results.push(stock);
      } catch (error) {
        console.error(`Failed to update ${quote.symbol}:`, error);
      }
    }

    return results;
  }

  // Mock data generator for testing when no API keys are available
  generateMockQuote(symbol: string): StockQuote {
    const basePrice = Math.random() * 1000 + 50; // Random price between $50-$1050
    const change = (Math.random() - 0.5) * 20; // Random change between -$10 and +$10
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      name: `${symbol} Inc.`,
      price: parseFloat(basePrice.toFixed(2)),
      previousClose: parseFloat((basePrice - change).toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 100000,
      dayHigh: parseFloat((basePrice + Math.random() * 10).toFixed(2)),
      dayLow: parseFloat((basePrice - Math.random() * 10).toFixed(2)),
      marketCap: Math.floor(Math.random() * 1000000000000) + 1000000000,
      metadata: {
        exchange: 'NASDAQ',
        sector: 'Technology'
      }
    };
  }
}

export default new StockDataService();
