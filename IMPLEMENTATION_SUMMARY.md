# Dynamic Data Integration - Implementation Summary

## ✅ What Has Been Done

### 1. API Service Layer Created
- **File**: `src/services/api.ts`
- Comprehensive API service with functions for all data operations
- Includes file uploads, emission data, analytics, recommendations, etc.
- Uses environment variables for API base URL configuration

### 2. Environment Configuration
- **File**: `.env.example` 
- Template for API configuration
- **Action Required**: Create `.env` file with your actual API URL

### 3. All Pages Updated to Use Dynamic Data

#### Dashboard (`src/pages/Dashboard.tsx`)
- ✅ Fetches summary metrics from API
- ✅ Loads recommendations dynamically
- ✅ Calculates what-if scenarios from real data
- ✅ Shows loading states and error handling

#### Data Ingestion (`src/pages/DataIngestion.tsx`)
- ✅ Uploads files to backend API
- ✅ Displays uploaded files list from database
- ✅ Real-time status updates
- ✅ Toast notifications for upload success/failure

#### Carbon Calculation (`src/pages/CarbonCalculation.tsx`)
- ✅ Fetches emission factors from API
- ✅ Loads category breakdown dynamically
- ✅ Filters by material type and category

#### Hotspot Analysis (`src/pages/HotspotAnalysis.tsx`)
- ✅ Supplier analysis from API
- ✅ Transport mode emissions from API
- ✅ Material hotspots from API
- ✅ All charts and graphs use live data

#### Audit & Trust (`src/pages/AuditTrust.tsx`)
- ✅ Data lineage from API
- ✅ Emission factors from API
- ✅ Traceability information

### 4. Documentation Created
- **File**: `API_INTEGRATION_GUIDE.md`
- Complete API endpoint specifications
- Request/response examples
- Database schema recommendations
- CSV/Excel column requirements
- Technology stack suggestions
- Testing instructions

## 🎯 How to Integrate Your API

### Step 1: Set Up Environment
```bash
# Create .env file in project root
echo "VITE_API_BASE_URL=http://your-api-url/api" > .env
```

### Step 2: Implement Backend Endpoints
Your backend needs to implement these endpoints (see API_INTEGRATION_GUIDE.md for details):

**File Management:**
- `POST /api/files/upload` - Upload files
- `GET /api/files` - List uploaded files
- `DELETE /api/files/:id` - Delete files

**Emission Data:**
- `GET /api/emissions` - Get emission data (with filters)
- `POST /api/emissions` - Create emission entry
- `PUT /api/emissions/:id` - Update emission entry
- `DELETE /api/emissions/:id` - Delete emission entry

**Emission Factors:**
- `GET /api/emission-factors` - Get all factors
- `POST /api/emission-factors` - Create new factor

**Analytics:**
- `GET /api/analytics/summary` - Dashboard metrics
- `GET /api/analytics/category-breakdown` - Category pie chart data
- `GET /api/analytics/suppliers` - Supplier analysis
- `GET /api/analytics/transport-modes` - Transport analysis
- `GET /api/analytics/material-hotspots` - Material hotspots

**Recommendations:**
- `GET /api/recommendations` - Get recommendations
- `POST /api/recommendations/generate` - Generate new recommendations

**Data Lineage:**
- `GET /api/data-lineage` - Get data traceability

**What-If Scenarios:**
- `POST /api/what-if/calculate` - Calculate scenario impacts

### Step 3: Data Processing Pipeline
When a file is uploaded:
1. Parse file (PDF OCR, CSV/Excel parsing)
2. Extract: materials, quantities, suppliers, transport data, etc.
3. Match with emission factors from your database
4. Calculate CO₂e = activityData × emissionFactor
5. Store in emissions table
6. Update file status to "Processed"

### Step 4: Required CSV/Excel Columns

**Materials Data:**
```csv
material_type,quantity,unit,supplier,region,date
Steel,200000,kg,Supplier A,EU,2024-01-15
```

**Transport Data:**
```csv
mode,distance,unit,weight,origin,destination,date
Truck,500,km,10000,Berlin,Paris,2024-01-10
```

**Energy Data:**
```csv
energy_type,consumption,unit,region,date
Grid Electricity,338000,kWh,EU,2024-03-15
```

## 🔧 Testing the Integration

### 1. Start Your Backend
```bash
# Your backend should be running on the URL specified in .env
# Example: http://localhost:3000
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Each Feature
- **Dashboard**: Should load metrics and recommendations
- **Data Ingestion**: Try uploading a CSV file
- **Carbon Calculation**: View emission factors
- **Hotspot Analysis**: See supplier and material analytics
- **Audit & Trust**: View data lineage

## 📊 Database Schema

### Required Tables

**1. uploaded_files**
```sql
CREATE TABLE uploaded_files (
  id VARCHAR PRIMARY KEY,
  file_name VARCHAR NOT NULL,
  source_type VARCHAR NOT NULL,
  status VARCHAR CHECK (status IN ('Pending', 'Processing', 'Processed', 'Error')),
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  error_message TEXT
);
```

**2. emission_data**
```sql
CREATE TABLE emission_data (
  id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  sub_category VARCHAR NOT NULL,
  activity_data DECIMAL NOT NULL,
  unit VARCHAR NOT NULL,
  emission_factor DECIMAL NOT NULL,
  emission_factor_unit VARCHAR NOT NULL,
  emission_factor_source VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  co2e DECIMAL NOT NULL,
  confidence_rating VARCHAR CHECK (confidence_rating IN ('High', 'Medium', 'Low')),
  source_document_id VARCHAR REFERENCES uploaded_files(id),
  supplier VARCHAR,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**3. emission_factors** (reference data)
```sql
CREATE TABLE emission_factors (
  id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  material_or_mode VARCHAR NOT NULL,
  region VARCHAR NOT NULL,
  factor DECIMAL NOT NULL,
  unit VARCHAR NOT NULL,
  source VARCHAR NOT NULL,
  confidence_rating VARCHAR CHECK (confidence_rating IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4. recommendations**
```sql
CREATE TABLE recommendations (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR CHECK (type IN ('supplier', 'transport', 'material', 'energy', 'consolidation')),
  current_emissions DECIMAL NOT NULL,
  potential_reduction DECIMAL NOT NULL,
  percentage_savings DECIMAL NOT NULL,
  cost_impact DECIMAL NOT NULL,
  implementation_difficulty VARCHAR CHECK (implementation_difficulty IN ('Low', 'Medium', 'High')),
  priority INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);
```

## 🤖 Recommendation Generation Algorithm

The system should automatically generate recommendations based on emission data:

### 1. Supplier Optimization
- Compare suppliers providing same materials in same region
- If Supplier A has emissions > Supplier B for same material
- Generate recommendation to switch suppliers
- Calculate potential reduction

### 2. Transport Mode Shift
- Identify air freight or truck transport
- Check if ship or rail is viable (based on routes)
- Calculate emissions savings from mode shift

### 3. Material Substitution
- For high-emission materials (e.g., virgin aluminum)
- Suggest recycled or lower-carbon alternatives
- Calculate 80% reduction for recycled aluminum

### 4. Energy Transition
- If using grid electricity with high carbon intensity
- Recommend renewable energy sources
- Calculate ~90% reduction potential

### 5. Consolidation Opportunities
- Analyze transport frequency and volumes
- Suggest consolidating shipments
- Calculate 25% reduction from efficiency gains

## 🚀 Next Steps

1. ✅ Frontend is ready and updated
2. ⏳ Set up backend API with endpoints listed above
3. ⏳ Implement database schema
4. ⏳ Create file processing pipeline
5. ⏳ Add recommendation generation logic
6. ⏳ Test with sample data
7. ⏳ Deploy backend and frontend

## 📝 Key Files Modified

- `src/services/api.ts` - New API service layer
- `src/pages/Dashboard.tsx` - Updated to use API
- `src/pages/DataIngestion.tsx` - Updated with file upload
- `src/pages/CarbonCalculation.tsx` - Updated to fetch factors
- `src/pages/HotspotAnalysis.tsx` - Updated all analytics
- `src/pages/AuditTrust.tsx` - Updated data lineage
- `.env.example` - Environment template
- `API_INTEGRATION_GUIDE.md` - Complete API documentation

## 🔍 Features Implemented

✅ Loading states for all data fetching  
✅ Error handling with user-friendly messages  
✅ Real-time file upload with progress  
✅ Toast notifications for user feedback  
✅ Automatic data refresh after uploads  
✅ React Query for efficient data caching  
✅ TypeScript types for API responses  
✅ Environment-based API configuration  

## 💡 Important Notes

1. **CORS**: Make sure your backend API has CORS enabled for the frontend URL
2. **File Size**: Configure appropriate file size limits on backend
3. **Authentication**: Consider adding JWT or session-based auth
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **Data Validation**: Validate all inputs on backend
6. **Error Logging**: Set up proper error logging and monitoring

## 📧 Questions or Issues?

Refer to:
- `API_INTEGRATION_GUIDE.md` - Complete API specifications
- `src/types/carbon.ts` - TypeScript type definitions
- `src/services/api.ts` - API function implementations

The frontend is now completely dynamic and ready to connect to your backend!
