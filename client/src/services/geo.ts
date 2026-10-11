// Weather interpretation helper based on WMO weather codes
function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy Atmosphere';
  if (code >= 51 && code <= 55) return 'Light Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 71 && code <= 77) return 'Snow Flurries';
  if (code >= 80 && code <= 82) return 'Heavy Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Gentle Breeze';
}

export async function fetchWeatherInfo(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('Weather API error');
    const data = await res.json();
    const current = data.current;
    const condition = interpretWeatherCode(Number(current.weather_code || 0));
    const temp = Math.round(Number(current.temperature_2m));
    const humidity = Math.round(Number(current.relative_humidity_2m));
    return `${condition} · ${temp}°C · ${humidity}% humidity`;
  } catch {
    return 'Weather unavailable';
  }
}

export async function reverseGeocodeLocation(latitude: number, longitude: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error('Geocoding error');
    const data = await res.json();
    const addr = data.address;
    if (addr) {
      const place = addr.natural || addr.park || addr.leisure || addr.suburb || addr.neighbourhood || addr.village;
      const city = addr.city || addr.town || addr.county || addr.state;
      if (place && city) return `${place}, ${city}`;
      if (place) return place;
      if (city) return city;
    }
    return `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`;
  } catch {
    return `${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°`;
  }
}
