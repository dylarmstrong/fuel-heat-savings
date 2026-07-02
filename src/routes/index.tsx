import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/")({
  component: Index,
});

type FuelKey = "natural_gas" | "propane" | "fuel_oil";

// Energy content per unit of fuel (BTU)
const FUELS: Record<
  FuelKey,
  { label: string; unit: string; btuPerUnit: number; defaultPrice: number; priceLabel: string }
> = {
  natural_gas: {
    label: "Natural Gas",
    unit: "therm",
    btuPerUnit: 100_000,
    defaultPrice: 1.5,
    priceLabel: "$ / therm",
  },
  propane: {
    label: "Propane",
    unit: "gallon",
    btuPerUnit: 91_500,
    defaultPrice: 3.0,
    priceLabel: "$ / gallon",
  },
  fuel_oil: {
    label: "Fuel Oil (#2)",
    unit: "gallon",
    btuPerUnit: 138_500,
    defaultPrice: 4.0,
    priceLabel: "$ / gallon",
  },
};

const BTU_PER_KWH = 3412;

function Index() {
  const [fuel, setFuel] = useState<FuelKey>("natural_gas");
  const [fuelPrice, setFuelPrice] = useState<number>(FUELS.natural_gas.defaultPrice);
  const [efficiency, setEfficiency] = useState<string>("0.90"); // 80% - 98%
  const [cop, setCop] = useState<number>(3);
  const [elecPrice, setElecPrice] = useState<number>(0.16); // $/kWh
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [fuelBtuPerHour, setFuelBtuPerHour] = useState<number>(60_000); // input rating

  const results = useMemo(() => {
    const eff = parseFloat(efficiency);
    const f = FUELS[fuel];

    // Useful heat delivered per hour (BTU)
    const usefulBtuPerHour = fuelBtuPerHour * eff;

    // Fuel cost per hour
    const fuelUnitsPerHour = fuelBtuPerHour / f.btuPerUnit;
    const fuelCostPerHour = fuelUnitsPerHour * fuelPrice;

    // Heat pump: deliver same useful BTU/hr
    // kWh needed = usefulBTU / (COP * BTU_PER_KWH)
    const hpKwhPerHour = cop > 0 ? usefulBtuPerHour / (cop * BTU_PER_KWH) : 0;
    const hpCostPerHour = hpKwhPerHour * elecPrice;

    const savingsPerHour = fuelCostPerHour - hpCostPerHour;
    const savingsPerDay = savingsPerHour * hoursPerDay;
    const savingsPerMonth = savingsPerDay * 30;
    const savingsPerYear = savingsPerDay * 365;
    const savings5yr = savingsPerYear * 5;
    const savings10yr = savingsPerYear * 10;

    return {
      usefulBtuPerHour,
      fuelUnitsPerHour,
      fuelCostPerHour,
      hpKwhPerHour,
      hpCostPerHour,
      savingsPerHour,
      savingsPerDay,
      savingsPerMonth,
      savingsPerYear,
      savings5yr,
      savings10yr,
      unit: f.unit,
    };
  }, [fuel, fuelPrice, efficiency, cop, elecPrice, hoursPerDay, fuelBtuPerHour]);

  const currentFuel = FUELS[fuel];
  const money = (n: number) =>
    n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Heat Pump Savings Calculator
          </h1>
          <p className="text-muted-foreground">
            Compare fossil fuel heating vs. a heat pump — hourly, monthly, and over time.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Source</CardTitle>
              <CardDescription>Pick your current heating fuel and its cost.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fuel type</Label>
                <Select
                  value={fuel}
                  onValueChange={(v: FuelKey) => {
                    setFuel(v);
                    setFuelPrice(FUELS[v].defaultPrice);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural_gas">Natural Gas</SelectItem>
                    <SelectItem value="propane">Propane</SelectItem>
                    <SelectItem value="fuel_oil">Fuel Oil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fuel price ({currentFuel.priceLabel})</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={fuelPrice}
                  onChange={(e) => setFuelPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Appliance input rating (BTU/hr)</Label>
                <Input
                  type="number"
                  step="1000"
                  value={fuelBtuPerHour}
                  onChange={(e) => setFuelBtuPerHour(parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Typical furnace/boiler: 40,000 – 120,000 BTU/hr
                </p>
              </div>

              <div className="space-y-2">
                <Label>Combustion efficiency (AFUE)</Label>
                <Select value={efficiency} onValueChange={setEfficiency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0.80", "0.82", "0.85", "0.88", "0.90", "0.92", "0.95", "0.96", "0.98"].map(
                      (v) => (
                        <SelectItem key={v} value={v}>
                          {(parseFloat(v) * 100).toFixed(0)}%
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Heat Pump</CardTitle>
              <CardDescription>Set the heat pump efficiency (COP) and power cost.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Heat pump COP</Label>
                  <span className="text-sm font-medium">{cop.toFixed(1)}</span>
                </div>
                <Slider
                  value={[cop]}
                  min={0}
                  max={10}
                  step={0.1}
                  onValueChange={(v) => setCop(v[0])}
                />
                <p className="text-xs text-muted-foreground">
                  Typical cold-climate heat pumps: 2.0 – 4.5
                </p>
              </div>

              <div className="space-y-2">
                <Label>Electricity price ($/kWh)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={elecPrice}
                  onChange={(e) => setElecPrice(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label>Runtime (hours per day)</Label>
                <Input
                  type="number"
                  step="1"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              Delivering {results.usefulBtuPerHour.toLocaleString(undefined, { maximumFractionDigits: 0 })} BTU/hr of useful heat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4 space-y-1">
                <div className="text-sm text-muted-foreground">{currentFuel.label} cost / hr</div>
                <div className="text-2xl font-semibold">{money(results.fuelCostPerHour)}</div>
                <div className="text-xs text-muted-foreground">
                  {results.fuelUnitsPerHour.toFixed(3)} {results.unit}/hr
                </div>
              </div>
              <div className="rounded-lg border p-4 space-y-1">
                <div className="text-sm text-muted-foreground">Heat pump cost / hr</div>
                <div className="text-2xl font-semibold">{money(results.hpCostPerHour)}</div>
                <div className="text-xs text-muted-foreground">
                  {results.hpKwhPerHour.toFixed(2)} kWh/hr
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-sm text-muted-foreground mb-2">Estimated Savings</div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {[
                  ["Per hour", results.savingsPerHour],
                  ["Per day", results.savingsPerDay],
                  ["Per month", results.savingsPerMonth],
                  ["Per year", results.savingsPerYear],
                  ["Over 5 years", results.savings5yr],
                  ["Over 10 years", results.savings10yr],
                ].map(([label, val]) => {
                  const n = val as number;
                  const positive = n >= 0;
                  return (
                    <div key={label as string} className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">{label as string}</div>
                      <div
                        className={`text-lg font-semibold ${
                          positive ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        {money(n)}
                      </div>
                    </div>
                  );
                })}
              </div>
              {results.savingsPerHour < 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Negative values mean the heat pump costs more than {currentFuel.label.toLowerCase()} at these inputs.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Estimates only. Actual savings depend on climate, sizing, and utility rates.
        </p>
      </div>
    </div>
  );
}
