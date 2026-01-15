#!/bin/bash
set -e

echo "--- Testing AI Agent ---"
DESCRIPTION="Forklift collided with racking in Zone C due to slippery floor from hydraulic leak."

echo "Sending Prompt: $DESCRIPTION"

RESPONSE=$(curl -s -X POST http://localhost:3000/api/ai/rca \
  -H "Content-Type: application/json" \
  -d '{
    "description": "'"$DESCRIPTION"'"
  }')

echo "AI Response:"
echo $RESPONSE | jq .
