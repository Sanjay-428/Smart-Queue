import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Search,
  Filter,
  Navigation,
  Star,
  Users,
  Clock,
  MapPin,
  RefreshCw,
  Ticket,
  UserCheck,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Landmark,
  Building,
  Stethoscope
} from 'lucide-react';
import api from '../api/axios';

import Navbar from '../components/Navbar';
import ActiveTokenCard from '../components/ActiveTokenCard';
import HospitalModal from '../components/HospitalModal';
import JoinQueueModal from '../components/JoinQueueModal';
import QueueHistoryTab from '../components/QueueHistoryTab';
import DoctorSchedulesTab from '../components/DoctorSchedulesTab';
import AdminStaffDashboard from '../components/AdminStaffDashboard';
import LocationSearchBar from '../components/LocationSearchBar';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  // Tab & User Role state
  const [activeTab, setActiveTab] = useState('hospitals');
  const [userRole, setUserRole] = useState(user?.role || 'patient');

  // Location Search State
  const [selectedCountry, setSelectedCountry] = useState('IN');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Welcome to SmartQueue',
      message: 'Track virtual queues, doctor schedules, and digital tokens live.',
      time: 'Just now',
      type: 'info',
      read: false,
    },
    {
      id: 2,
      title: 'System Notice',
      message: 'General Hospital OPD hours active today (8 AM - 6 PM).',
      time: '10m ago',
      type: 'alert',
      read: false,
    },
  ]);

  // Hospitals & Active Token State
  const [hospitals, setHospitals] = useState([]);
  const [districts, setDistricts] = useState(['All Districts']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrowd, setSelectedCrowd] = useState('All');

  // Modals & Active Queue Ticket
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [joinHospital, setJoinHospital] = useState(null);
  const [activeToken, setActiveToken] = useState(null);

  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoDetectedMessage, setGeoDetectedMessage] = useState('');

  const addNotification = (notif) => {
    const newNotif = {
      id: Date.now(),
      title: notif.title,
      message: notif.message,
      type: notif.type || 'info',
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Fetch active queue ticket
  const fetchActiveToken = useCallback(async () => {
    try {
      const response = await api.get('/queue/active');
      if (response.data?.success) {
        setActiveToken(response.data.data);
      } else {
        setActiveToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch active queue token:', error);
    }
  }, []);

  // Fetch hospital districts
  const fetchDistricts = async () => {
    try {
      const response = await api.get('/hospitals/districts/list');
      if (response.data?.success) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load districts:', error);
    }
  };

  // Fetch real nearby hospitals via OpenStreetMap Overpass search
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCountry) params.country = selectedCountry;
      if (selectedState && selectedState.trim() !== '') {
        params.state = selectedState.trim();
      }
      if (selectedDistrict && selectedDistrict !== 'All Districts' && selectedDistrict.trim() !== '') {
        params.district = selectedDistrict.trim();
      }
      if (selectedArea && selectedArea.trim() !== '') {
        params.area = selectedArea.trim();
      }
      if (searchQuery.trim() !== '') {
        params.search = searchQuery.trim();
      }
      if (selectedCrowd && selectedCrowd !== 'All') {
        params.crowdStatus = selectedCrowd;
      }

      const response = await api.get('/hospitals/search', { params });
      if (response.data?.success) {
        setHospitals(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch real hospitals:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, selectedState, selectedDistrict, selectedArea, searchQuery, selectedCrowd]);

  useEffect(() => {
    fetchDistricts();
    fetchActiveToken();
  }, [fetchActiveToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHospitals();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchHospitals]);

  const handleDetectLocation = () => {
    setGeoLoading(true);
    setGeoDetectedMessage('');
    setTimeout(() => {
      setSelectedDistrict('Central District');
      setGeoDetectedMessage('Detected: Central District Core');
      setGeoLoading(false);
      setTimeout(() => setGeoDetectedMessage(''), 4000);
    }, 800);
  };

  const handleTokenIssued = (newToken) => {
    setActiveToken(newToken);
    fetchHospitals();
    addNotification({
      title: 'Queue Token Issued',
      message: `Token ${newToken.tokenNumber} assigned for ${newToken.hospitalName}.`,
      type: 'status',
    });
  };

  const handleTokenCancelled = () => {
    if (activeToken) {
      addNotification({
        title: 'Token Cancelled',
        message: `Token ${activeToken.tokenNumber} was cancelled.`,
        type: 'alert',
      });
    }
    setActiveToken(null);
    fetchHospitals();
  };

  const getCrowdBadgeStyle = (status) => {
    switch (status) {
      case 'Low':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={logout}
        userRole={userRole}
        setUserRole={setUserRole}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onClearAll={handleClearNotifications}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Active Token Tracker Widget (Pinned on top if active) */}
        {activeToken && activeTab === 'hospitals' && (
          <ActiveTokenCard
            token={activeToken}
            onCancelled={handleTokenCancelled}
            onRefresh={fetchActiveToken}
          />
        )}

        {/* TAB 1: Hospitals Directory */}
        {activeTab === 'hospitals' && (
          <div className="space-y-6">
            {!activeToken && (
              <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/90 relative overflow-hidden bg-gradient-to-r from-slate-900/90 via-[#0a1428] to-slate-950">
                <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute top-0 right-1/3 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-3 shimmer-badge">
                      <UserCheck className="w-3.5 h-3.5" /> Live OPD Virtual Queue Engine
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent capitalize">{user?.username || 'Patient'}</span>!
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                      Book virtual queue tickets, view real-time doctor availability, and skip waiting room crowding with live status updates.
                    </p>
                  </div>

                  {/* Live Stats Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Hospitals</div>
                      <div className="text-xl font-extrabold text-cyan-400 mt-0.5">{hospitals.length || 6} Online</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Avg Wait</div>
                      <div className="text-xl font-extrabold text-emerald-400 mt-0.5">18 Mins</div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-center col-span-2 sm:col-span-1">
                      <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Pass Mode</div>
                      <div className="text-xl font-extrabold text-indigo-400 mt-0.5">Instant</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global Location Search Bar (Country -> State -> District -> Area) */}
            <LocationSearchBar
              onLocationChange={({ country, state, district, area }) => {
                if (country) setSelectedCountry(country);
                setSelectedState(state);
                setSelectedDistrict(district);
                setSelectedArea(area);
              }}
              onReset={() => {
                setSelectedCountry('IN');
                setSelectedState('');
                setSelectedDistrict('');
                setSelectedArea('');
                setSearchQuery('');
                setSelectedCrowd('All');
              }}
            />

            {/* Hospitals Directory Controls & Search */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-cyan-400" />
                    Nearby Hospitals Directory
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Filter by name, department, crowd status, or location
                  </p>
                </div>

                <button
                  onClick={handleDetectLocation}
                  disabled={geoLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                  <span>{geoLoading ? 'Detecting...' : 'Detect My Location'}</span>
                </button>
              </div>

              {geoDetectedMessage && (
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{geoDetectedMessage}</span>
                </div>
              )}

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-9 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search hospitals by name, department, or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-11 pr-4 py-3 outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-3">
                  <button
                    onClick={() => {
                      fetchHospitals();
                      fetchActiveToken();
                    }}
                    className="w-full h-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl py-3 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Refresh List</span>
                  </button>
                </div>
              </div>

              {/* Crowd Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-slate-400 text-xs font-medium mr-2">Crowd Status:</span>
                {['All', 'Low', 'Moderate', 'High', 'Critical'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedCrowd(status)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                      selectedCrowd === status
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Hospital Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="glass-card p-6 rounded-2xl border border-slate-800/60 animate-pulse space-y-4"
                  >
                    <div className="h-6 bg-slate-800 rounded-md w-3/4"></div>
                    <div className="h-4 bg-slate-800/60 rounded-md w-1/2"></div>
                    <div className="h-16 bg-slate-800/40 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : hospitals.length === 0 ? (
              <div className="glass-panel p-12 text-center rounded-3xl border border-slate-800">
                <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white mb-1">No Hospitals Found</h4>
                <p className="text-slate-400 text-xs max-w-md mx-auto mb-4 leading-relaxed">
                  No hospitals found in{' '}
                  <strong className="text-cyan-400">
                    {selectedArea || selectedDistrict || selectedState || 'this location'}
                  </strong>{' '}
                  yet. Try a nearby district or check back soon.
                </p>
                <button
                  onClick={() => {
                    setSelectedCountry('IN');
                    setSelectedState('');
                    setSelectedDistrict('');
                    setSelectedArea('');
                    setSearchQuery('');
                    setSelectedCrowd('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital._id}
                    className="glass-card p-6 rounded-2xl border border-slate-800/60 hover:border-cyan-500/40 flex flex-col justify-between transition-all group hover:-translate-y-1"
                  >
                    <div>
                      {/* Top Badges Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hospital.category === 'Government' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-extrabold">
                              <Landmark className="w-3 h-3 text-emerald-400" /> Government
                            </span>
                          ) : hospital.category === 'Clinic' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-extrabold">
                              <Stethoscope className="w-3 h-3 text-amber-400" /> Medical Clinic
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[11px] font-extrabold">
                              <Building className="w-3 h-3 text-indigo-400" /> Private Hospital
                            </span>
                          )}

                          {hospital.distanceKm !== undefined && (
                            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 text-[11px] font-semibold border border-cyan-500/20">
                              📍 ~{hospital.distanceKm} km
                            </span>
                          )}
                        </div>

                        {hospital.emergencyServices && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 text-[10px] font-bold border border-rose-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span> 24/7 Emergency
                          </span>
                        )}
                      </div>

                      {/* Hospital Name & Rating */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors leading-snug">
                          {hospital.name}
                        </h4>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold flex-shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{hospital.rating}</span>
                        </div>
                      </div>

                      {/* Address */}
                      <p className="text-slate-400 text-xs flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="truncate">{hospital.address}</span>
                      </p>

                      {/* Clickable Phone Number */}
                      {hospital.phone && (
                        <a
                          href={`tel:${hospital.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold mb-3 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{hospital.phone}</span>
                        </a>
                      )}

                      {/* Live Queue Metrics */}
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-4 text-xs">
                        <div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-400" /> Queue Length
                          </div>
                          <div className="font-bold text-white mt-0.5">
                            {hospital.currentQueueLength} patients
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" /> Avg Wait Time
                          </div>
                          <div className="font-bold text-cyan-300 mt-0.5">
                            ~{hospital.avgWaitTimeMinutes} mins
                          </div>
                        </div>
                      </div>

                      {/* Departments */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {hospital.departments &&
                          hospital.departments.slice(0, 3).map((dept, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-300 text-[11px] border border-slate-700/60"
                            >
                              {dept}
                            </span>
                          ))}
                        {hospital.departments && hospital.departments.length > 3 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 text-[11px]">
                            +{hospital.departments.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedHospital(hospital)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => setJoinHospital(hospital)}
                        className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Get Token</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Queue Ticket History */}
        {activeTab === 'history' && (
          <QueueHistoryTab
            onSelectActiveToken={(tok) => {
              setActiveToken(tok);
              setActiveTab('hospitals');
            }}
          />
        )}

        {/* TAB 3: Doctor Schedules */}
        {activeTab === 'doctors' && <DoctorSchedulesTab userRole={userRole} />}

        {/* TAB 4: Staff & Admin Management Portal */}
        {activeTab === 'staff' && (
          <AdminStaffDashboard onNotify={addNotification} />
        )}
      </main>

      {/* Hospital Detail Modal */}
      {selectedHospital && (
        <HospitalModal
          hospital={selectedHospital}
          onClose={() => setSelectedHospital(null)}
          onJoinQueue={(hosp) => setJoinHospital(hosp)}
        />
      )}

      {/* Join Queue Ticket Modal */}
      {joinHospital && (
        <JoinQueueModal
          hospital={joinHospital}
          onClose={() => setJoinHospital(null)}
          onSuccess={handleTokenIssued}
        />
      )}
    </div>
  );
};

export default DashboardPage;
