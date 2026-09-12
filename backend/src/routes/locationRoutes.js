const express = require('express');
const { Country, State, City } = require('country-state-city');

const router = express.Router();

/**
 * @route   GET /api/locations/countries
 * @desc    Get list of all countries worldwide
 * @access  Public
 */
router.get('/countries', (req, res) => {
  try {
    const countries = Country.getAllCountries().map((c) => ({
      code: c.isoCode,
      name: c.name,
      flag: c.flag,
    }));
    return res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching countries.',
    });
  }
});

/**
 * @route   GET /api/locations/states
 * @desc    Get list of states/provinces for a given country (default 'IN' India)
 * @access  Public
 */
router.get('/states', (req, res) => {
  try {
    const countryCode = (req.query.countryCode || req.query.country || 'IN').toUpperCase();

    // If countryCode is 2 chars (e.g. 'IN', 'US'), query by ISO code, otherwise match name
    let countryIso = countryCode;
    if (countryCode.length > 2) {
      const foundC = Country.getAllCountries().find(
        (c) => c.name.toLowerCase() === countryCode.toLowerCase()
      );
      if (foundC) countryIso = foundC.isoCode;
    }

    const statesList = State.getStatesOfCountry(countryIso).map((s) => ({
      code: s.isoCode,
      name: s.name,
      countryCode: s.countryCode,
    }));

    return res.status(200).json({
      success: true,
      data: statesList,
    });
  } catch (error) {
    console.error('Error fetching states:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching states.',
    });
  }
});

/**
 * @route   GET /api/locations/districts
 * @desc    Get list of cities/districts for a given country and state
 * @access  Public
 */
router.get('/districts', (req, res) => {
  try {
    const countryCode = (req.query.countryCode || req.query.country || 'IN').toUpperCase();
    const { stateCode, state } = req.query;

    let countryIso = countryCode;
    if (countryCode.length > 2) {
      const foundC = Country.getAllCountries().find(
        (c) => c.name.toLowerCase() === countryCode.toLowerCase()
      );
      if (foundC) countryIso = foundC.isoCode;
    }

    let targetStateCode = stateCode;

    // If state name passed instead of state code (e.g. "Tamil Nadu"), resolve state code
    if (!targetStateCode && state) {
      const allStates = State.getStatesOfCountry(countryIso);
      const matchedState = allStates.find(
        (s) => s.name.toLowerCase() === state.toLowerCase() || s.isoCode.toLowerCase() === state.toLowerCase()
      );
      if (matchedState) {
        targetStateCode = matchedState.isoCode;
      }
    }

    if (!targetStateCode) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const cities = City.getCitiesOfState(countryIso, targetStateCode).map((c) => ({
      name: c.name,
      lat: c.latitude,
      lng: c.longitude,
      stateCode: c.stateCode,
    }));

    return res.status(200).json({
      success: true,
      data: cities,
    });
  } catch (error) {
    console.error('Error fetching districts/cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching districts/cities.',
    });
  }
});

module.exports = router;

