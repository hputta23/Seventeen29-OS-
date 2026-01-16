#!/bin/bash

# Define the payload with workflow configuration
PAYLOAD='{
  "name": "workflow_test_module",
  "fields": [
    { "name": "applicant_name", "label": "Applicant Name", "field_type": "text", "required": true, "stage_id": "initiation" },
    { "name": "project_description", "label": "Description", "field_type": "text", "required": true, "stage_id": "initiation" },
    { "name": "risk_level", "label": "Risk Level", "field_type": "enum", "options": ["Low", "High"], "required": true, "stage_id": "assessment" },
    { "name": "approval_status", "label": "Approval", "field_type": "boolean", "required": true, "stage_id": "approval" }
  ],
  "enabled_features": ["workflow_stages"],
  "workflow": {
    "stages": [
      { "id": "initiation", "name": "Initiation", "order": 1, "required_fields": ["applicant_name", "project_description"] },
      { "id": "assessment", "name": "Risk Assessment", "order": 2, "required_fields": ["risk_level"] },
      { "id": "approval", "name": "Final Approval", "order": 3, "required_fields": ["approval_status"] }
    ]
  }
}'

# Send the request to create the module
echo "Creating Module with Workflow..."
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

echo -e "\nModule created."
