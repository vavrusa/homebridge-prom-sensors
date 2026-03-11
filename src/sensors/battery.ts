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

  protected updateCharacteristics(value: number | number[]): void {
    const values = Array.isArray(value) ? value : [value];
    const batteryLevel = Math.max(0, Math.min(100, Math.round(values[0])));

    this.service?.setCharacteristic(this.Characteristic.BatteryLevel, batteryLevel);

    // Set low battery status
    const statusLowBattery = batteryLevel < this.lowThreshold
      ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.service?.setCharacteristic(this.Characteristic.StatusLowBattery, statusLowBattery);

    // ChargingState from second query if available
    const chargingValue = values[1];
    if (chargingValue !== undefined) {
      const isCharging = chargingValue > 0;
      this.service?.setCharacteristic(
        this.Characteristic.ChargingState,
        isCharging
          ? this.Characteristic.ChargingState.CHARGING
          : this.Characteristic.ChargingState.NOT_CHARGING,
      );
    } else {
      // Default to not charging when no second query
      this.service?.setCharacteristic(
        this.Characteristic.ChargingState,
        this.Characteristic.ChargingState.NOT_CHARGING,
      );
    }
  }
}
