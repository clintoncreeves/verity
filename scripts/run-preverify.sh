#!/bin/bash
# Run pre-verification for trending headlines
# This script calls the API endpoints sequentially to work around Vercel's 10s timeout

API_BASE="${API_URL:-https://verity-alpha.vercel.app}"

echo "=== Verity Pre-verification Runner ==="
echo "API: $API_BASE"
echo ""

# Step 1: Get pending headlines
echo "Fetching headlines..."
RESPONSE=$(curl -s "$API_BASE/api/cron/preverify?clear=${CLEAR:-false}")

PENDING=$(echo "$RESPONSE" | jq -r '.summary.pending')
CACHED=$(echo "$RESPONSE" | jq -r '.summary.cached')

echo "Found: $PENDING pending, $CACHED cached"
echo ""

if [ "$PENDING" = "0" ]; then
  echo "No pending headlines to process."
  exit 0
fi

# Step 2: Process each pending headline
HEADLINES=$(echo "$RESPONSE" | jq -c '.pendingHeadlines[]')

i=1
echo "$HEADLINES" | while read -r headline; do
  TITLE=$(echo "$headline" | jq -r '.title' | cut -c1-60)
  echo "[$i/$PENDING] Processing: $TITLE..."

  RESULT=$(curl -s -X POST "$API_BASE/api/cron/preverify-one" \
    -H "Content-Type: application/json" \
    -d "{\"headline\": $headline}" \
    --max-time 120)

  SUCCESS=$(echo "$RESULT" | jq -r '.success')
  CATEGORY=$(echo "$RESULT" | jq -r '.category')
  HAS_ARTICLE=$(echo "$RESULT" | jq -r '.hasArticleContent')
  DURATION=$(echo "$RESULT" | jq -r '.durationMs')

  if [ "$SUCCESS" = "true" ]; then
    echo "    -> $CATEGORY (article: $HAS_ARTICLE) in ${DURATION}ms"
  else
    ERROR=$(echo "$RESULT" | jq -r '.error')
    echo "    -> FAILED: $ERROR"
  fi

  i=$((i + 1))
done

echo ""
echo "=== Complete ==="
