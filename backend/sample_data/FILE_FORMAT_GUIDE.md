# CSV/Excel File Format Guide

## Supported File Types
- CSV (.csv)
- Excel (.xlsx, .xls)
- PDF (.pdf) - coming soon

## File Formats

### 1. Materials Data
**Filename pattern**: Must include "material" (e.g., `materials.csv`, `material_data.xlsx`)

**Required Columns**:
```csv
material_type,quantity,unit,supplier,region,date
Steel,150000,kg,Supplier A,EU,2024-01-15
Aluminum,30000,kg,Supplier B,Asia,2024-01-20
Plastic,25000,kg,Supplier C,EU,2024-02-10
Cardboard,10000,kg,Supplier D,Europe,2024-02-15
Cotton,5000,kg,Supplier E,Asia,2024-03-01
```

**Columns**:
- `material_type`: Name of material (Steel, Aluminum, Plastic, Concrete, Cardboard, Cotton, etc.)
- `quantity`: Amount of material
- `unit`: Unit of measurement (kg, tons, units)
- `supplier`: Supplier name
- `region`: Geographic region (EU, Asia, US, etc.)
- `date`: Date in YYYY-MM-DD format

### 2. Transport Data
**Filename pattern**: Must include "transport" (e.g., `transport.csv`, `logistics_transport.xlsx`)

**Required Columns**:
```csv
mode,distance,unit,weight,origin,destination,date
Full Truck,500,km,15000,Berlin,Paris,2024-01-10
Ship-Average,3000,km,50000,Shanghai,Hamburg,2024-01-15
Rail-Europe,800,km,20000,Madrid,Rome,2024-02-05
Air Freight,2000,km,1000,New York,London,2024-02-20
```

**Columns**:
- `mode`: Transport mode (Full Truck, Ship-Average, Rail-Europe, Air Freight, etc.)
- `distance`: Distance traveled
- `unit`: Distance unit (km, miles)
- `weight`: Cargo weight in kg
- `origin`: Starting location
- `destination`: End location
- `date`: Date in YYYY-MM-DD format

### 3. Energy Data
**Filename pattern**: Must include "energy" (e.g., `energy.csv`, `energy_consumption.xlsx`)

**Required Columns**:
```csv
energy_type,consumption,unit,region,date
Grid Electricity,450000,kWh,EU,2024-01-01
Natural Gas,2000,m³,EU,2024-01-15
Grid Electricity,380000,kWh,Asia,2024-02-01
Solar,50000,kWh,US,2024-02-10
```

**Columns**:
- `energy_type`: Type of energy (Grid Electricity, Natural Gas, Solar, Wind, etc.)
- `consumption`: Amount consumed
- `unit`: Unit of measurement (kWh, m³, MWh)
- `region`: Geographic region
- `date`: Date in YYYY-MM-DD format

## Supported Materials (with Emission Factors)
- Steel
- Aluminum  
- Plastic
- Concrete
- Cardboard
- Cotton
- Glass
- Paper
- Wood
- Rubber
- Copper
- Chemicals

## Supported Transport Modes
- Full Truck
- Ship-Average
- Rail-Europe
- Air Freight
- Small Truck
- Large Truck
- Container Ship
- Bulk Carrier

## Supported Energy Types
- Grid Electricity
- Natural Gas
- Coal
- Oil
- Solar
- Wind
- Hydro
- Biomass

## Tips
1. **Column names are flexible** - the system uses fuzzy matching (e.g., "Material Type" = "material_type")
2. **Case insensitive** - "Steel" = "steel" = "STEEL"
3. **Date format**: Use YYYY-MM-DD for best results
4. **Multiple files**: Upload multiple files to combine different data types
5. **Auto-detection**: The system automatically detects the data type from the filename
