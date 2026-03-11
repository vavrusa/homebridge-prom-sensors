import { PlatformAccessory, Logger, API } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class BatterySensor extends BaseSensor {
  private readonly lowThreshold: number;
  private readonly maxChargingRate: number;

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
    this.maxChargingRate = config.maxChargingRate ?? 250;
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

    const statusLowBattery = batteryLevel < this.lowThreshold
      ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.service?.setCharacteristic(this.Characteristic.StatusLowBattery, statusLowBattery);

    const chargingStateValue = values[1];
    if (chargingStateValue !== undefined) {
      const isCharging = chargingStateValue > 0;
      this.service?.setCharacteristic(
        this.Characteristic.ChargingState,
        isCharging
          ? this.Characteristic.ChargingState.CHARGING
          : this.Characteristic.ChargingState.NOT_CHARGING,
      );
    } else {
      this.service?.setCharacteristic(
        this.Characteristic.ChargingState,
        this.Characteristic.ChargingState.NOT_CHARGING,
      );
    }

    const solarPowerValue = values[2];
    if (solarPowerValue !== undefined) {
      const lightbulbService = this.accessory.getService(this.Service.Lightbulb)
        || this.accessory.addService(this.Service.Lightbulb);

      lightbulbService.setCharacteristic(this.Characteristic.Name, `${this.config.name} - Solar Power`);
      lightbulbService.setCharacteristic(
        this.Characteristic.ConfiguredName,
        `${this.config.name} - Solar Power`
      );

      lightbulbService.getCharacteristic(this.Characteristic.On)
        .setValue(true);

      lightbulbService.getCharacteristic(this.Characteristic.Brightness)
        .onGet(() => {
          return Math.min(100, Math.max(0, (solarPowerValue / this.maxChargingRate) * 100));
        });
    }
  }
}
