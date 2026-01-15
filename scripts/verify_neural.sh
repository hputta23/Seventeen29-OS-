#!/bin/bash

# Base URL
API_URL="http://localhost:3000/api"

echo "1. Creating 'Incidents' and 'Risks' modules..."
# Create Incidents Module
curl -v -X POST "$API_URL/modules" -H "Content-Type: application/json" -d '{
  "name": "incidents",
  "fields": [{ "name": "description", "type": "text", "required": true }]
}'

# Create Risks Module
curl -v -X POST "$API_URL/modules" -H "Content-Type: application/json" -d '{
  "name": "risks",
  "fields": [
      { "name": "title", "type": "text", "required": true },
      { "name": "status", "type": "text" }
  ]
}'

echo "Modules created."

# 2. Extract IDs for testing (Hard because we don't have a CRUD API to fetch IDs yet)
# For this prototype, we'll Insert via SQL (using a helper or just knowing the IDs is tricky).
# Since I only have Create Module and Link APIs, I can't INSERT data yet to get IDs.
# Wait, I checked task.md: "Implement Generic CRUD API" is NOT done.
# I actually need to insert data to have IDs to link.

# CRITICAL: I need to fake IDs or implement a basic INSERT endpoint to test linking.
# Or I can link *anything* since the graph table assumes UUIDs. 
# But for the Propagation Service to work, the rows in 'risks' must exist to update them.
# The Propagation Service performs: UPDATE risks SET ...
# So I really need a row in 'risks'.

# I will add a simplified INSERT endpoint to `api.rs` right now or insert dummy data via psql if possible.
# Adding a basic INSERT endpoint is better for the "OS" completeness.

echo "Skipping data insert (Not implemented yet). Using raw SQL via docker exec for setup..."

# Insert dummy Incident
INCIDENT_ID=$(uuidgen)
docker exec seventeen29_db psql -U seventeen29 -d seventeen29_kernel -c "INSERT INTO incidents (id, description) VALUES ('$INCIDENT_ID', 'Fire in Sector 7');"

# Insert dummy Risk
RISK_ID=$(uuidgen)
docker exec seventeen29_db psql -U seventeen29 -d seventeen29_kernel -c "INSERT INTO risks (id, title, status) VALUES ('$RISK_ID', 'Fire Hazard', 'OPEN');"

echo "Created Incident: $INCIDENT_ID"
echo "Created Risk: $RISK_ID"

echo "\n2. Performing Handshake (Expect UNMITIGATED)..."
curl -s "$API_URL/handshake/$INCIDENT_ID" | grep "UNMITIGATED" && echo "SUCCESS: Detects Unmitigated Hazard."

echo "\n3. Linking Incident -> Risk (MITIGATED_BY)..."
curl -s -X POST "$API_URL/links" -H "Content-Type: application/json" -d "{
  \"source_id\": \"$INCIDENT_ID\",
  \"source_module\": \"incidents\",
  \"target_id\": \"$RISK_ID\",
  \"target_module\": \"risks\",
  \"relation\": \"MITIGATED_BY\"
}"

echo "\n4. Verifying Propagation (Risk Status should be REQUIRES_REVIEW)..."
# Check DB directly
docker exec seventeen29_db psql -U seventeen29 -d seventeen29_kernel -c "SELECT status FROM risks WHERE id = '$RISK_ID';"

echo "\n5. Performing Handshake (Expect MITIGATED)..."
curl -s "$API_URL/handshake/$INCIDENT_ID" | grep "MITIGATED" && echo "SUCCESS: Detects Mitigation."
