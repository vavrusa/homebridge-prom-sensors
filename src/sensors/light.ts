import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class LightSensor extends BaseSensor {
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
    this.service = this.accessory.getService(this.Service.LightSensor)
      || this.accessory.addService(this.Service.LightSensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(values: number[]): void {
    // Light level in lux, minimum 0.0001
    const lux = Math.max(0.0001, values[0]);
    this.service?.setCharacteristic(this.Characteristic.CurrentAmbientLightLevel, lux);
  }
}
