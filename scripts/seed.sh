#!/bin/bash

API_URL="http://localhost:3000/api/modules"

# 1. Site
echo "Creating Site module..."
curl -v -X POST $API_URL -H "Content-Type: application/json" -d '{
  "name": "sites",
  "fields": [
    { "name": "name", "type": "text", "required": true },
    { "name": "location", "type": "text", "required": false },
    { "name": "code", "type": "text", "required": true }
  ]
}'

# 2. Department
echo "\nCreating Department module..."
curl -v -X POST $API_URL -H "Content-Type: application/json" -d '{
  "name": "departments",
  "fields": [
    { "name": "name", "type": "text", "required": true },
    { "name": "site_id", "type": "link", "target_blueprint": "sites", "required": true }
  ]
}'

# 3. Person
echo "\nCreating Person module..."
curl -v -X POST $API_URL -H "Content-Type: application/json" -d '{
  "name": "people",
  "fields": [
    { "name": "first_name", "type": "text", "required": true },
    { "name": "last_name", "type": "text", "required": true },
    { "name": "email", "type": "text", "required": true },
    { "name": "department_id", "type": "link", "target_blueprint": "departments" }
  ]
}'

echo "\nDone."
