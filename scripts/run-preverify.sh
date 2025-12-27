#!/bin/bash
# Run pre-verification for trending headlines using 3-step pipeline
# Each step stays under Vercel's 10s timeout limit
#
# Step 1: Fetch headlines from Google News → store in Redis
# Step 2: Fetch article content (one at a time) → store in Redis
# Step 3: Run verification (one at a time) → store in Redis

API_BASE="${API_URL:-https://verity-alpha.vercel.app}"

echo "=== Verity Pre-verification Pipeline ==="
echo "API: $API_BASE"
echo ""

# ==============================
# STEP 1: Fetch Headlines
# ==============================
echo "📰 Step 1: Fetching headlines..."
STEP1_RESPONSE=$(curl -s "$API_BASE/api/cron/preverify-step1?clear=${CLEAR:-false}")

STEP1_SUCCESS=$(echo "$STEP1_RESPONSE" | jq -r '.success')
if [ "$STEP1_SUCCESS" != "true" ]; then
  echo "❌ Step 1 failed: $(echo "$STEP1_RESPONSE" | jq -r '.error')"
  exit 1
fi

HEADLINE_COUNT=$(echo "$STEP1_RESPONSE" | jq -r '.count')
STEP1_DURATION=$(echo "$STEP1_RESPONSE" | jq -r '.durationMs')
echo "✓ Found $HEADLINE_COUNT headlines (${STEP1_DURATION}ms)"

# Show headlines
echo ""
echo "Headlines to process:"
echo "$STEP1_RESPONSE" | jq -r '.headlines[] | "  - \(.title | .[0:60])... (\(.source))"'
echo ""

# ==============================
# STEP 2: Fetch Article Content
# ==============================
echo "📄 Step 2: Fetching article content..."

i=1
while true; do
  STEP2_RESPONSE=$(curl -s "$API_BASE/api/cron/preverify-step2" --max-time 120)

  STEP2_SUCCESS=$(echo "$STEP2_RESPONSE" | jq -r '.success')
  STEP2_STATUS=$(echo "$STEP2_RESPONSE" | jq -r '.status // empty')

  if [ "$STEP2_SUCCESS" != "true" ]; then
    echo "❌ Step 2 failed: $(echo "$STEP2_RESPONSE" | jq -r '.error')"
    break
  fi

  if [ "$STEP2_STATUS" = "complete" ]; then
    echo "✓ All articles fetched"
    break
  fi

  HEADLINE=$(echo "$STEP2_RESPONSE" | jq -r '.headline | .[0:50]')
  HAS_ARTICLE=$(echo "$STEP2_RESPONSE" | jq -r '.hasArticle')
  ARTICLE_LEN=$(echo "$STEP2_RESPONSE" | jq -r '.articleLength')
  REMAINING=$(echo "$STEP2_RESPONSE" | jq -r '.remaining')
  DURATION=$(echo "$STEP2_RESPONSE" | jq -r '.durationMs')

  if [ "$HAS_ARTICLE" = "true" ]; then
    echo "  [$i] $HEADLINE... (${ARTICLE_LEN} chars, ${DURATION}ms)"
  else
    echo "  [$i] $HEADLINE... (no article, ${DURATION}ms)"
  fi

  i=$((i + 1))

  if [ "$REMAINING" = "0" ]; then
    echo "✓ All articles fetched"
    break
  fi
done
echo ""

# ==============================
# STEP 3: Verify Headlines
# ==============================
echo "🔍 Step 3: Verifying headlines..."

i=1
while true; do
  STEP3_RESPONSE=$(curl -s "$API_BASE/api/cron/preverify-step3" --max-time 300)

  STEP3_SUCCESS=$(echo "$STEP3_RESPONSE" | jq -r '.success')
  STEP3_STATUS=$(echo "$STEP3_RESPONSE" | jq -r '.status // empty')

  if [ "$STEP3_SUCCESS" != "true" ]; then
    ERROR=$(echo "$STEP3_RESPONSE" | jq -r '.error // "unknown"')
    DURATION=$(echo "$STEP3_RESPONSE" | jq -r '.durationMs // "?"')
    echo "❌ Step 3 failed after ${DURATION}ms: $ERROR"
    # Show raw response if it's not JSON (e.g., timeout message)
    if [ "$ERROR" = "unknown" ] || [ "$ERROR" = "null" ]; then
      echo "Raw response: $STEP3_RESPONSE"
    fi
    break
  fi

  if [ "$STEP3_STATUS" = "complete" ]; then
    VERIFIED_COUNT=$(echo "$STEP3_RESPONSE" | jq -r '.verified')
    echo "✓ All $VERIFIED_COUNT headlines verified"
    break
  fi

  if [ "$STEP3_STATUS" = "waiting" ]; then
    echo "⏳ $(echo "$STEP3_RESPONSE" | jq -r '.message')"
    break
  fi

  HEADLINE=$(echo "$STEP3_RESPONSE" | jq -r '.headline | .[0:50]')
  CATEGORY=$(echo "$STEP3_RESPONSE" | jq -r '.category')
  HAS_ARTICLE=$(echo "$STEP3_RESPONSE" | jq -r '.hasArticle')
  REMAINING=$(echo "$STEP3_RESPONSE" | jq -r '.remaining')
  DURATION=$(echo "$STEP3_RESPONSE" | jq -r '.durationMs')

  echo "  [$i] $HEADLINE... → $CATEGORY (article: $HAS_ARTICLE, ${DURATION}ms)"

  i=$((i + 1))

  if [ "$REMAINING" = "0" ]; then
    echo "✓ All headlines verified"
    break
  fi
done
echo ""

echo "=== Pipeline Complete ==="
