# homebridge-prom-sensors

Homebridge plugin that exposes Prometheus metrics as HomeKit sensors.

## Build & Test

Development uses Docker exclusively:

```bash
# Start dev environment
docker compose up -d

# Restart after code changes
docker compose restart homebridge

# View logs
docker compose logs -f homebridge

# Stop
docker compose down
```

The `startup.sh` script builds and installs the plugin on each container start.

## Project Structure

```
src/
├── index.ts          # Plugin registration
├── platform.ts       # Main platform class
├── prometheus.ts     # Prometheus HTTP API client
├── settings.ts       # Plugin/platform name constants
├── types.ts          # TypeScript interfaces
└── sensors/
    ├── base.ts       # Abstract base sensor class
    ├── index.ts      # Sensor factory (createSensor)
    └── *.ts          # Sensor implementations
```

## Adding a New Sensor Type

1. Create `src/sensors/newsensor.ts` extending `BaseSensor`
2. Implement `setupServices()` and `updateValue()`
3. Add to `src/sensors/index.ts` factory switch
4. Add to `config.schema.json` sensor type enum
5. Update README.md supported types table

## Configuration

- `homebridge-data/config.json` - Homebridge config with plugin settings
- `config.schema.json` - Homebridge Config UI X schema

## Key Files

- `docker-compose.yml` - Dev container setup
- `homebridge-data/startup.sh` - Container startup script that builds/installs plugin
- `package.json` - Note: `name` must match `PLUGIN_NAME` in `src/settings.ts`
