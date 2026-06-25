import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Satellite,
  Telescope,
  CloudMoon,
  Star,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/zenith-analysis")({
  component: ZenithAnalysis,
});

function ZenithAnalysis() {
  const [location] = useState("Chennai");

  const [issData] = useState({
    altitude: "420 km",
    direction: "North-East",
  });

  const [planetData] = useState({
    name: "Jupiter",
    altitude: "68°",
    azimuth: "145°",
  });

  const [visibleObjects] = useState([
    "Orion",
    "Sirius",
    "Polaris",
  ]);

  const [observationScore] = useState(92);

  useEffect(() => {
    // Future APIs can be connected here
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-center text-4xl font-bold">
        Zenith Analysis
      </h1>

      {/* Location */}
      <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center gap-2">
          <MapPin className="text-cyan-400" />
          <span className="text-xl font-semibold">
            Selected Location
          </span>
        </div>

        <p className="mt-2 text-lg text-cyan-400">
          {location}
        </p>
      </div>

      <h2 className="mb-5 text-2xl font-semibold">
        Currently Overhead
      </h2>

      {/* ISS */}
      <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Satellite className="text-cyan-400" />
          <h3 className="text-xl font-bold">ISS</h3>
        </div>

        <p>Altitude: {issData.altitude}</p>
        <p>Direction: {issData.direction}</p>
      </div>

      {/* Jupiter */}
      <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Telescope className="text-yellow-400" />
          <h3 className="text-xl font-bold">
            {planetData.name}
          </h3>
        </div>

        <p>Altitude: {planetData.altitude}</p>
        <p>Azimuth: {planetData.azimuth}</p>
      </div>

      {/* Stars */}
      <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <Star className="text-purple-400" />
          <h3 className="text-xl font-bold">
            Visible Celestial Objects
          </h3>
        </div>

        {visibleObjects.map((obj) => (
          <div
            key={obj}
            className="flex justify-between border-b border-slate-800 py-2"
          >
            <span>{obj}</span>
            <span className="text-green-400">
              Visible
            </span>
          </div>
        ))}
      </div>

      {/* Observation Score */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <div className="mb-3 flex items-center gap-2">
          <CloudMoon className="text-blue-400" />
          <h3 className="text-xl font-bold">
            Observation Score
          </h3>
        </div>

        <div className="text-5xl font-bold text-cyan-400">
          {observationScore}/100
        </div>

        <div className="mt-4 h-3 w-full rounded-full bg-slate-700">
          <div
            className="h-3 rounded-full bg-cyan-500"
            style={{ width: `${observationScore}%` }}
          />
        </div>

        <p className="mt-3 text-green-400">
          Excellent Viewing Conditions
        </p>
      </div>
    </div>
  );
}