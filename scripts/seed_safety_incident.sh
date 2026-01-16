#!/bin/bash

# Payload for Safety Incident Tracker
PAYLOAD='{
  "name": "safety_incident_tracker",
  "fields": [
    { "name": "incident_description", "label": "Incident Description", "field_type": "text", "required": true, "stage_id": "reporting" },
    { "name": "root_cause", "label": "Root Cause", "field_type": "text", "required": true, "stage_id": "investigation" },
    { "name": "action_taken", "label": "Action Taken", "field_type": "text", "required": true, "stage_id": "resolution" }
  ],
  "enabled_features": ["workflow_stages"],
  "workflow": {
    "stages": [
      { "id": "reporting", "name": "Reporting", "order": 1 },
      { "id": "investigation", "name": "Investigation", "order": 2 },
      { "id": "resolution", "name": "Resolution", "order": 3 }
    ]
  }
}'

# Note: removed "required_fields" from stages in payload if it's derived, 
# but checking previous file, it had them. I'll stick to the previous pattern if needed.
# Let's check if the backend requires them in the stage definition or if it infers them from fields.
# The previous script had them. I'll include them to be safe.

PAYLOAD='{
  "name": "safety_incident_tracker",
  "fields": [
    { "name": "incident_description", "label": "Incident Description", "field_type": "text", "required": true, "stage_id": "reporting" },
    { "name": "root_cause", "label": "Root Cause", "field_type": "text", "required": true, "stage_id": "investigation" },
    { "name": "action_taken", "label": "Action Taken", "field_type": "text", "required": true, "stage_id": "resolution" }
  ],
  "enabled_features": ["workflow_stages"],
  "workflow": {
    "stages": [
      { "id": "reporting", "name": "Reporting", "order": 1, "required_fields": ["incident_description"] },
      { "id": "investigation", "name": "Investigation", "order": 2, "required_fields": ["root_cause"] },
      { "id": "resolution", "name": "Resolution", "order": 3, "required_fields": ["action_taken"] }
    ]
  }
}'

echo "Creating Safety Incident Tracker Module..."
curl -v -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo -e "\nDone."
