import { PlatformConfig } from 'homebridge';

export type SensorType =
  | 'temperature'
  | 'humidity'
  | 'battery'
  | 'contact'
  | 'motion'
  | 'leak'
  | 'light'
  | 'occupancy';

export interface SensorConfig {
  /** Display name in HomeKit */
  name: string;
  /** PromQL query - should return a single value */
  query: string;
  /** Optional array of PromQL queries for sensors needing multiple values */
  queries?: string[];
  /** Type of HomeKit sensor to create */
  type: SensorType;
  /** Polling interval in seconds (default: 30) */
  pollingInterval?: number;
  /** For binary sensors: value >= threshold means triggered (default: 0.5) */
  threshold?: number;
  /** For battery: level below this triggers StatusLowBattery (default: 20) */
  lowThreshold?: number;
}

export interface PrometheusPlatformConfig extends PlatformConfig {
  /** Prometheus server URL */
  prometheusUrl: string;
  /** Default polling interval in seconds (default: 30) */
  defaultPollingInterval?: number;
  /** Sensor configurations */
  sensors: SensorConfig[];
}

export interface PrometheusQueryResult {
  status: 'success' | 'error';
  data?: {
    resultType: 'vector' | 'matrix' | 'scalar' | 'string';
    result: Array<{
      metric: Record<string, string>;
      value: [number, string]; // [timestamp, value]
    }>;
  };
  error?: string;
  errorType?: string;
}
