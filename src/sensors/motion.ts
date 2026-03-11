import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class MotionSensor extends BaseSensor {
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
    this.service = this.accessory.getService(this.Service.MotionSensor)
      || this.accessory.addService(this.Service.MotionSensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(value: number | number[]): void {
    const v = Array.isArray(value) ? value[0] : value;
    const motionDetected = v >= this.threshold;
    this.service?.setCharacteristic(this.Characteristic.MotionDetected, motionDetected);
  }
}
