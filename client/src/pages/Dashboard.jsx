import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getFarmsAPI, getDetectionHistoryAPI, getPestHistoryAPI } from '../api/farmApi';
import { getItemsAPI } from '../api/inventoryApi';
import axios from 'axios';

/* ─── tiny hook to get time-based greeting ─── */
function useGreeting(name) {
  const h = new Date().getHours();
  const period = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  return `Good ${period}, ${name}! 👋`;
}

/* ─── Stat Card ─── */
const StatCard = ({ icon, label, value, sub, color, loading }) => {
  const colors = {
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  val: 'text-green-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'bg-amber-100 text-amber-600',  val: 'text-amber-700' },
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    val: 'text-blue-700'  },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', val: 'text-purple-700'},
  };
  const c = colors[color] || colors.green;
  return (
    <div className={`${c.bg} rounded-2xl p-5 flex items-center gap-4 border border-white shadow-sm`}>
      <div className={`${c.icon} p-3.5 rounded-xl text-2xl shrink-0`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mt-1" />
        ) : (
          <p className={`text-2xl font-extrabold ${c.val} leading-tight`}>{value}</p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

/* ─── Quick Action Card ─── */
const ActionCard = ({ to, gradient, emoji, title, desc, btnLabel, btnStyle }) => (
  <Link
    to={to}
    className={`group ${gradient} rounded-3xl p-7 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px] transition-transform hover:-translate-y-1 hover:shadow-xl`}
  >
    <div className="relative z-10">
      <div className="text-3xl mb-3">{emoji}</div>
      <h3 className="text-xl font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-80 leading-relaxed">{desc}</p>
    </div>
    <div className={`relative z-10 mt-5 self-start text-sm font-bold px-5 py-2 rounded-xl transition-all ${btnStyle}`}>
      {btnLabel} →
    </div>
    <div className="absolute -bottom-6 -right-6 text-[8rem] opacity-10 select-none">{emoji}</div>
  </Link>
);

/* ─── Activity Row ─── */
const ActivityRow = ({ icon, title, sub, badge, badgeColor }) => {
  const badgeColors = {
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    blue:  'bg-blue-100 text-blue-700',
    red:   'bg-red-100 text-red-700',
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
        <p className="text-xs text-gray-400 truncate">{sub}</p>
      </div>
      {badge && (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeColors[badgeColor] || badgeColors.blue}`}>
          {badge}
        </span>
      )}
    </div>
  );
};

/* ═══ Dashboard ═══ */
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const firstName = user?.name?.split(' ')[0] || 'Farmer';
  const greeting = useGreeting(firstName);

  const [stats, setStats] = useState({ farms: null, items: null, diseaseScans: null, pestScans: null });
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [farmRes, invRes, diseaseRes, pestRes] = await Promise.allSettled([
          getFarmsAPI(),
          getItemsAPI(),
          getDetectionHistoryAPI(),
          getPestHistoryAPI(),
        ]);

        const farmList = farmRes.status === 'fulfilled' ? (farmRes.value.farms ?? []) : [];
        setFarms(farmList);
        setStats({
          farms: farmList.length,
          items: invRes.status === 'fulfilled' ? (invRes.value.items?.length ?? 0) : 0,
          diseaseScans: diseaseRes.status === 'fulfilled' ? (diseaseRes.value.history?.length ?? 0) : 0,
          pestScans: pestRes.status === 'fulfilled' ? (pestRes.value.history?.length ?? 0) : 0,
        });
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Current weather at the user's location (Open-Meteo, no API key)
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await axios.get(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current_weather=true`
          );
          const c = data.current_weather;
          const code = c.weathercode;
          const [icon, label] =
            code >= 95 ? ['⛈️', 'Thunderstorm'] :
            code >= 71 && code <= 77 ? ['❄️', 'Snow'] :
            code >= 51 && code <= 67 ? ['🌧️', 'Rain'] :
            code >= 45 && code <= 48 ? ['🌫️', 'Foggy'] :
            code >= 1 && code <= 3 ? ['⛅', 'Partly cloudy'] : ['☀️', 'Clear'];
          setWeather({ icon, label, temp: `${c.temperature}°C` });
        } catch { /* weather is optional */ }
      },
      () => { /* location denied: hide the weather chip */ }
    );
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-green-200 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{greeting}</h1>
          <p className="text-green-100 mt-2 text-base opacity-90">
            Your farm dashboard is ready. All systems are running.
          </p>
          <div className="flex items-center gap-2 mt-4">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
            <span className="text-green-200 text-sm font-medium">AgriSense AI · Online</span>
            {weather && (
              <span className="ml-4 text-green-100 text-sm font-medium bg-white/10 px-3 py-1 rounded-full">
                {weather.icon} {weather.temp} · {weather.label}
              </span>
            )}
          </div>
        </div>
        <div className="absolute -right-8 -top-8 text-[200px] opacity-5 select-none">🌾</div>
        <div className="absolute right-12 bottom-0 text-[80px] opacity-10 select-none">🌿</div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="🗺️" label="Farm Boundaries" value={stats.farms ?? 0} sub="Saved fields" color="green" loading={loading} />
        <StatCard icon="📦" label="Inventory Items" value={stats.items ?? 0} sub="In stock" color="blue" loading={loading} />
        <StatCard icon="🔍" label="Disease Scans" value={stats.diseaseScans ?? 0} sub="Total uploaded" color="amber" loading={loading} />
        <StatCard icon="🐛" label="Pest Scans" value={stats.pestScans ?? 0} sub="Total uploaded" color="purple" loading={loading} />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ActionCard
            to="/workspace/crop-health"
            gradient="bg-gradient-to-br from-green-500 to-emerald-700"
            emoji="🌱"
            title="Crop Analysis"
            desc="Draw your farm boundary and get satellite NDVI analysis instantly."
            btnLabel="Open Map"
            btnStyle="bg-white/20 hover:bg-white/30 text-white"
          />
          <ActionCard
            to="/workspace/disease-detection"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
            emoji="🔍"
            title="Disease Detection"
            desc="Upload a leaf photo and let AI identify crop diseases for you."
            btnLabel="Upload Scan"
            btnStyle="bg-white/20 hover:bg-white/30 text-white"
          />
          <ActionCard
            to="/workspace/pest-detection"
            gradient="bg-gradient-to-br from-blue-500 to-indigo-700"
            emoji="🐛"
            title="Pest Detection"
            desc="Photograph a pest and get identification and control recommendations."
            btnLabel="Detect Pest"
            btnStyle="bg-white/20 hover:bg-white/30 text-white"
          />
          <ActionCard
            to="/workspace/inventory"
            gradient="bg-gradient-to-br from-teal-500 to-cyan-700"
            emoji="📦"
            title="Farm Inventory"
            desc="Track seeds, fertilizers, pesticides, and equipment in one place."
            btnLabel="Manage Stock"
            btnStyle="bg-white/20 hover:bg-white/30 text-white"
          />
          <ActionCard
            to="/workspace/profile"
            gradient="bg-gradient-to-br from-pink-500 to-rose-600"
            emoji="👤"
            title="Your Profile"
            desc="Update your contact details, address, and account settings."
            btnLabel="Edit Profile"
            btnStyle="bg-white/20 hover:bg-white/30 text-white"
          />
          {/* AI Chat nudge card */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-800 rounded-3xl p-7 text-white shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[180px]">
            <div className="relative z-10">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="text-xl font-bold mb-1">AI Assistant</h3>
              <p className="text-sm opacity-80">Ask Gemini AI any farming question — soil, pests, weather, crops.</p>
            </div>
            <div className="relative z-10 mt-5 flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 text-sm font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-purple-300 animate-pulse" />
              Use the chat button ↘
            </div>
            <div className="absolute -bottom-6 -right-6 text-[8rem] opacity-10 select-none">🤖</div>
          </div>
        </div>
      </div>

      {/* ── Recent Farms ── */}
      {farms.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Your Farm Boundaries</h2>
            <Link to="/workspace/crop-health" className="text-sm font-semibold text-green-600 hover:text-green-700">
              Open Map →
            </Link>
          </div>
          <div className="space-y-0">
            {farms.slice(0, 5).map((farm, i) => {
              const area = farm.area?.value
                ? `${farm.area.value} ${farm.area.unit || 'acre'}`
                : 'Area not set';
              const soil = farm.soilType ? `· ${farm.soilType} soil` : '';
              return (
                <ActivityRow
                  key={farm._id || i}
                  icon="🗺️"
                  title={farm.farmName || `Farm #${i + 1}`}
                  sub={`${area}${soil}`}
                  badge="Saved"
                  badgeColor="green"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tips Banner ── */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 flex items-start gap-4">
        <span className="text-3xl shrink-0 mt-0.5">💡</span>
        <div>
          <p className="font-bold text-green-800">Pro Tip</p>
          <p className="text-sm text-green-700 mt-0.5">
            Use <strong>Disease Detection</strong> right after spotting unusual leaf discolouration. Early detection saves your entire harvest. Upload a close-up photo for best AI accuracy.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
