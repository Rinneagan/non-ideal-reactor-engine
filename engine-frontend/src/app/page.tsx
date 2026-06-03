"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const Plot: any = dynamic(() => import("react-plotly.js"), { ssr: false });

interface SolveResponse {
  x: number[];
  y: number[];
  exit_concentration: number;
  conversion: number;
  peclet_number: number;
  reactor_type: string;
  cstr_conversion: number | null;
  pfr_conversion: number | null;
  deviation_from_ideal: number | null;
  success: boolean;
  message: string;
}

interface ErrorResponse {
  detail: string;
}

export default function Home() {
  const [dispersionNum, setDispersionNum] = useState(0.01);
  const [damkohlerNum, setDamkohlerNum] = useState(2.0);
  const [reactionOrder, setReactionOrder] = useState(1.0);
  const [meshPoints, setMeshPoints] = useState(100);

  const [result, setResult] = useState<SolveResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solveBVP = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/api/solve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dispersion_num: dispersionNum,
          damkohler_num: damkohlerNum,
          reaction_order: reactionOrder,
          mesh_points: meshPoints,
        }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.detail || "Failed to solve BVP");
      }

      const data: SolveResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const plotData = result
    ? (() => {
      const data: any[] = [
        {
          x: result.x,
          y: result.y,
          type: "scatter" as const,
          mode: "lines" as const,
          name: "Non-Ideal Reactor",
          line: {
            color: "#3b82f6",
            width: 3,
          },
        },
      ];

      if (result.pfr_conversion !== null) {
        const pfrX = result.x;
        const pfrY = pfrX.map((x) => Math.exp(-damkohlerNum * x));
        data.push({
          x: pfrX,
          y: pfrY,
          type: "scatter" as const,
          mode: "lines" as const,
          name: "Ideal PFR",
          line: {
            color: "#10b981",
            width: 2,
            dash: "dash",
          },
        });
      }

      if (result.cstr_conversion !== null) {
        const cstrY = result.x.map(() => 1 - result.cstr_conversion! / 100);
        data.push({
          x: result.x,
          y: cstrY,
          type: "scatter" as const,
          mode: "lines" as const,
          name: "Ideal CSTR",
          line: {
            color: "#f59e0b",
            width: 2,
            dash: "dash",
          },
        });
      }

      return data;
    })()
    : [];

  const plotLayout = {
    title: {
      text: "Dimensionless Concentration Profile",
      font: { size: 18, color: "#1f2937" },
    },
    xaxis: {
      title: {
        text: "Dimensionless Length (z/L)",
        font: { size: 14, color: "#4b5563" },
      },
      range: [0, 1],
      grid: { color: "#e5e7eb" },
    },
    yaxis: {
      title: {
        text: "Dimensionless Concentration (C/C₀)",
        font: { size: 14, color: "#4b5563" },
      },
      range: [0, 1.1],
      grid: { color: "#e5e7eb" },
    },
    margin: { t: 60, r: 40, b: 60, l: 70 },
    plot_bgcolor: "#ffffff",
    paper_bgcolor: "#ffffff",
    autosize: true,
  };

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"] as const,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">
            Non-Ideal Reactor Dynamics Engine
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            1D Advection-Dispersion-Reaction Boundary Value Problem Solver
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Input Parameters
              </h2>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispersion Number (Dₐ)
                </label>
                <input
                  type="range"
                  min="0.001"
                  max="1.0"
                  step="0.001"
                  value={dispersionNum}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setDispersionNum(isNaN(value) ? 0.01 : value);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">0.001</span>
                  <input
                    type="number"
                    min="0.001"
                    max="1.0"
                    step="0.001"
                    value={dispersionNum}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setDispersionNum(isNaN(value) ? 0.01 : value);
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">1.0</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Industrial: 0.001-0.1 (PFR-like), 0.1-1.0 (CSTR-like)
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Damköhler Number (Da)
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.1"
                  value={damkohlerNum}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setDamkohlerNum(isNaN(value) ? 2.0 : value);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">0</span>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={damkohlerNum}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setDamkohlerNum(isNaN(value) ? 2.0 : value);
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">20</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Industrial: 0.1-5 (typical), &gt;10 (high conversion)
                </p>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reaction Order (n)
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={reactionOrder}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setReactionOrder(isNaN(value) ? 1.0 : value);
                  }}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">0.1</span>
                  <input
                    type="number"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={reactionOrder}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setReactionOrder(isNaN(value) ? 1.0 : value);
                    }}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-500">5</span>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesh Points
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={meshPoints}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setMeshPoints(isNaN(value) || value < 10 ? 100 : Math.min(value, 1000));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={solveBVP}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? "Solving..." : "Solve BVP"}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          </aside>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Concentration Profile
              </h2>

              <div className="w-full" style={{ minHeight: "400px" }}>
                {result ? (
                  <Plot
                    data={plotData}
                    layout={plotLayout}
                    config={plotConfig}
                    style={{ width: "100%", height: "100%" }}
                    useResizeHandler={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-gray-500 text-center">
                      Adjust parameters and click "Solve BVP" to generate the
                      concentration profile
                    </p>
                  </div>
                )}
              </div>

              {result && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      Exit Concentration
                    </h3>
                    <p className="text-2xl font-bold text-blue-700">
                      {result.exit_concentration.toFixed(4)}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      C/C₀ at z/L = 1
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-sm font-medium text-green-900 mb-1">
                      Overall Conversion
                    </h3>
                    <p className="text-2xl font-bold text-green-700">
                      {result.conversion.toFixed(2)}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      (1 - C_exit/C_inlet) × 100
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h3 className="text-sm font-medium text-purple-900 mb-1">
                      Peclet Number (Pe)
                    </h3>
                    <p className="text-2xl font-bold text-purple-700">
                      {result.peclet_number.toFixed(2)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Pe = 1/Dₐ (flow regime indicator)
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="text-sm font-medium text-orange-900 mb-1">
                      Flow Regime
                    </h3>
                    <p className="text-lg font-bold text-orange-700">
                      {result.reactor_type}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Based on Peclet number
                    </p>
                  </div>
                </div>
              )}

              {result && result.pfr_conversion !== null && (
                <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Ideal Reactor Model Comparison (First-Order)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Ideal CSTR</p>
                      <p className="text-xl font-bold text-gray-800">
                        {result.cstr_conversion?.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Non-Ideal (This)</p>
                      <p className="text-xl font-bold text-blue-700">
                        {result.conversion.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600 mb-1">Ideal PFR</p>
                      <p className="text-xl font-bold text-gray-800">
                        {result.pfr_conversion?.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  {result.deviation_from_ideal !== null && (
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-600">
                        Deviation from ideal PFR:{" "}
                        <span className="font-semibold">
                          {result.deviation_from_ideal.toFixed(2)}%
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                Governing Equation
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 text-gray-800">
                <p className="mb-4 text-sm">
                  <span className="font-semibold">Governing Equation:</span>
                </p>
                <div className="text-center text-lg mb-6">
                  <div className="inline-block">
                    <span className="italic">D</span>
                    <sub className="text-xs">a</sub>
                    <span className="mx-2">·</span>
                    <span className="inline-block align-middle">
                      <div className="border-b border-gray-800 pb-1">
                        <span className="italic">d</span><sup>2</sup><span className="italic">y</span>
                      </div>
                      <div className="pt-1">
                        <span className="italic">dx</span><sup>2</sup>
                      </div>
                    </span>
                    <span className="mx-2">−</span>
                    <span className="inline-block align-middle">
                      <div className="border-b border-gray-800 pb-1">
                        <span className="italic">dy</span>
                      </div>
                      <div className="pt-1">
                        <span className="italic">dx</span>
                      </div>
                    </span>
                    <span className="mx-2">−</span>
                    <span className="italic">Da</span>
                    <span className="mx-2">·</span>
                    <span className="italic">y</span><sup className="text-sm">n</sup>
                    <span className="mx-2">=</span>
                    <span>0</span>
                  </div>
                </div>
                <p className="mb-2 text-sm">
                  <span className="font-semibold">Boundary Conditions (Danckwerts):</span>
                </p>
                <div className="space-y-2 text-sm">
                  <p className="text-center">
                    Inlet (<span className="italic">x</span> = 0): 1 = <span className="italic">y</span>(0) − <span className="italic">D</span><sub className="text-xs">a</sub> · <span className="italic">y</span>'(0)
                  </p>
                  <p className="text-center">
                    Outlet (<span className="italic">x</span> = 1): <span className="italic">y</span>'(1) = 0
                  </p>
                </div>
              </div>
            </div>

            {result && (
              <div className="mt-6 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                  Physical Interpretation
                </h2>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Peclet Number (Pe = {result.peclet_number.toFixed(2)}):</span>{" "}
                    {result.peclet_number > 100
                      ? "High Pe indicates minimal axial dispersion - reactor behaves like an ideal Plug Flow Reactor (PFR)."
                      : result.peclet_number > 10
                      ? "Moderate Pe indicates low dispersion - good approximation to PFR with some mixing."
                      : result.peclet_number > 1
                      ? "Moderate Pe indicates significant dispersion - reactor exhibits both plug flow and mixing characteristics."
                      : "Low Pe indicates high dispersion - reactor approaches ideal Continuous Stirred Tank Reactor (CSTR) behavior."}
                  </p>
                  <p>
                    <span className="font-semibold">Damköhler Number (Da = {damkohlerNum}):</span>{" "}
                    {damkohlerNum < 0.1
                      ? "Low Da indicates reaction rate is much slower than residence time - low conversion expected."
                      : damkohlerNum < 5
                      ? "Moderate Da indicates reaction rate is comparable to residence time - moderate conversion."
                      : "High Da indicates reaction rate is much faster than residence time - high conversion expected."}
                  </p>
                  <p>
                    <span className="font-semibold">Conversion ({result.conversion.toFixed(2)}%):</span>{" "}
                    {result.conversion > 90
                      ? "Excellent conversion - reactor is highly effective."
                      : result.conversion > 70
                      ? "Good conversion - reactor performance is satisfactory."
                      : result.conversion > 50
                      ? "Moderate conversion - may need optimization."
                      : "Low conversion - consider increasing residence time or temperature."}
                  </p>
                  {result.deviation_from_ideal !== null && (
                    <p>
                      <span className="font-semibold">Deviation from Ideal PFR ({result.deviation_from_ideal.toFixed(2)}%):</span>{" "}
                      {result.deviation_from_ideal < 5
                        ? "Minimal deviation - non-ideal effects are negligible."
                        : result.deviation_from_ideal < 15
                        ? "Moderate deviation - axial dispersion has noticeable impact."
                        : "Significant deviation - axial dispersion significantly affects performance."}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
