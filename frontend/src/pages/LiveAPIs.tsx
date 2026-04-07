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

const API_BASE = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');

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

// Indian electricity grid zones
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

export default function LiveAPIs() {
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

  const getIntensityLabel = (intensity: number) => {
    if (intensity < 200) return 'Very clean';
    if (intensity < 400) return 'Moderate';
    if (intensity < 600) return 'Dirty';
    return 'Very dirty';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Live Carbon APIs</h2>
        <p className="text-sm text-muted-foreground">
          Real-time emission factors from Climatiq, Carbon Interface, and Electricity Maps
        </p>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            API Connection Status
          </CardTitle>
          <CardDescription>
            Live connection statuses to external carbon data providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'climatiq', name: 'Climatiq', url: 'climatiq.io', desc: 'Activity-based factors' },
                { key: 'carbonInterface', name: 'Carbon Interface', url: 'carboninterface.com', desc: 'Electricity estimates' },
                { key: 'electricityMaps', name: 'Electricity Maps', url: 'electricitymaps.com', desc: 'Grid intensity' },
                { key: 'co2signal', name: 'CO2Signal', url: 'co2signal.com', desc: 'Free grid intensity' },
              ].map(({ key, name, url, desc }) => {
                const connected = apiStatus?.[key as keyof APIStatus];
                return (
                  <div key={key} className="p-3 rounded-lg border flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      {connected
                        ? <Wifi className="h-4 w-4 text-green-500" />
                        : <WifiOff className="h-4 w-4 text-red-400" />}
                      <span className="text-sm font-medium">{name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                    <a href={`https://${url}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline">{url}</a>
                    <Badge variant={connected ? 'default' : 'secondary'} className="w-fit text-xs mt-1">
                      {connected ? 'Connected' : 'No API key'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Grid Carbon Intensity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Live Grid Intensity
            </CardTitle>
            <CardDescription>
              Real-time gCO₂eq/kWh for your electricity grid zone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Grid zone</Label>
              <Select value={gridZone} onValueChange={(v) => setGridZone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium">India</div>
                  {INDIA_ZONES.map((z) => (
                    <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs text-muted-foreground font-medium mt-1">World</div>
                  {WORLD_ZONES.map((z) => (
                    <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" onClick={() => refetchGrid()} disabled={gridLoading}>
                {gridLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
              </Button>
            </div>

            {gridData && (
              <div className="p-4 rounded-lg border bg-muted/30 text-center">
                <p className={`text-4xl font-bold ${getIntensityColor(gridData.carbonIntensity)}`}>
                  {gridData.carbonIntensity}
                </p>
                <p className="text-sm text-muted-foreground">{gridData.unit}</p>
                <Badge variant="secondary" className="mt-2">{getIntensityLabel(gridData.carbonIntensity)}</Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Source: {gridData.source}
                  {gridData.datetime && ` · ${new Date(gridData.datetime).toLocaleTimeString()}`}
                </p>
                {gridData.note && (
                  <p className="text-xs text-yellow-600 mt-1">{gridData.note}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Electricity CO2 Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Electricity CO₂ Calculator</CardTitle>
            <CardDescription>
              Calculate CO₂e for a given kWh consumption via Carbon Interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>kWh</Label>
                <Input
                  type="number"
                  value={elecKwh}
                  onChange={(e) => setElecKwh(e.target.value)}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-1">
                <Label>Country code</Label>
                <Input
                  value={elecCountry}
                  onChange={(e) => setElecCountry(e.target.value)}
                  placeholder="in, gb, us..."
                />
              </div>
            </div>
            <Button onClick={calculateElec} disabled={elecLoading} className="w-full">
              {elecLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Calculate
            </Button>
            {elecResult && (
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-3xl font-bold text-primary">{elecResult.co2e?.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{elecResult.unit}</p>
                <p className="text-xs text-muted-foreground mt-1">Source: {elecResult.source}</p>
                {elecResult.factor && (
                  <p className="text-xs text-muted-foreground">
                    Factor used: {elecResult.factor} kg CO₂e/kWh
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Emission Factor Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Live Emission Factor Search
          </CardTitle>
          <CardDescription>
            Search Climatiq for real-time emission factors. Falls back to local DB if API unavailable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              value={factorQuery}
              onChange={(e) => setFactorQuery(e.target.value)}
              placeholder="e.g. steel, air freight, natural gas..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && searchFactor()}
            />
            <Select value={factorRegion} onValueChange={setFactorRegion}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Global</SelectItem>
                <SelectItem value="IN">India</SelectItem>
                <SelectItem value="GB">UK</SelectItem>
                <SelectItem value="US">USA</SelectItem>
                <SelectItem value="DE">Germany</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={searchFactor} disabled={factorLoading}>
              {factorLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {factorError && (
            <Alert>
              <AlertDescription className="text-xs">{factorError} — No factor found for this query.</AlertDescription>
            </Alert>
          )}

          {factorResult && (
            <div className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">{factorResult.factor.materialOrMode}</p>
                <div className="flex gap-2">
                  <Badge variant={factorResult.source === 'live' ? 'default' : 'secondary'}>
                    {factorResult.source === 'live' ? '🌐 Live' : '💾 Local DB'}
                  </Badge>
                  <Badge variant="outline">{factorResult.factor.confidenceRating} confidence</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Factor</p>
                  <p className="font-mono font-semibold">{factorResult.factor.factor?.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Unit</p>
                  <p className="font-mono">{factorResult.factor.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p>{factorResult.factor.source}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Region</p>
                  <p>{factorResult.factor.region}</p>
                </div>
              </div>
              {factorResult.factor.activityId && (
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  Activity ID: {factorResult.factor.activityId}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
