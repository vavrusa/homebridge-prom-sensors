import { PlatformAccessory, Logger, API } from 'homebridge';
import { PrometheusClient } from '../prometheus';
import { SensorConfig, SensorType } from '../types';
import { BaseSensor } from './base';
import { TemperatureSensor } from './temperature';
import { HumiditySensor } from './humidity';
import { BatterySensor } from './battery';
import { ContactSensor } from './contact';
import { MotionSensor } from './motion';
import { LeakSensor } from './leak';
import { LightSensor } from './light';
import { OccupancySensor } from './occupancy';

export function createSensor(
  log: Logger,
  api: API,
  accessory: PlatformAccessory,
  config: SensorConfig,
  prometheus: PrometheusClient,
  defaultPollingInterval: number,
): BaseSensor {
  const sensorClasses: Record<SensorType, new (...args: ConstructorParameters<typeof BaseSensor>) => BaseSensor> = {
    temperature: TemperatureSensor,
    humidity: HumiditySensor,
    battery: BatterySensor,
    contact: ContactSensor,
    motion: MotionSensor,
    leak: LeakSensor,
    light: LightSensor,
    occupancy: OccupancySensor,
  };

  const SensorClass = sensorClasses[config.type];
  if (!SensorClass) {
    throw new Error(`Unknown sensor type: ${config.type}`);
  }

  return new SensorClass(log, api, accessory, config, prometheus, defaultPollingInterval);
}

export { BaseSensor } from './base';
