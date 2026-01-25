import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class BatterySensor extends BaseSensor {
  private readonly lowThreshold: number;

  constructor(
    log: Logger,
    api: API,
    accessory: PlatformAccessory,
    config: SensorConfig,
    prometheus: PrometheusClient,
    defaultPollingInterval: number,
  ) {
    super(log, api, accessory, config, prometheus, defaultPollingInterval);
    this.lowThreshold = config.lowThreshold ?? 20;
  }

  initialize(): void {
    this.service = this.accessory.getService(this.Service.Battery)
      || this.accessory.addService(this.Service.Battery);

    this.service.setCharacteristic(this.Characteristic.Name, this.config.name);

    this.startPolling();
  }

  protected updateCharacteristics(value: number): void {
    // Clamp to 0-100
    const batteryLevel = Math.max(0, Math.min(100, Math.round(value)));

    this.service?.setCharacteristic(this.Characteristic.BatteryLevel, batteryLevel);

    // Set low battery status
    const statusLowBattery = batteryLevel < this.lowThreshold
      ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.service?.setCharacteristic(this.Characteristic.StatusLowBattery, statusLowBattery);

    // Not charging (we don't have this info from just SOC)
    this.service?.setCharacteristic(
      this.Characteristic.ChargingState,
      this.Characteristic.ChargingState.NOT_CHARGING,
    );
  }
}
