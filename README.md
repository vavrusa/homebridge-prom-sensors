# homebridge-prom-sensors

A [Homebridge](https://homebridge.io) plugin that exposes [Prometheus](https://prometheus.io) metrics as HomeKit sensors.

## Features

- Query any Prometheus metric using PromQL
- Support for multiple HomeKit sensor types
- Configurable polling intervals
- Threshold-based binary sensors
- Full Homebridge Config UI X support

## Supported Sensor Types

| Type | HomeKit Service | Use Case |
|------|-----------------|----------|
| `temperature` | Temperature Sensor | Server temps, room temps, device temps |
| `humidity` | Humidity Sensor | Environment humidity |
| `battery` | Battery Service | UPS charge, device batteries |
| `contact` | Contact Sensor | Service up/down, binary states |
| `motion` | Motion Sensor | Alert thresholds (CPU > 80%) |
| `leak` | Leak Sensor | Water/leak detection alerts |
| `light` | Light Sensor | Ambient light levels (lux) |
| `occupancy` | Occupancy Sensor | Presence detection |

## Installation

```bash
npm install -g homebridge-prom-sensors
```

Or search for "prometheus" in the Homebridge Config UI X plugin browser.

## Configuration

Add to your Homebridge `config.json`:

```json
{
  "platforms": [
    {
      "platform": "PrometheusMetrics",
      "name": "Prometheus",
      "prometheusUrl": "http://192.168.1.100:9090",
      "defaultPollingInterval": 30,
      "sensors": [
        {
          "name": "Anker Battery",
          "query": "anker_battery_soc_percent",
          "type": "battery",
          "lowThreshold": 20
        },
        {
          "name": "Anker Temperature",
          "query": "anker_temperature_celsius",
          "type": "temperature"
        },
        {
          "name": "Server Online",
          "query": "up{job=\"node\"}",
          "type": "contact",
          "threshold": 1
        }
      ]
    }
  ]
}
```

## Sensor Configuration

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `name` | Yes | - | Display name in HomeKit |
| `query` | Yes | - | PromQL query (must return single value) |
| `type` | Yes | - | Sensor type (see supported types above) |
| `pollingInterval` | No | 30 | Seconds between queries |
| `threshold` | No | 0.5 | For binary sensors: value >= threshold = triggered |
| `lowThreshold` | No | 20 | For battery: level below this = low battery warning |

## Examples

### Monitor a UPS battery

```json
{
  "name": "UPS Battery",
  "query": "apcupsd_battery_charge_percent",
  "type": "battery",
  "lowThreshold": 30
}
```

### Alert when CPU is high

```json
{
  "name": "High CPU Alert",
  "query": "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
  "type": "motion",
  "threshold": 80,
  "pollingInterval": 60
}
```

### Monitor service availability

```json
{
  "name": "Web Server",
  "query": "up{job=\"webserver\"}",
  "type": "contact",
  "threshold": 1,
  "pollingInterval": 10
}
```

### Room temperature from multiple sensors

```json
{
  "name": "Living Room Temp",
  "query": "avg(temperature_celsius{room=\"living_room\"})",
  "type": "temperature"
}
```

## Development

```bash
# Clone the repo
git clone https://github.com/yourusername/homebridge-prom-sensors
cd homebridge-prom-sensors

# Install dependencies
npm install

# Build
npm run build

# Link for local development
npm link

# In your Homebridge directory
npm link homebridge-prom-sensors
```

## License

MIT
