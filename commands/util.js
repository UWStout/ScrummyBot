import * as d3 from 'd3-time'

const dateFormatter = Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric'
})

export function formatDate (date) {
  return dateFormatter.format(date)
}

export function formatDuration (start, end = Date.now()) {
  // If start is a 'number' then use it as 'minutes'
  // If start is a 'Date' then use 'minutesBetween' to compute minutes
  let minutes = start
  if (typeof start === 'object' && start instanceof Date) {
    minutes = minutesBetween(start, end)
  }

  // Count the hours and minutes
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function minutesBetween (start, end = Date.now()) {
  // Create array of the minute boundaries between 'start' and 'end'
  // - The length of this array is the FLOOR of how many minutes have passed between these times
  return d3.timeMinute.range(start, end).length
}

export function mondaysBetween (start, end = Date.now()) {
  // How many monday boundaries between 'start' and 'end'
  return d3.timeMonday.range(start, end).length
}

// Entries in 'punches' must be sorted in 'in'/'out' pairs
export function sumPunches (punches) {
  let minutes = 0

  // Loop over all the in/out pairs and sum up their minutes
  let lastPunchIn = 0
  punches.forEach((entry) => {
    if (entry.punch === 'in') {
      lastPunchIn = entry.time
    } else {
      if (lastPunchIn instanceof Date) {
        minutes += minutesBetween(lastPunchIn, entry.time)
        lastPunchIn = 0
      }
    }
  })

  // Currently clocked in so add current minutes
  if (lastPunchIn instanceof Date) {
    minutes += minutesBetween(lastPunchIn, Date.now())
  }

  // Return minutes sum
  return minutes
}
