function scheduleJob(startDate, durationDays) {
  if (typeof startDate === 'string') {
    startDate = new Date(startDate);
  } else if (startDate instanceof Date) {
    startDate = new Date(startDate.getTime());
  } else {
    throw new Error('Invalid start date');
  }
  if (isNaN(startDate)) {
    throw new Error('Invalid start date');
  }
  if (durationDays <= 0) {
    return [];
  }
  const result = [];
  while (result.length < durationDays) {
    const day = startDate.getDay(); // 0=Sun
    if (day !== 0) {
      result.push(startDate.toISOString().slice(0, 10));
    }
    startDate.setDate(startDate.getDate() + 1);
  }
  return result;
}

if (require.main === module) {
  const [start, days] = process.argv.slice(2);
  console.log(scheduleJob(start, parseInt(days, 10)));
}

module.exports = { scheduleJob };
