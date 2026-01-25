import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class HumiditySensor extends BaseSensor {
  constructor(
    log: Logger,
    api: API,
    accessory: PlatformAccessory,
    config: SensorConfig,
    prometheus: PrometheusClient,
    defaultPollingInterval: number,
  ) {
    super(log, api, accessory, config, prometheus, defaultPollingInterval);
  }

  initialize(): void {
    this.service = this.accessory.getService(this.Service.HumiditySensor)
      || this.accessory.addService(this.Service.HumiditySensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(value: number): void {
    // Clamp to 0-100
    const humidity = Math.max(0, Math.min(100, value));
    this.service?.setCharacteristic(this.Characteristic.CurrentRelativeHumidity, humidity);
  }
}
