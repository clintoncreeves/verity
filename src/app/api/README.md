# Verity API Documentation

## Overview

The Verity API provides endpoints for verifying claims, analyzing images, searching fact-checks, and evaluating source reliability. All endpoints include rate limiting and comprehensive error handling.

## Base URL

Development: `http://localhost:3000/api`
Production: `https://your-domain.com/api`

## Authentication

Currently, the API does not require authentication. Rate limiting is applied per IP address.

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/verify` | 10 requests | 1 minute |
| `/api/verify/image` | 5 requests | 1 minute |
| `/api/factchecks` | No limit | - |
| `/api/sources/evaluate` | No limit | - |

Rate limit information is included in response headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: ISO timestamp when the limit resets

## Endpoints

### 1. Main Verification

Verify text claims, URLs, or image URLs.

**Endpoint:** `POST /api/verify`

**Request Body:**
```json
{
  "type": "text" | "image" | "url",
  "content": "string (max 10000 characters)"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "text",
    "content": "The claim content",
    "verifiedAt": "2024-01-15T10:30:00Z",
    "overallScore": 0.75,
    "verdict": "PARTIALLY_TRUE",
    "confidence": 0.8,
    "summary": "Brief explanation of the verdict",
    "factors": [
      {
        "name": "Source Credibility",
        "score": 0.7,
        "weight": 0.3,
        "description": "Analysis of source reliability"
      }
    ],
    "sources": [],
    "relatedFactChecks": []
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "content": "The Earth is flat"
  }'
```

### 2. Image Verification

Analyze images for manipulation and metadata.

**Endpoint:** `POST /api/verify/image`

**Request:** `multipart/form-data`
- `file`: Image file (PNG, JPG, WebP, or GIF, max 10MB)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "image.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "analyzedAt": "2024-01-15T10:30:00Z",
    "manipulationScore": 0.15,
    "isLikelyManipulated": false,
    "confidence": 0.85,
    "findings": [
      {
        "type": "metadata",
        "severity": "info",
        "description": "Original metadata extracted successfully",
        "details": {
          "software": "Unknown",
          "created": null,
          "gpsLocation": null
        }
      }
    ],
    "reverseImageSearch": {
      "performed": false,
      "results": [],
      "message": "Reverse image search not yet implemented"
    }
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/verify/image \
  -F "file=@/path/to/image.jpg"
```

### 3. Fact-Check Search

Search for existing fact-checks using Google Fact Check API.

**Endpoint:** `GET /api/factchecks`

**Query Parameters:**
- `claim` (required): The claim to search for (3-500 characters)
- `languageCode` (optional): ISO language code (default: "en")
- `pageSize` (optional): Results per page (1-50, default: 10)
- `pageToken` (optional): Token for pagination

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "factChecks": [
      {
        "id": "fact-check-id",
        "claim": "The claim text",
        "claimant": "Person who made the claim",
        "claimDate": "2024-01-15",
        "reviews": [
          {
            "publisher": {
              "name": "Fact Checker Name",
              "site": "factchecker.com"
            },
            "url": "https://factchecker.com/article",
            "title": "Review Title",
            "reviewDate": "2024-01-16",
            "textualRating": "False",
            "languageCode": "en"
          }
        ]
      }
    ],
    "nextPageToken": "token-for-next-page",
    "totalResults": 10
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/factchecks?claim=vaccines%20cause%20autism&pageSize=5"
```

### 4. Source Evaluation

Evaluate the reliability of a news source.

**Endpoint:** `GET /api/sources/evaluate`

**Query Parameters:**
- `url` (required): The URL to evaluate (must be valid HTTP/HTTPS URL)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com/article",
    "domain": "example.com",
    "evaluatedAt": "2024-01-15T10:30:00Z",
    "reliabilityScore": 0.85,
    "confidence": 0.8,
    "factors": [
      {
        "name": "Domain Reputation",
        "score": 0.9,
        "weight": 0.3,
        "description": "Analysis of domain authority and historical reliability",
        "details": {
          "domainAge": "10+ years",
          "sslCertificate": true
        }
      }
    ],
    "metadata": {
      "category": "News Agency",
      "biasRating": "Least Biased",
      "factualRating": "Very High",
      "country": "USA"
    },
    "warnings": [],
    "recommendations": ["Highly reliable source for factual news reporting"]
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/sources/evaluate?url=https://reuters.com"
```

## Error Responses

All errors follow a consistent format:

**Validation Error (400):**
```json
{
  "error": "Invalid request data",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "path": ["content"],
      "message": "Content is required"
    }
  ]
}
```

**Rate Limit Exceeded (429):**
```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMITED"
}
```

**Internal Server Error (500):**
```json
{
  "error": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

### Error Codes

- `VALIDATION_ERROR`: Request data failed validation
- `RATE_LIMITED`: Too many requests from this IP
- `MISSING_FILE`: No file provided in upload
- `INVALID_FILE_TYPE`: Unsupported file type
- `FILE_TOO_LARGE`: File exceeds size limit
- `INVALID_JSON`: Malformed JSON in request body
- `SERVICE_UNAVAILABLE`: External service not configured
- `INTERNAL_ERROR`: Unexpected server error

## CORS

All endpoints support CORS for web applications. Preflight OPTIONS requests are handled automatically.

## Environment Variables

Required environment variables:

```env
# Google Fact Check API (optional, for /api/factchecks)
GOOGLE_FACT_CHECK_API_KEY=your_api_key_here
```

## Implementation Status

### Implemented
- Request validation with Zod
- Rate limiting (in-memory)
- Error handling
- CORS support
- Mock responses for all endpoints

### TODO
- Integrate verification orchestrator in `/api/verify`
- Implement image analysis in `/api/verify/image`
- Add reverse image search
- Enhance source evaluation with real databases
- Add caching layer
- Implement webhook notifications
- Add API key authentication (optional)

## Testing

Example test using curl:

```bash
# Test main verification
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"type": "text", "content": "Test claim"}'

# Test image verification
curl -X POST http://localhost:3000/api/verify/image \
  -F "file=@test.jpg"

# Test fact-check search
curl "http://localhost:3000/api/factchecks?claim=test"

# Test source evaluation
curl "http://localhost:3000/api/sources/evaluate?url=https://reuters.com"

# Test rate limiting (run multiple times)
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/verify \
    -H "Content-Type: application/json" \
    -d '{"type": "text", "content": "Test"}' \
    -w "\nStatus: %{http_code}\n"
done
```

## Next Steps

1. Set up Google Fact Check API key in `.env.local`
2. Implement verification orchestrator
3. Add image analysis capabilities
4. Integrate with source reliability databases
5. Add comprehensive test suite
6. Set up monitoring and logging
