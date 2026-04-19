import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wifi, WifiOff, Zap, Search, Globe } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`
  : import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://carbon-reader.onrender.com/api';

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

async function apiPost<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

interface APIStatus {
  climatiq: boolean;
  carbonInterface: boolean;
  electricityMaps: boolean;
  co2signal: boolean;
}

interface GridIntensity {
  zone: string;
  carbonIntensity: number;
  unit: string;
  datetime?: string;
  source: string;
  note?: string;
}

interface FactorResult {
  source: 'live' | 'local';
  factor: {
    materialOrMode: string;
    factor: number;
    unit: string;
    source: string;
    region: string;
    confidenceRating: string;
    activityId?: string;
    yearReleased?: number;
  };
}

interface ElectricityResult {
  co2e: number;
  unit: string;
  source: string;
  country?: string;
  factor?: number;
}

const INDIA_ZONES = [
  { value: 'IN-SO', label: 'South India' },
  { value: 'IN-NO', label: 'North India' },
  { value: 'IN-EA', label: 'East India' },
  { value: 'IN-WE', label: 'West India' },
  { value: 'IN-NE', label: 'Northeast India' },
];

const WORLD_ZONES = [
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'US-CAL-CISO', label: 'California (US)' },
  { value: 'US-TEX-ERCO', label: 'Texas (US)' },
  { value: 'AU-NSW', label: 'New South Wales (AU)' },
  { value: 'SG', label: 'Singapore' },
];

export function LiveAPIsPanel() {
  const [factorQuery, setFactorQuery] = useState('steel');
  const [factorRegion, setFactorRegion] = useState('GLOBAL');
  const [gridZone, setGridZone] = useState('IN-SO');
  const [elecKwh, setElecKwh] = useState('1000');
  const [elecCountry, setElecCountry] = useState('in');

  // API status
  const { data: apiStatus, isLoading: statusLoading } = useQuery<APIStatus>({
    queryKey: ['apiStatus'],
    queryFn: () => apiGet(`${API_BASE}/live-factors/status`),
  });

  // Grid intensity
  const { data: gridData, isLoading: gridLoading, refetch: refetchGrid } = useQuery<GridIntensity>({
    queryKey: ['gridIntensity', gridZone],
    queryFn: () => apiGet(`${API_BASE}/live-factors/grid-intensity?zone=${gridZone}`),
  });

  // Factor search
  const [factorResult, setFactorResult] = useState<FactorResult | null>(null);
  const [factorLoading, setFactorLoading] = useState(false);
  const [factorError, setFactorError] = useState<string | null>(null);

  const searchFactor = async () => {
    setFactorLoading(true);
    setFactorError(null);
    try {
      const data = await apiGet<FactorResult>(
        `${API_BASE}/live-factors/search?activity=${encodeURIComponent(factorQuery)}&region=${factorRegion}`
      );
      setFactorResult(data);
    } catch (err: any) {
      setFactorError(err.message);
    } finally {
      setFactorLoading(false);
    }
  };

  // Electricity estimate
  const [elecResult, setElecResult] = useState<ElectricityResult | null>(null);
  const [elecLoading, setElecLoading] = useState(false);

  const calculateElec = async () => {
    setElecLoading(true);
    try {
      const data = await apiPost<ElectricityResult>(`${API_BASE}/live-factors/electricity`, {
        kwh: parseFloat(elecKwh),
        country: elecCountry,
      });
      setElecResult(data);
    } catch (err) {
      // swallow
    } finally {
      setElecLoading(false);
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity < 200) return 'text-green-600';
    if (intensity < 400) return 'text-yellow-600';
    if (intensity < 600) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-2 border-yellow-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-yellow-600" />
            <div>
              <CardTitle>Live API Tools</CardTitle>
              <CardDescription>Query live emission factors and grid data</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="factors">Factors</TabsTrigger>
            <TabsTrigger value="electricity">Electricity</TabsTrigger>
          </TabsList>

          {/* API Status Tab */}
          <TabsContent value="status" className="space-y-4">
            {statusLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : apiStatus ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {apiStatus.climatiq ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                  <div>
                    <p className="text-sm font-medium">Climatiq</p>
                    <p className="text-xs text-muted-foreground">{apiStatus.climatiq ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {apiStatus.carbonInterface ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                  <div>
                    <p className="text-sm font-medium">Carbon Interface</p>
                    <p className="text-xs text-muted-foreground">{apiStatus.carbonInterface ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {apiStatus.electricityMaps ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                  <div>
                    <p className="text-sm font-medium">Electricity Maps</p>
                    <p className="text-xs text-muted-foreground">{apiStatus.electricityMaps ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  {apiStatus.co2signal ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                  <div>
                    <p className="text-sm font-medium">CO2Signal</p>
                    <p className="text-xs text-muted-foreground">{apiStatus.co2signal ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          {/* Grid Intensity Tab */}
          <TabsContent value="grid" className="space-y-4">
            <div className="space-y-2">
              <Label>Select Zone</Label>
              <Select value={gridZone} onValueChange={setGridZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="font-semibold text-xs p-2 text-muted-foreground">India Zones</div>
                  {INDIA_ZONES.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>{zone.label}</SelectItem>
                  ))}
                  <div className="font-semibold text-xs p-2 text-muted-foreground">World Zones</div>
                  {WORLD_ZONES.map(zone => (
                    <SelectItem key={zone.value} value={zone.value}>{zone.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => refetchGrid()} disabled={gridLoading} className="w-full">
              {gridLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Get Grid Intensity'
              )}
            </Button>
            {gridData && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="font-medium">{gridData.zone}</p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${getIntensityColor(gridData.carbonIntensity)}`}>
                    {gridData.carbonIntensity}
                  </p>
                  <p className="text-sm text-muted-foreground">{gridData.unit}</p>
                </div>
                <p className="text-xs text-muted-foreground">Source: {gridData.source}</p>
                {gridData.datetime && (
                  <p className="text-xs text-muted-foreground">Updated: {new Date(gridData.datetime).toLocaleString()}</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* Emission Factors Tab */}
          <TabsContent value="factors" className="space-y-4">
            <div className="space-y-2">
              <Label>Activity</Label>
              <Input 
                value={factorQuery} 
                onChange={(e) => setFactorQuery(e.target.value)}
                placeholder="e.g., steel, diesel, electricity"
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={factorRegion} onValueChange={setFactorRegion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="EU">European Union</SelectItem>
                  <SelectItem value="IN">India</SelectItem>
                  <SelectItem value="UK">United Kingdom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={searchFactor} disabled={factorLoading} className="w-full">
              {factorLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
            {factorError && (
              <Alert variant="destructive">
                <AlertDescription>{factorError}</AlertDescription>
              </Alert>
            )}
            {factorResult && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{factorResult.factor.materialOrMode}</p>
                  <Badge variant={factorResult.source === 'live' ? 'default' : 'secondary'}>
                    {factorResult.source}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Factor</p>
                    <p className="font-semibold">{factorResult.factor.factor}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Unit</p>
                    <p className="font-semibold">{factorResult.factor.unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Region</p>
                    <p className="font-semibold">{factorResult.factor.region}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-semibold">{factorResult.factor.confidenceRating}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Electricity Tab */}
          <TabsContent value="electricity" className="space-y-4">
            <div className="space-y-2">
              <Label>kWh</Label>
              <Input 
                type="number" 
                value={elecKwh} 
                onChange={(e) => setElecKwh(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={elecCountry} onValueChange={setElecCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">India</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="gb">United Kingdom</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                  <SelectItem value="fr">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={calculateElec} disabled={elecLoading} className="w-full">
              {elecLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Calculate Emissions
                </>
              )}
            </Button>
            {elecResult && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-green-600">{elecResult.co2e.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">{elecResult.unit}</p>
                </div>
                <p className="text-xs text-muted-foreground">Source: {elecResult.source}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
