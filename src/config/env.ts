interface EnvConfig {
  airtableToken: string;
  airtableBase: string;
  airtableTable: string;
  observationsTable: string;
  fuelTable: string;
  telegramBotToken: string;
}

export const env: EnvConfig = {
  airtableToken: import.meta.env.VITE_AIRTABLE_TOKEN || '',
  airtableBase: import.meta.env.VITE_AIRTABLE_BASE || '',
  airtableTable: import.meta.env.VITE_AIRTABLE_TABLE || '',
  observationsTable: import.meta.env.VITE_AIRTABLE_OBSERVATIONS_TABLE || '',
  fuelTable: import.meta.env.VITE_AIRTABLE_FUEL_TABLE || '',
  telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''
};