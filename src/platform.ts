import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { PrometheusPlatformConfig, SensorConfig } from './types';
import { PrometheusClient } from './prometheus';
import { createSensor, BaseSensor } from './sensors';

export class PrometheusPlatform implements DynamicPlatformPlugin {
  private readonly accessories: Map<string, PlatformAccessory> = new Map();
  private readonly sensors: BaseSensor[] = [];
  private readonly prometheus: PrometheusClient;
  private readonly config: PrometheusPlatformConfig;
  private readonly defaultPollingInterval: number;

  constructor(
    public readonly log: Logger,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    this.config = config as PrometheusPlatformConfig;
    this.defaultPollingInterval = this.config.defaultPollingInterval ?? 30;

    if (!this.config.prometheusUrl) {
      this.log.error('prometheusUrl is required in config');
      this.prometheus = null!;
      return;
    }

    this.prometheus = new PrometheusClient(this.config.prometheusUrl, this.log);

    this.log.info(`Prometheus URL: ${this.config.prometheusUrl}`);

    this.api.on('didFinishLaunching', () => {
      this.discoverDevices();
    });
  }

  /**
   * Called for each cached accessory restored from disk.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.debug(`Restoring cached accessory: ${accessory.displayName}`);
    this.accessories.set(accessory.UUID, accessory);
  }

  /**
   * Create accessories for each configured sensor.
   */
  private discoverDevices(): void {
    if (!this.config.sensors || !Array.isArray(this.config.sensors)) {
      this.log.warn('No sensors configured');
      return;
    }

    const configuredUUIDs = new Set<string>();

    for (const sensorConfig of this.config.sensors) {
      if (!this.validateSensorConfig(sensorConfig)) {
        continue;
      }

      const uuid = this.api.hap.uuid.generate(sensorConfig.queries[0]);
      configuredUUIDs.add(uuid);

      let accessory = this.accessories.get(uuid);

      if (accessory) {
        // Existing accessory - update it
        this.log.info(`Updating existing accessory: ${sensorConfig.name}`);
        accessory.displayName = sensorConfig.name;
      } else {
        // New accessory - create it
        this.log.info(`Adding new accessory: ${sensorConfig.name}`);
        accessory = new this.api.platformAccessory(sensorConfig.name, uuid);
        this.accessories.set(uuid, accessory);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }

      // Store config in accessory context for potential future use
      accessory.context.sensorConfig = sensorConfig;

      // Create and initialize the sensor
      try {
        const sensor = createSensor(
          this.log,
          this.api,
          accessory,
          sensorConfig,
          this.prometheus,
          this.defaultPollingInterval,
        );
        sensor.initialize();
        this.sensors.push(sensor);
      } catch (error) {
        this.log.error(`Failed to create sensor ${sensorConfig.name}: ${error}`);
      }
    }

    // Remove accessories that are no longer in config
    for (const [uuid, accessory] of this.accessories) {
      if (!configuredUUIDs.has(uuid)) {
        this.log.info(`Removing accessory no longer in config: ${accessory.displayName}`);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        this.accessories.delete(uuid);
      }
    }

    this.log.info(`Discovered ${this.sensors.length} sensor(s)`);
  }

  /**
   * Validate a sensor configuration.
   */
  private validateSensorConfig(config: SensorConfig): boolean {
    if (!config.name) {
      this.log.error('Sensor config missing "name"');
      return false;
    }
    if (!config.queries || config.queries.length === 0) {
      this.log.error(`Sensor "${config.name}" missing "queries"`);
      return false;
    }
    if (!config.type) {
      this.log.error(`Sensor "${config.name}" missing "type"`);
      return false;
    }

    const validTypes = ['temperature', 'humidity', 'battery', 'contact', 'motion', 'leak', 'light', 'occupancy'];
    if (!validTypes.includes(config.type)) {
      this.log.error(`Sensor "${config.name}" has invalid type "${config.type}". Valid types: ${validTypes.join(', ')}`);
      return false;
    }

    return true;
  }
}
