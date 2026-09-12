import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown, RotateCcw, Search, Check, Globe } from 'lucide-react';
import api from '../api/axios';

export default function LocationSearchBar({ onLocationChange, onReset }) {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [selectedCountry, setSelectedCountry] = useState('IN'); // Default India
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedArea, setSelectedArea] = useState('');

  const [countriesLoading, setCountriesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);

  // 1. Load Countries on Mount
  useEffect(() => {
    const fetchCountries = async () => {
      setCountriesLoading(true);
      try {
        const response = await api.get('/locations/countries');
        if (response.data.success) {
          setCountries(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load countries:', err);
      } finally {
        setCountriesLoading(false);
      }
    };
    fetchCountries();
  }, []);

  // 2. Load States when Country changes
  useEffect(() => {
    if (!selectedCountry) {
      setStates([]);
      setSelectedState('');
      setDistricts([]);
      setSelectedDistrict('');
      return;
    }

    const fetchStates = async () => {
      setStatesLoading(true);
      try {
        const response = await api.get('/locations/states', {
          params: { countryCode: selectedCountry },
        });
        if (response.data.success) {
          setStates(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load states:', err);
      } finally {
        setStatesLoading(false);
      }
    };

    fetchStates();
    setSelectedState('');
    setDistricts([]);
    setSelectedDistrict('');
    setSelectedArea('');
  }, [selectedCountry]);

  // 3. Load Districts/Cities when State changes
  useEffect(() => {
    if (!selectedState) {
      setDistricts([]);
      setSelectedDistrict('');
      setSelectedArea('');
      return;
    }

    const fetchDistricts = async () => {
      setDistrictsLoading(true);
      try {
        const response = await api.get('/locations/districts', {
          params: { countryCode: selectedCountry, state: selectedState },
        });
        if (response.data.success) {
          setDistricts(response.data.data);
        }
      } catch (err) {
        console.error('Failed to load districts/cities:', err);
      } finally {
        setDistrictsLoading(false);
      }
    };

    fetchDistricts();
    setSelectedDistrict('');
    setSelectedArea('');
  }, [selectedState, selectedCountry]);

  // Handlers
  const handleCountryChange = (e) => {
    const val = e.target.value;
    setSelectedCountry(val);
    onLocationChange({ country: val, state: '', district: '', area: '' });
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setSelectedState(val);
    onLocationChange({ country: selectedCountry, state: val, district: '', area: '' });
  };

  const handleDistrictChange = (e) => {
    const val = e.target.value;
    setSelectedDistrict(val);
    onLocationChange({
      country: selectedCountry,
      state: selectedState,
      district: val,
      area: selectedArea,
    });
  };

  const handleAreaChange = (e) => {
    const val = e.target.value;
    setSelectedArea(val);
    onLocationChange({
      country: selectedCountry,
      state: selectedState,
      district: selectedDistrict,
      area: val,
    });
  };

  const handleClearFilters = () => {
    setSelectedCountry('IN');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedArea('');
    if (onReset) onReset();
  };

  const isFiltered = !!(selectedState || selectedDistrict || selectedArea);

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            World-wide Location Search
          </h3>
        </div>
        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Location</span>
          </button>
        )}
      </div>

      {/* 4-Connected Cascading Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Step 1: Select Country */}
        <div className="relative">
          <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
            1. Country
          </label>
          <div className="relative">
            <select
              value={selectedCountry}
              onChange={handleCountryChange}
              disabled={countriesLoading}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none appearance-none cursor-pointer transition-all disabled:opacity-50"
            >
              <option value="">-- All Countries --</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Step 2: Select State */}
        <div className="relative">
          <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
            2. State / Province
          </label>
          <div className="relative">
            <select
              value={selectedState}
              onChange={handleStateChange}
              disabled={!selectedCountry || statesLoading}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none appearance-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {statesLoading ? 'Loading States...' : '-- Select State --'}
              </option>
              {states.map((st) => (
                <option key={st.code || st.name} value={st.name}>
                  {st.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Step 3: Select District / City */}
        <div className="relative">
          <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
            3. City / District
          </label>
          <div className="relative">
            <select
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedState || districtsLoading}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none appearance-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedState
                  ? '-- Select State First --'
                  : districtsLoading
                    ? 'Loading Cities...'
                    : '-- Select City / District --'}
              </option>
              {districts.map((dist, idx) => (
                <option key={idx} value={dist.name}>
                  {dist.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Step 4: Area / Landmark Filter */}
        <div className="relative">
          <label className="block text-[10px] text-slate-400 font-semibold mb-1 uppercase tracking-wide">
            4. Local Area (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              value={selectedArea}
              onChange={handleAreaChange}
              placeholder="e.g. Adyar, Anna Nagar"
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none transition-all placeholder-slate-600"
            />
            <MapPin className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}

