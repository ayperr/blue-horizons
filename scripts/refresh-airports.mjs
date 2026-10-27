import { writeFile } from 'node:fs/promises';
const codes = new Set(['JFK','BOS','FLL','MCO','SJU','NAS','CUN','AUA','SXM','BGI','LHR','CDG','LAX','SFO']);
const source = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const response = await fetch(source);
if (!response.ok) throw new Error('Airport download failed');
// RFC 4180 reader, including quoted commas, escaped quotes and embedded newlines.
function parseCSV(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && quoted && text[i+1] === '"') { field += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if (c === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const [headers, ...rows] = parseCSV(await response.text());
const result = rows.map(row => Object.fromEntries(headers.map((key, i) => [key, row[i]])))
  .filter(row => codes.has(row.iata_code))
  .map(row => ({ code: row.iata_code, name: row.name, city: row.municipality,
    latitude: Number(row.latitude_deg), longitude: Number(row.longitude_deg), country: row.iso_country }));
if (new Set(result.map(a => a.code)).size !== codes.size) throw new Error('Airport data incomplete');
await writeFile(new URL('../lib/airports.json', import.meta.url), JSON.stringify({ source, license: 'Public domain', retrievedAt: new Date().toISOString(), airports: result }, null, 2) + '\n');
console.log(`Saved ${result.length} airports from OurAirports.`);
