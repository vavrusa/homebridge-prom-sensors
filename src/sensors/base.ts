import {
  PlatformAccessory,
  Service,
  Characteristic,
  Logger,
  API,
} from 'homebridge';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export abstract class BaseSensor {
  protected readonly log: Logger;
  protected readonly api: API;
  protected readonly accessory: PlatformAccessory;
  protected readonly config: SensorConfig;
  protected readonly prometheus: PrometheusClient;
  protected readonly pollingInterval: number;

  protected service: Service | undefined;
  protected pollTimer: NodeJS.Timeout | undefined;
  protected lastValue: number | null = null;

  // Shortcuts for HAP types
  protected readonly Service: typeof Service;
  protected readonly Characteristic: typeof Characteristic;

  constructor(
    log: Logger,
    api: API,
    accessory: PlatformAccessory,
    config: SensorConfig,
    prometheus: PrometheusClient,
    defaultPollingInterval: number,
  ) {
    this.log = log;
    this.api = api;
    this.accessory = accessory;
    this.config = config;
    this.prometheus = prometheus;
    this.pollingInterval = config.pollingInterval ?? defaultPollingInterval;

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    // Set accessory information
    this.accessory.getService(this.Service.AccessoryInformation)!
      .setCharacteristic(this.Characteristic.Manufacturer, 'Prometheus')
      .setCharacteristic(this.Characteristic.Model, config.type)
      .setCharacteristic(this.Characteristic.SerialNumber, this.generateSerialNumber());
  }

  /**
   * Initialize the sensor service and start polling.
   */
  abstract initialize(): void;

/**
 * Update HomeKit characteristics with the given array of values.
 */
protected abstract updateCharacteristics(value: number[]): void;

  /**
   * Start the polling loop.
   */
  startPolling(): void {
    // Initial poll
    this.poll();

    // Set up interval
    this.pollTimer = setInterval(() => {
      this.poll();
    }, this.pollingInterval * 1000);

    this.log.debug(`Started polling ${this.config.name} every ${this.pollingInterval}s`);
  }

  /**
   * Stop the polling loop.
   */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  /**
   * Poll Prometheus and update characteristics.
   */
  private async poll(): Promise<void> {
    const results = await Promise.all(
      this.config.queries.map((q) => this.prometheus.query(q)),
    );
    
    const hasNulls = results.some((r) => r === null);
    
if (!hasNulls) {
    const values = results as number[];
    this.lastValue = values[0];
    this.updateCharacteristics(values);
    this.log.debug(`${this.config.name}: ${JSON.stringify(values)}`);
  }
  }

  /**
   * Generate a unique serial number based on the query.
   */
  private generateSerialNumber(): string {
    // Simple hash of the first query string
    const query = this.config.queries[0];
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `PROM-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  }
}
