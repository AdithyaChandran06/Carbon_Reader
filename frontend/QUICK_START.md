# 🚀 Quick Start Guide - API Integration

## Prerequisites
- Node.js and npm installed
- Backend API server ready
- Database set up

## 1. Configure API URL (30 seconds)

Edit the `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Replace `http://localhost:3000/api` with your actual backend URL.

## 2. Install Dependencies (if not already done)

```bash
npm install
```

## 3. Start Development Server

```bash
npm run dev
```

The app will run at `http://localhost:5173`

## 4. Test the Integration

### Check Dashboard
- Navigate to Dashboard (/)
- Should load metrics from API
- If you see loading spinner forever → API not running
- If you see error message → Check API URL in .env

### Upload a Test File
1. Go to Data Ingestion page
2. Drag and drop a CSV file
3. Check if it uploads successfully
4. File should appear in the list below

### Expected CSV Format for Testing

**materials_test.csv**
```csv
material_type,quantity,unit,supplier,region,date
Steel,200000,kg,Supplier A,EU,2024-01-15
Aluminum,50000,kg,Supplier B,Asia,2024-01-20
```

**transport_test.csv**
```csv
mode,distance,unit,weight,origin,destination,date
Truck,500,km,10000,Berlin,Paris,2024-01-10
Ship,2000,km,50000,Shanghai,Hamburg,2024-01-15
```

## 5. Backend Checklist

Make sure your backend has:

- [ ] All API endpoints implemented (see API_INTEGRATION_GUIDE.md)
- [ ] CORS enabled for frontend URL
- [ ] Database tables created
- [ ] File upload handling (multipart/form-data)
- [ ] Emission factor reference data loaded
- [ ] Error responses in JSON format

## 6. Troubleshooting

### "Failed to load dashboard data"
- **Cause**: API not reachable
- **Fix**: 
  1. Check if backend is running
  2. Verify VITE_API_BASE_URL in .env
  3. Check CORS settings on backend
  4. Open browser DevTools → Network tab to see exact error

### File upload fails
- **Cause**: Upload endpoint not working
- **Fix**:
  1. Check POST /api/files/upload endpoint
  2. Verify multipart/form-data handling
  3. Check file size limits
  4. Review backend logs for errors

### Data not showing after upload
- **Cause**: Processing not complete or analytics not calculating
- **Fix**:
  1. Check file status in uploaded_files table
  2. Verify emission_data table has entries
  3. Check analytics endpoints return data
  4. Refresh the page

### Charts show no data
- **Cause**: Analytics endpoints returning empty arrays
- **Fix**:
  1. Verify emission data exists in database
  2. Check analytics calculation logic
  3. Test endpoints directly with Postman/curl

## 7. Testing API Endpoints Directly

Use curl or Postman to test:

```bash
# Test Summary Metrics
curl http://localhost:3000/api/analytics/summary

# Test Get Files
curl http://localhost:3000/api/files

# Test Upload File
curl -F "file=@test.csv" -F "sourceType=Materials" \
  http://localhost:3000/api/files/upload
```

Expected responses should match the schemas in API_INTEGRATION_GUIDE.md

## 8. Production Deployment

### Frontend
```bash
npm run build
```

Deploy the `dist` folder to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Your web server

Update .env for production:
```env
VITE_API_BASE_URL=https://api.yourcompany.com/api
```

### Backend
- Deploy to your preferred platform (AWS, Azure, GCP, Heroku, etc.)
- Set up production database
- Configure environment variables
- Enable HTTPS
- Set up monitoring and logging

## 9. Minimum Viable Backend

To get started quickly, implement these endpoints first:

1. **GET /api/analytics/summary** - Return hardcoded metrics initially
2. **GET /api/recommendations** - Return empty array or test data
3. **POST /api/files/upload** - Just save file and return success
4. **GET /api/files** - Return list of uploaded files

This will make the frontend work. Then gradually implement:
- File processing
- Emission calculations
- Real analytics
- Recommendation generation

## 10. Sample Backend Response (for testing)

If you want to test frontend before backend is ready, you can use a mock server:

**GET /api/analytics/summary**
```json
{
  "totalEmissions": 8450,
  "topHotspot": "Steel Production",
  "topHotspotEmissions": 3600,
  "potentialReduction": 1200,
  "improvementSuggestions": 5
}
```

**GET /api/recommendations**
```json
[
  {
    "id": "1",
    "title": "Switch to Renewable Energy",
    "description": "Transition to 100% renewable electricity",
    "type": "energy",
    "currentEmissions": 1183,
    "potentialReduction": 1065,
    "percentageSavings": 90,
    "costImpact": 25000,
    "implementationDifficulty": "Medium",
    "priority": 1
  }
]
```

## Need Help?

1. Check `API_INTEGRATION_GUIDE.md` for detailed API specs
2. Check `IMPLEMENTATION_SUMMARY.md` for what's been implemented
3. Review `src/services/api.ts` for API function implementations
4. Check browser console and network tab for errors

## Quick Commands Reference

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

**✨ You're all set! The frontend is ready to receive dynamic data from your API.**
