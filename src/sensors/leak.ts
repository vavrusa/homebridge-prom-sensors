import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class LeakSensor extends BaseSensor {
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
    this.service = this.accessory.getService(this.Service.LeakSensor)
      || this.accessory.addService(this.Service.LeakSensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(value: number): void {
    const leakDetected = value >= this.threshold
      ? this.Characteristic.LeakDetected.LEAK_DETECTED
      : this.Characteristic.LeakDetected.LEAK_NOT_DETECTED;

    this.service?.setCharacteristic(this.Characteristic.LeakDetected, leakDetected);
  }
}
