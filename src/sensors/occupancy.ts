import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class OccupancySensor extends BaseSensor {
  private readonly threshold: number;

  constructor(
    log: Logger,
    api: API,
    accessory: PlatformAccessory,
    config: SensorConfig,
    prometheus: PrometheusClient,
    defaultPollingInterval: number,
  ) {
    super(log, api, accessory, config, prometheus, defaultPollingInterval);
    this.threshold = config.threshold ?? 0.5;
  }

  initialize(): void {
    this.service = this.accessory.getService(this.Service.OccupancySensor)
      || this.accessory.addService(this.Service.OccupancySensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(value: number | number[]): void {
    const v = Array.isArray(value) ? value[0] : value;
    const occupancyDetected = v >= this.threshold
      ? this.Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
      : this.Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;

    this.service?.setCharacteristic(this.Characteristic.OccupancyDetected, occupancyDetected);
  }
}
