# API Integration Guide for Carbon Accounting Platform

## Overview
This guide explains how to integrate your backend API with the Carbon Accounting Platform frontend. The application has been updated to use dynamic data instead of mock data.

## Environment Setup

1. Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

2. Replace `http://localhost:3000/api` with your actual API base URL.

## Required API Endpoints

### 1. File Upload & Management

#### POST `/api/files/upload`
Upload a file for processing (PDF, CSV, Excel, etc.)

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file`: File binary
  - `sourceType`: string (e.g., "Invoice", "Transport", "Supplier", "Electricity - EU")

**Response:**
```json
{
  "id": "string",
  "fileName": "string",
  "sourceType": "string",
  "status": "Pending" | "Processing" | "Processed" | "Error",
  "uploadDate": "string (ISO date)",
  "errorMessage": "string (optional)"
}
```

#### GET `/api/files`
Retrieve all uploaded files

**Response:**
```json
[
  {
    "id": "string",
    "fileName": "string",
    "sourceType": "string",
    "status": "Pending" | "Processing" | "Processed" | "Error",
    "uploadDate": "string (ISO date)",
    "errorMessage": "string (optional)"
  }
]
```

#### DELETE `/api/files/:id`
Delete an uploaded file

**Response:** `204 No Content`

---

### 2. Emission Data Management

#### GET `/api/emissions`
Retrieve emission data with optional filters

**Query Parameters:**
- `category`: string (optional) - Filter by category (Materials, Transport, Packaging, Energy, Waste, Services)
- `startDate`: string (optional) - ISO date
- `endDate`: string (optional) - ISO date
- `supplier`: string (optional) - Filter by supplier name

**Response:**
```json
[
  {
    "id": "string",
    "category": "Materials" | "Transport" | "Packaging" | "Energy" | "Waste" | "Services",
    "subCategory": "string",
    "activityData": number,
    "unit": "string (e.g., kg, kWh, km)",
    "emissionFactor": number,
    "emissionFactorUnit": "string",
    "emissionFactorSource": "string",
    "region": "string",
    "co2e": number,
    "confidenceRating": "High" | "Medium" | "Low",
    "sourceDocument": "string (optional)",
    "supplier": "string (optional)",
    "date": "string (ISO date)"
  }
]
```

#### POST `/api/emissions`
Create new emission data entry

**Request Body:** Same as response above (without `id`)

**Response:** Created emission data object

#### PUT `/api/emissions/:id`
Update existing emission data

**Request Body:** Partial emission data object

**Response:** Updated emission data object

#### DELETE `/api/emissions/:id`
Delete emission data entry

**Response:** `204 No Content`

---

### 3. Emission Factors

#### GET `/api/emission-factors`
Retrieve all emission factors

**Response:**
```json
[
  {
    "id": "string",
    "category": "Materials" | "Transport" | "Packaging" | "Energy" | "Waste" | "Services",
    "materialOrMode": "string (e.g., Steel, Full Truck, Grid Electricity)",
    "region": "string (e.g., EU, Global, Asia)",
    "factor": number,
    "unit": "string (e.g., kg CO₂e/kg, kg CO₂e/ton-km)",
    "source": "string (e.g., Ecoinvent Database, IPCC 2021)",
    "confidenceRating": "High" | "Medium" | "Low"
  }
]
```

#### POST `/api/emission-factors`
Create new emission factor

**Request Body:** Same as response above (without `id`)

**Response:** Created emission factor object

---

### 4. Analytics Endpoints

#### GET `/api/analytics/summary`
Get dashboard summary metrics

**Response:**
```json
{
  "totalEmissions": number,
  "topHotspot": "string",
  "topHotspotEmissions": number,
  "potentialReduction": number,
  "improvementSuggestions": number
}
```

**Calculation Logic:**
- `totalEmissions`: Sum of all co2e values from emission data
- `topHotspot`: Category/supplier with highest emissions
- `topHotspotEmissions`: Emissions from top hotspot
- `potentialReduction`: Sum of potential reduction from all recommendations
- `improvementSuggestions`: Count of active recommendations

#### GET `/api/analytics/category-breakdown`
Get emissions breakdown by category

**Response:**
```json
[
  {
    "name": "string (category name)",
    "value": number (percentage),
    "emissions": number (tCO₂e),
    "color": "string (hsl color)"
  }
]
```

#### GET `/api/analytics/suppliers`
Get supplier-wise emission analysis

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "region": "string",
    "totalEmissions": number,
    "contribution": number (percentage),
    "materials": ["string"]
  }
]
```

#### GET `/api/analytics/transport-modes`
Get transport mode emission analysis

**Response:**
```json
[
  {
    "mode": "string (e.g., Air transport, Truck, Ship, Rail)",
    "emissions": number (tCO₂e)
  }
]
```

#### GET `/api/analytics/material-hotspots`
Get material-wise hotspot analysis

**Response:**
```json
[
  {
    "material": "string",
    "emissions": number (tCO₂e),
    "percentage": number
  }
]
```

---

### 5. Recommendations

#### GET `/api/recommendations`
Get all generated recommendations

**Response:**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "type": "supplier" | "transport" | "material" | "energy" | "consolidation",
    "currentEmissions": number,
    "potentialReduction": number,
    "percentageSavings": number,
    "costImpact": number,
    "implementationDifficulty": "Low" | "Medium" | "High",
    "priority": number
  }
]
```

#### POST `/api/recommendations/generate`
Generate new recommendations based on current emission data

**Response:** Array of recommendation objects (same as GET)

**Recommendation Generation Logic:**
1. **Supplier Optimization**: Compare suppliers in same region/material - suggest switching to lower-emission alternatives
2. **Transport Mode Shift**: Identify air/truck freight that could shift to ship/rail
3. **Material Substitution**: Suggest recycled or lower-carbon alternatives
4. **Energy Transition**: Recommend renewable energy if using grid electricity
5. **Consolidation**: Identify opportunities to combine shipments/orders

---

### 6. Data Lineage

#### GET `/api/data-lineage`
Get data lineage and traceability information

**Response:**
```json
[
  {
    "id": "string",
    "category": "Materials" | "Transport" | "Packaging" | "Energy" | "Waste" | "Services",
    "activityData": "string (formatted, e.g., '5,000 km')",
    "source": "string (e.g., 'Logistics API: DHL', 'Supplier A')",
    "details": "string",
    "emissionFactor": number,
    "emissionFactorSource": "string",
    "confidenceRating": "High" | "Medium" | "Low"
  }
]
```

---

### 7. What-If Scenarios

#### POST `/api/what-if/calculate`
Calculate emissions impact of implementing selected recommendations

**Request Body:**
```json
{
  "recommendationIds": ["string"]
}
```

**Response:**
```json
{
  "currentEmissions": number,
  "projectedEmissions": number,
  "totalSavings": number,
  "costImpact": number,
  "percentageReduction": number
}
```

**Calculation Logic:**
- `currentEmissions`: Current total emissions
- `projectedEmissions`: currentEmissions - sum of potentialReduction from selected recommendations
- `totalSavings`: Sum of potentialReduction from selected recommendations
- `costImpact`: Sum of costImpact from selected recommendations
- `percentageReduction`: (totalSavings / currentEmissions) * 100

---

## Data Processing Pipeline

### File Upload Flow

1. **Upload**: User uploads file via `/api/files/upload`
2. **Processing**: Backend processes file (OCR for PDFs, parse CSV/Excel)
3. **Extraction**: Extract relevant data:
   - Materials: quantity, type, supplier
   - Transport: distance, mode, weight
   - Energy: consumption, type
   - Dates, regions, source references
4. **Factor Matching**: Match extracted data with emission factors
5. **Calculation**: Calculate CO₂e = activityData × emissionFactor
6. **Storage**: Store in emissions database
7. **Status Update**: Update file status to "Processed"

### Required CSV/Excel Columns

#### Materials Data
- `material_type`: string (Steel, Aluminum, Plastic, etc.)
- `quantity`: number
- `unit`: string (kg, tons, etc.)
- `supplier`: string
- `region`: string
- `date`: ISO date string

#### Transport Data
- `mode`: string (Truck, Ship, Rail, Air)
- `distance`: number
- `unit`: string (km, miles)
- `weight`: number (optional)
- `origin`: string
- `destination`: string
- `date`: ISO date string

#### Energy Data
- `energy_type`: string (Grid Electricity, Natural Gas, etc.)
- `consumption`: number
- `unit`: string (kWh, m³, etc.)
- `region`: string
- `date`: ISO date string

#### Invoice/Receipt Data (PDF Processing)
Extract similar fields using OCR + NLP:
- Line items (material/service descriptions)
- Quantities and units
- Supplier information
- Dates

---

## Database Schema Recommendations

### Tables Required

1. **uploaded_files**
   - id, file_name, source_type, status, upload_date, error_message

2. **emission_data**
   - id, category, sub_category, activity_data, unit, emission_factor, emission_factor_unit, emission_factor_source, region, co2e, confidence_rating, source_document_id, supplier, date

3. **emission_factors** (reference data)
   - id, category, material_or_mode, region, factor, unit, source, confidence_rating

4. **recommendations** (generated)
   - id, title, description, type, current_emissions, potential_reduction, percentage_savings, cost_impact, implementation_difficulty, priority, created_at

5. **suppliers**
   - id, name, region, contact_info

---

## Technology Stack Suggestions

### Backend Framework Options
- **Node.js/Express** with TypeScript
- **Python/FastAPI** for ML-based recommendations
- **NestJS** for enterprise-grade structure

### Database Options
- **PostgreSQL** - Best for relational data, analytics queries
- **MongoDB** - If document-based approach preferred
- **SQLite** - For development/small deployments

### File Processing Libraries
- **PDF**: pdf-parse, pdf.js, Tesseract OCR
- **CSV/Excel**: papaparse, xlsx, csv-parser
- **NLP**: spaCy, NLTK (Python) for invoice parsing

### Deployment
- **Docker** containers for easy deployment
- **Cloud**: AWS, Azure, GCP (with S3/Blob storage for files)

---

## Testing the Integration

1. Start your backend API server
2. Update `.env` file with correct API URL
3. Run the frontend: `npm run dev`
4. Test each page:
   - **Dashboard**: Should load summary metrics
   - **Data Ingestion**: Upload a test file
   - **Carbon Calculation**: View emission data
   - **Hotspot Analysis**: View analytics
   - **Audit & Trust**: View data lineage

---

## Error Handling

The frontend includes error handling for:
- Network failures
- API errors (4xx, 5xx)
- Loading states
- Empty data states

Make sure your API returns proper HTTP status codes and error messages in this format:
```json
{
  "error": "string",
  "message": "string",
  "details": "string (optional)"
}
```

---

## CORS Configuration

If frontend and backend are on different domains/ports, configure CORS:

```javascript
// Express example
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

---

## Next Steps

1. Set up your backend API with the endpoints listed above
2. Implement the database schema
3. Create the file processing pipeline
4. Add the recommendation generation algorithm
5. Test with sample data
6. Deploy both frontend and backend

For questions or issues, refer to the TypeScript types in `src/types/carbon.ts` for exact data structures.
