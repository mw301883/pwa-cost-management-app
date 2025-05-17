#!/bin/bash

set -e

echo "Building and pushing frontend..."
docker build -t michaelwieczorek/pwa-cost-management-app:pwa-cost-management-app-frontend ./frontend
docker push michaelwieczorek/pwa-cost-management-app:pwa-cost-management-app-frontend

echo "Building and pushing backend..."
docker build -t michaelwieczorek/pwa-cost-management-app:pwa-cost-management-app-backend ./backend
docker push michaelwieczorek/pwa-cost-management-app:pwa-cost-management-app-backend

echo "All images built and pushed successfully!"
