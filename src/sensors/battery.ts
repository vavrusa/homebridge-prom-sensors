import { PlatformAccessory, Logger, API, Service, Perms } from 'homebridge';
import { BaseSensor } from './base';
import { PrometheusClient } from '../prometheus';
import { SensorConfig } from '../types';

export class BatterySensor extends BaseSensor {
  private readonly lowThreshold: number;
  private readonly maxChargingRate: number;

  private outletService!: Service;
  private batteryService!: Service;
  private lightSensorService!: Service;

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
    this.accessory.context.Services = [];

    this.outletService = this.accessory.getService(this.Service.Outlet)
      || this.accessory.addService(this.Service.Outlet, this.config.name);

    this.outletService.setCharacteristic(this.Characteristic.Name, this.config.name);
    this.outletService.setCharacteristic(
      this.Characteristic.ConfiguredName,
      this.config.name
    );

    this.outletService.getCharacteristic(this.Characteristic.OutletInUse)
      .onGet(async () => {
        return await this.isOutletEnabled();
      });

    this.setOutletReadOnly();

    this.batteryService = this.accessory.getService(this.Service.Battery)
      || this.accessory.addService(this.Service.Battery);

    this.batteryService.setCharacteristic(this.Characteristic.Name, `${this.config.name} Battery`);
    this.outletService.addLinkedService(this.batteryService);

    this.lightSensorService = this.accessory.getService(this.Service.LightSensor)
      || this.accessory.addService(this.Service.LightSensor);

    this.lightSensorService.setCharacteristic(
      this.Characteristic.Name,
      `${this.config.name} Solar Input`
    );
    this.outletService.addLinkedService(this.lightSensorService);

    this.startPolling();
  }

  protected updateCharacteristics(value: number | number[]): void {
    const values = Array.isArray(value) ? value : [value];
    const batteryLevel = Math.max(0, Math.min(100, Math.round(values[0])));

    this.batteryService?.setCharacteristic(this.Characteristic.BatteryLevel, batteryLevel);

    const statusLowBattery = batteryLevel < this.lowThreshold
      ? this.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
      : this.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;

    this.batteryService?.setCharacteristic(this.Characteristic.StatusLowBattery, statusLowBattery);

    const chargingStateValue = values.length > 1 ? values[1] : undefined;
    if (chargingStateValue !== undefined) {
      const isCharging = chargingStateValue > 0;
      this.batteryService?.setCharacteristic(
        this.Characteristic.ChargingState,
        isCharging
          ? this.Characteristic.ChargingState.CHARGING
          : this.Characteristic.ChargingState.NOT_CHARGING,
      );
    } else {
      this.batteryService?.setCharacteristic(
        this.Characteristic.ChargingState,
        this.Characteristic.ChargingState.NOT_CHARGING,
      );
    }

    const solarPowerValue = values.length > 2 ? values[2] : (values.length > 1 ? values[1] : undefined);
    if (solarPowerValue !== undefined) {
      const luxValue = Math.max(0.0001, solarPowerValue / this.maxChargingRate);
      this.lightSensorService?.setCharacteristic(
        this.Characteristic.CurrentAmbientLightLevel,
        luxValue
      );
    }
  }

  private async isOutletEnabled(): Promise<boolean> {
    const outletQueryValue = this.config.queries[3];
    if (outletQueryValue === undefined) {
      return false;
    }
    try {
      const result = await this.prometheus.query(outletQueryValue);
      return result !== null && result > 0;
    } catch {
      return false;
    }
  }

  setOutletReadOnly(): void {
    const onCharacteristic = this.outletService.getCharacteristic(this.Characteristic.OutletInUse);
    onCharacteristic.setProps({
      perms: [Perms.PAIRED_READ, Perms.NOTIFY]
    });
  }
}
