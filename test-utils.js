const { getDRDateBounds, isDateInDRHoy } = require('./src/utils/date.utils.js');
console.log('Bounds for 2026-07-26:', getDRDateBounds('2026-07-26'));
console.log('Bounds for Hoy:', getDRDateBounds());
console.log('isDateInDRHoy for Quipes:', isDateInDRHoy(new Date('2026-07-27T00:37:35.000Z')));
