import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Building2,
  Clock,
  Calendar,
  Search,
  CheckCircle,
  AlertCircle,
  Briefcase,
  MapPin,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import api from '../api/axios';

export default function DoctorSchedulesTab({ userRole }) {
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors');
      if (response.data.success) {
        setDoctors(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/hospitals');
      if (response.data.success) {
        setHospitals(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching hospitals:', err);
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
  }, []);

  const handleUpdateDoctorStatus = async (doctorId, newStatus) => {
    try {
      const response = await api.put(`/doctors/${doctorId}/status`, { status: newStatus });
      if (response.data.success) {
        setDoctors((prev) =>
          prev.map((d) => (d._id === doctorId ? { ...d, status: newStatus } : d))
        );
      }
    } catch (err) {
      console.error('Error updating doctor status:', err);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesHospital =
      selectedHospital === 'All' || doc.hospitalId === selectedHospital;
    const matchesDepartment =
      selectedDepartment === 'All' ||
      doc.specialty?.toLowerCase().includes(selectedDepartment.toLowerCase());
    const matchesSearch =
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospitalName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesHospital && matchesDepartment && matchesSearch;
  });

  const isStaffOrAdmin = userRole === 'staff' || userRole === 'admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-cyan-400" />
            <span>Doctor Schedules & On-Duty Status</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Check real-time availability of specialists, room allocations, and shift schedules.
          </p>
        </div>
        <button
          onClick={fetchDoctors}
          className="self-start md:self-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors"
        >
          Refresh Schedules
        </button>
      </div>

      {/* Filter & Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search doctor by name or specialty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Hospital Filter */}
        <select
          value={selectedHospital}
          onChange={(e) => setSelectedHospital(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="All">All Hospital Facilities</option>
          {hospitals.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name}
            </option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="All">All Specialties / Departments</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Emergency Care">Emergency Care</option>
          <option value="Neurology">Neurology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="General Medicine">General Medicine</option>
          <option value="Obstetrics & Gynecology">Obstetrics & Gynecology</option>
        </select>
      </div>

      {/* Doctor Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Loading doctor schedules...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-2xl border border-slate-800">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <h3 className="text-sm font-semibold text-slate-200">No Doctors Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No active doctor schedules matching your search parameters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doctor) => {
            const isOnDuty = doctor.status === 'On Duty';
            const isInConsultation = doctor.status === 'In Consultation';
            const isOnBreak = doctor.status === 'On Break';
            const isOffDuty = doctor.status === 'Off Duty';

            return (
              <div
                key={doctor._id}
                className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Doctor Avatar & Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-700 shadow-md"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-100">{doctor.name}</h4>
                        <span className="text-xs text-cyan-400 font-medium">{doctor.specialty}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{doctor.title}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        isOnDuty
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isInConsultation
                          ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse'
                          : isOnBreak
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" /> Facility:
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                        {doctor.hospitalName}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1 text-slate-500" /> Room / OP:
                      </span>
                      <span className="font-mono text-cyan-300 font-semibold">{doctor.roomNumber}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> Shift Hours:
                      </span>
                      <span className="text-slate-300">{doctor.shiftHours}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Briefcase className="w-3.5 h-3.5 mr-1 text-slate-500" /> Experience:
                      </span>
                      <span className="text-slate-300">{doctor.experienceYears} Years</span>
                    </div>
                  </div>
                </div>

                {/* Staff Control / Quick Action */}
                <div className="mt-5 pt-3 border-t border-slate-800">
                  {isStaffOrAdmin ? (
                    <div>
                      <span className="block text-[10px] text-slate-500 uppercase font-semibold mb-1.5">
                        Staff Live Status Override
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => handleUpdateDoctorStatus(doctor._id, 'On Duty')}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${
                            isOnDuty
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          On Duty
                        </button>
                        <button
                          onClick={() => handleUpdateDoctorStatus(doctor._id, 'In Consultation')}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${
                            isInConsultation
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          Consulting
                        </button>
                        <button
                          onClick={() => handleUpdateDoctorStatus(doctor._id, 'On Break')}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${
                            isOnBreak
                              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          On Break
                        </button>
                        <button
                          onClick={() => handleUpdateDoctorStatus(doctor._id, 'Off Duty')}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${
                            isOffDuty
                              ? 'bg-slate-700 text-slate-200 border-slate-600 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          Off Duty
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        Available for Queue Tokens
                      </span>
                      <button
                        onClick={() => alert(`Consultation request noted for ${doctor.name}`)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg text-xs font-medium border border-slate-700/60 transition-colors"
                      >
                        Request OP
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
