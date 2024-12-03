import { FuelOperation } from '../types/fuel';
import { useSettingsStore } from '../store/settingsStore';
import { env } from '../config/env';
import Airtable from 'airtable';

interface LoadFuelOperationsOptions {
  offset?: string;
  pageSize?: number;
}

interface LoadFuelOperationsResult {
  operations: FuelOperation[];
  offset?: string;
  hasMore: boolean;
}

export const loadFuelOperations = async ({ offset, pageSize = 25 }: LoadFuelOperationsOptions = {}): Promise<LoadFuelOperationsResult> => {
  if (!navigator.onLine) {
    throw new Error('Cannot load fuel operations while offline');
  }

  try {
    const { airtableToken } = useSettingsStore.getState();
    if (!airtableToken) {
      throw new Error('Airtable configuration is missing');
    }

    const base = new Airtable({ apiKey: airtableToken }).base(env.airtableBase);
    const table = base(env.fuelTable);

    const query: Airtable.SelectOptions = {
      pageSize,
      sort: [{ field: 'When', direction: 'desc' }],
      fields: [
        'Operation',
        'How Much in Leters',
        'When',
        'Fuel Type',
        'Who?',
        'Notes'
      ]
    };

    if (offset) {
      query.offset = offset;
    }

    const records = await table.select(query).all();
    const startIndex = 0;
    const endIndex = pageSize;
    const pageRecords = records.slice(startIndex, endIndex);
    
    const operations = pageRecords.map(record => ({
      id: record.id,
      type: record.get('Operation') as FuelOperation['type'],
      amount: record.get('How Much in Leters') as number,
      date: new Date(record.get('When') as string),
      fuelType: record.get('Fuel Type') as string,
      operator: record.get('Who?') as string,
      notes: record.get('Notes') as string
    }));

    return {
      operations,
      offset: records[endIndex]?.id,
      hasMore: endIndex < records.length
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load fuel operations: ${error.message}`);
    }
    throw new Error('Failed to load fuel operations: Unknown error');
  }
};

export const createFuelOperation = async (operation: Omit<FuelOperation, 'id'>): Promise<string> => {
  try {
    const { airtableToken } = useSettingsStore.getState();
    if (!airtableToken) {
      throw new Error('Airtable configuration is missing');
    }

    const base = new Airtable({ apiKey: airtableToken }).base(env.airtableBase);
    const table = base(env.fuelTable);
    
    const fields = {
      'Operation': operation.type,
      'How Much in Leters': operation.amount,
      'When': operation.date.toISOString().split('T')[0],
      'Fuel Type': operation.fuelType,
      'Who?': operation.operator,
      'Notes': operation.notes || ''
    };

    const record = await table.create(fields);
    return record.id;
  } catch (error) {
    console.error('Failed to create fuel operation:', error);
    throw error;
  }
};