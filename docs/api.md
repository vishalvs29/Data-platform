# API Reference

The DrMindit Data Platform provides a suite of RESTful endpoints for data ingestion and intelligent analytics serving.

## Authentication
All requests require a valid `x-api-key` header. Administrative endpoints additionally require an `x-user-id` header to verify the administrative role.

---

## 📥 Ingestion APIs

### `POST /api/mood`
Log a user's mood score and optional notes.
- **Body**: `{ "user_id": "uuid", "mood_score": 1-10, "notes": "optional text" }`

### `POST /api/session`
Track a completed wellness session (e.g., meditation, breathing).
- **Body**: `{ "user_id": "uuid", "type": "meditation", "duration_seconds": 600 }`

---

## 🚀 Serving APIs (Precomputed)

### `GET /api/trends`
Retrieve personalized mood and engagement trends.
- **Response**: Detailed daily/weekly metrics and trend indicators (`improving`, `stable`, `declining`).

### `GET /api/insights`
Fetch AI-generated behavioral insights for a specific user.
- **Includes**: Confidence scores, detailed reasons, and actionable recommendations.

### `GET /api/risk`
Get current wellness risk assessment.
- **Levels**: `Low`, `Medium`, `High` (Adaptive based on user baseline).

---

## 🛡 Administrative APIs

### `GET /api/admin/overview`
Get aggregated organization-wide statistics.
- **Response**: Total/Active users, average organizational mood, and high-risk count.

### `GET /api/admin/risk-distribution`
Statistical breakdown of risk levels across the organization.
- **Response**: Counts for Low/Medium/High risk categories.

### `GET /api/admin/high-risk-alerts`
Real-time feed of users requiring attention based on intelligence triggers.
