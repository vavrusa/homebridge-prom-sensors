import axios, { AxiosInstance } from 'axios';
import { Logger } from 'homebridge';
import { PrometheusQueryResult } from './types';

export class PrometheusClient {
  private readonly client: AxiosInstance;
  private readonly log: Logger;

  constructor(baseUrl: string, log: Logger) {
    this.log = log;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Query Prometheus and return the numeric value.
   * Returns null if query fails or returns no data.
   */
  async query(promql: string): Promise<number | null> {
    try {
      const response = await this.client.get<PrometheusQueryResult>('/api/v1/query', {
        params: { query: promql },
      });

      if (response.data.status !== 'success') {
        this.log.error(`Prometheus query failed: ${response.data.error}`);
        return null;
      }

      const result = response.data.data?.result;
      if (!result || result.length === 0) {
        this.log.debug(`Prometheus query returned no results: ${promql}`);
        return null;
      }

      if (result.length > 1) {
        this.log.warn(`Prometheus query returned ${result.length} results, using first: ${promql}`);
      }

      const valueStr = result[0].value[1];
      const value = parseFloat(valueStr);

      if (isNaN(value)) {
        this.log.error(`Prometheus returned non-numeric value: ${valueStr}`);
        return null;
      }

      return value;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.log.error(`Prometheus request failed: ${error.message}`);
      } else {
        this.log.error(`Prometheus query error: ${error}`);
      }
      return null;
    }
  }
}
