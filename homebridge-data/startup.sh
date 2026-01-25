#!/bin/bash

#
# Docker Homebridge Custom Startup Script - homebridge/homebridge
#
# This script installs the homebridge-prom-sensors plugin from the
# mounted source directory on each container start.
#

echo "Installing homebridge-prom-sensors plugin..."

cd /plugin

# Install dependencies and build
npm install
npm run build

# Create a tarball
npm pack

# Install to Homebridge's plugin directory
cd /var/lib/homebridge
npm install /plugin/homebridge-prom-sensors-*.tgz

echo "Plugin installation complete."
