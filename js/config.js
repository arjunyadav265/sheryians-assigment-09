export const CONFIG = {
  pomodoro: {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    longBreakAfter: 4,
    autoStartBreaks: true,
    notify: true
  },
  planner: {
    startHour: 5,
    endHour: 23,
    saveDebounce: 400
  },
  weather: {
    forecastUrl: 'https://api.open-meteo.com/v1/forecast',
    geocodeUrl: 'https://geocoding-api.open-meteo.com/v1/search',
    reverseGeocodeUrl: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
    fallbackCity: 'London',
    refreshMinutes: 10,
    geoTimeoutMs: 8000,
    requestTimeoutMs: 9000
  },
  quotes: {
    endpoints: [
      { url: 'https://dummyjson.com/quotes/random', map: (d) => ({ text: d.quote, author: d.author }) },
      { url: 'https://api.quotable.io/random', map: (d) => ({ text: d.content, author: d.author }) },
      { url: 'https://zenquotes.io/api/random', map: (d) => ({ text: d[0].q, author: d[0].a }) }
    ],
    requestTimeoutMs: 8000,
    fallback: [
      { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
      { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
      { text: 'Do not wait to strike till the iron is hot; but make it hot by striking.', author: 'W. B. Yeats' },
      { text: 'Whether you think you can or you think you cannot, you are right.', author: 'Henry Ford' },
      { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Proverb' },
      { text: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
      { text: 'Everything you have ever wanted is on the other side of fear.', author: 'George Addair' },
      { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
      { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
      { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' }
    ]
  }
};