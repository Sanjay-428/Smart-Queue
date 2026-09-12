const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

const seedDoctors = async () => {
  try {
    const doctorCount = await Doctor.countDocuments();
    if (doctorCount > 0) {
      console.log(`[Seed Data] ${doctorCount} doctors already exist in database.`);
      return;
    }

    const hospitals = await Hospital.find();
    if (!hospitals || hospitals.length === 0) {
      console.log('[Seed Data] No hospitals found to assign doctors.');
      return;
    }

    const doctorsList = [
      {
        name: 'Dr. Sarah Jenkins',
        title: 'MD, Chief of Cardiology',
        specialty: 'Cardiology',
        roomNumber: 'Room 204 (Wing B)',
        status: 'On Duty',
        experienceYears: 16,
        shiftHours: '08:00 AM - 04:00 PM',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. Marcus Vance',
        title: 'MD, Senior Neurologist',
        specialty: 'Neurology',
        roomNumber: 'Room 312 (Wing A)',
        status: 'In Consultation',
        experienceYears: 12,
        shiftHours: '09:00 AM - 05:00 PM',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. Elena Rostova',
        title: 'MD, Pediatric Specialist',
        specialty: 'Pediatrics',
        roomNumber: 'Room 105 (Child Care)',
        status: 'On Duty',
        experienceYears: 9,
        shiftHours: '08:30 AM - 04:30 PM',
        avatar: 'https://images.unsplash.com/photo-1594824813566-78a933722a4d?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. Arthur Pendelton',
        title: 'MD, Trauma Lead',
        specialty: 'Emergency Care',
        roomNumber: 'ER Trauma Room 1',
        status: 'On Duty',
        experienceYears: 20,
        shiftHours: '24/7 Shift Rotation',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. Chloe Bennett',
        title: 'MD, Orthopedic Surgeon',
        specialty: 'Orthopedics',
        roomNumber: 'Room 408 (Surgical Block)',
        status: 'On Break',
        experienceYears: 11,
        shiftHours: '10:00 AM - 06:00 PM',
        avatar: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. Rajesh Patel',
        title: 'MD, General Medicine Specialist',
        specialty: 'General Medicine',
        roomNumber: 'Room 102 (OPD)',
        status: 'On Duty',
        experienceYears: 14,
        shiftHours: '09:00 AM - 06:00 PM',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. Samantha Reed',
        title: 'MD, Obstetrician & Gynecologist',
        specialty: 'Obstetrics & Gynecology',
        roomNumber: 'Room 215 (Maternity Block)',
        status: 'In Consultation',
        experienceYears: 15,
        shiftHours: '08:00 AM - 04:00 PM',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=300',
      },
      {
        name: 'Dr. David Kim',
        title: 'MD, Dermatologist',
        specialty: 'Dermatology',
        roomNumber: 'Room 118 (Skin Care)',
        status: 'Off Duty',
        experienceYears: 8,
        shiftHours: '01:00 PM - 08:00 PM',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      },
    ];

    const seededDoctors = [];
    let hospitalIndex = 0;

    for (const docData of doctorsList) {
      const targetHospital = hospitals[hospitalIndex % hospitals.length];
      hospitalIndex++;

      seededDoctors.push({
        ...docData,
        hospitalId: targetHospital._id,
        hospitalName: targetHospital.name,
      });
    }

    await Doctor.insertMany(seededDoctors);
    console.log(`[Seed Data] Successfully seeded ${seededDoctors.length} doctor profiles.`);
  } catch (error) {
    console.error('[Seed Data] Error seeding doctor records:', error.message);
  }
};

module.exports = seedDoctors;
