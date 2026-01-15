#!/bin/bash
# Verify Rate Limiting (Circuit Breaker / Hardening)

URL="http://localhost:3000/"

echo "--- Starting Traffic Spike Test ---"
echo "Target: $URL"
echo "Policy: 2 req/s, 5 burst"

# Send 15 requests rapidly
for i in {1..15}
do
   curl -s -o /dev/null -w "%{http_code}\n" $URL &
done

wait
echo "--- Test Complete ---"
echo "You should see a mix of 200 (Success) and 429 (Too Many Requests)."
