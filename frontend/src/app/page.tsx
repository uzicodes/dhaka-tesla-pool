import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-6 pb-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Pilot Hub: Banani ↔ Mohakhali ↔ Gulshan
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
          Shared Tesla Mobility for Dhaka
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          A concurrency-safe, zero-emission shared fleet. Reserve seats on demand, split urban fares transparently, and bypass Dhaka traffic stress in a clean electric vehicle.
        </p>
      </section>

      {/* Role Selection Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Passenger Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                Commuter Workspace
              </span>
              <span className="text-xs font-medium text-slate-400">Default Actor: Nusrat</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Passenger Console</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Book pooled seats along major Dhaka corridors. Live-track matching status, driver arrival, trip progress, and fare breakdowns.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-1">
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Real-time short polling updates every 3s
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Automatic 25% discount for agreed pooling
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✓</span> Safe pre-departure trip cancellation
              </li>
            </ul>
          </div>
          <div>
            <Link
              href="/passenger"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition"
            >
              Open Passenger Console →
            </Link>
          </div>
        </div>

        {/* Driver Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Fleet Dispatch
              </span>
              <span className="text-xs font-medium text-slate-400">Driver: Jashim (Bullet)</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Driver Console</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Accept incoming ride requests within vehicle capacity limits, view passenger manifest, and step through the pool lifecycle.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-1">
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span> Hard 3-seat vehicle capacity guard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span> Transaction-safe atomic seat booking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-blue-500 font-bold">✓</span> Lifecycle states: Arrived, Started, Completed
              </li>
            </ul>
          </div>
          <div>
            <Link
              href="/driver"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-xs transition"
            >
              Open Driver Console →
            </Link>
          </div>
        </div>
      </section>

      {/* Network Specs Bar */}
      <section className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
          Fleet Architecture & Specifications
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500">Assigned Vehicle</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">Tesla Model 3</div>
            <div className="text-[11px] text-slate-400">Callsign: "Bullet"</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500">Max Passenger Capacity</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">3 Commuters</div>
            <div className="text-[11px] text-slate-400">Strict concurrency lock</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500">Pricing Engine</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">Poysha Precision</div>
            <div className="text-[11px] text-slate-400">Integer math (no floats)</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500">Active Corridors</div>
            <div className="font-semibold text-slate-900 text-sm mt-0.5">5 Key Hubs</div>
            <div className="text-[11px] text-slate-400">Banani, Mohakhali, Gulshan...</div>
          </div>
        </div>
      </section>
    </div>
  );
}