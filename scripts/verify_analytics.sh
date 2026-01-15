#!/bin/bash
set -e

# 1. Generate IDs
SITE_ID=$(uuidgen)
ASSET_ID=$(uuidgen)
INCIDENT_ID=$(uuidgen)

echo "--- Test Data ---"
echo "Site: $SITE_ID"
echo "Asset: $ASSET_ID"
echo "Incident: $INCIDENT_ID"

# 2. Create Hierarchy: Site CONTAINS Asset
echo "Linking Site -> Asset..."
curl -s -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "'"$SITE_ID"'", "source_module": "sites",
    "target_id": "'"$ASSET_ID"'", "target_module": "assets",
    "relation": "CONTAINS"
  }' | jq .

# 3. Create Incident Link: Incident INVOLVES Asset
echo "Linking Incident -> Asset..."
curl -s -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "'"$INCIDENT_ID"'", "source_module": "incidents",
    "target_id": "'"$ASSET_ID"'", "target_module": "assets",
    "relation": "INVOLVES"
  }' | jq .

# 4. Verify Rollup
echo "Fetching Rollup for Site..."
sleep 1
RESPONSE=$(curl -s http://localhost:3000/api/analytics/rollup/$SITE_ID)
echo $RESPONSE | jq .

# Check if incident_count is 1
COUNT=$(echo $RESPONSE | jq '.incident_count')
if [ "$COUNT" -eq 1 ]; then
  echo "✅ Logic Verified: Found 1 incident in hierarchy."
else
  echo "❌ Logic Failed: Expected 1 incident, got $COUNT"
  exit 1
fi
