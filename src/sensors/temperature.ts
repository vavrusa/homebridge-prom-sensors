import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class TemperatureSensor extends BaseSensor {
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
    this.service = this.accessory.getService(this.Service.TemperatureSensor)
      || this.accessory.addService(this.Service.TemperatureSensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    // Set valid range for temperature (-40 to 100°C covers most use cases)
    this.service.getCharacteristic(this.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -40,
        maxValue: 100,
      });

    this.startPolling();
  }

  protected updateCharacteristics(value: number): void {
    this.service?.setCharacteristic(this.Characteristic.CurrentTemperature, value);
  }
}
