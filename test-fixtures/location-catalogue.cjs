// Frozen v335/956629b location copy and numeric rules for catalogue parity.
module.exports = [
  { id: 'street', name: 'Street', icon: '🌆', description: 'Chance encounters, small opportunities and unexpected trouble.', open: 0, close: 1440, travelMinutes: 60 },
  { id: 'station', name: 'Station', icon: '🚉', description: 'Crowds, benches and small chances to earn.', open: 0, close: 1440, travelMinutes: 65 },
  { id: 'shop', name: 'Small Shop', icon: '🛒', description: 'Affordable food, water and everyday supplies.', open: 420, close: 1320, travelMinutes: 10, travelRange: { min: 5, max: 15 } },
  { id: 'shelter', name: 'Night Shelter', icon: '🛏️', description: 'Overnight accommodation. Open from 18:00 until 08:00; places are limited.', open: 1080, close: 480, travelMinutes: 90 },
  { id: 'support', name: 'Help Center', icon: '🤝', description: 'Social workers can help with documents, benefits, accommodation and other support.', open: 480, close: 960, travelMinutes: 105 },
  { id: 'residential-shelter', name: 'Schronisko', icon: '🏠', description: '24/7 supported accommodation. Access requires a referral from Help Center.', open: 0, close: 1440, travelMinutes: 120 },
  { id: 'daycenter', name: 'Day Center', icon: '🧼', description: 'A warm place indoors with free showers, laundry and phone charging.', open: 480, close: 960, travelMinutes: 90 },
  { id: 'free-clinic', name: 'Free Clinic', icon: '🩺', description: 'Free basic medical care. No insurance needed.', open: 480, close: 960, travelMinutes: 90 },
  { id: 'hospital', name: 'Hospital', icon: '🏥', description: 'Regular medical care requires documents. Emergency care is available for critical conditions.', open: 480, close: 1080, travelMinutes: 105 },
  { id: 'jobcenter', name: 'Job Centre', icon: '📋', description: 'Vacancies and appointments.', open: 480, close: 900, travelMinutes: 105 },
  { id: 'work', name: 'Day Work', icon: '📦', description: 'Short shifts of physical work, paid when you finish.', open: 420, close: 1080, travelMinutes: 120 },
];
