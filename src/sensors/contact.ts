import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class ContactSensor extends BaseSensor {
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
    this.service = this.accessory.getService(this.Service.ContactSensor)
      || this.accessory.addService(this.Service.ContactSensor);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(value: number): void {
    // value >= threshold means contact detected (closed)
    // value < threshold means contact not detected (open)
    const contactState = value >= this.threshold
      ? this.Characteristic.ContactSensorState.CONTACT_DETECTED
      : this.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;

    this.service?.setCharacteristic(this.Characteristic.ContactSensorState, contactState);
  }
}
