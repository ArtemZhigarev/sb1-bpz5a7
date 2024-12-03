import Airtable from 'airtable';
import { useSettingsStore } from '../store/settingsStore';
import { env } from '../config/env';
import { Task, TaskStatus, TaskImportance } from '../types/task';
import { Observation } from '../types/observation';
import { format, addDays, subDays, startOfDay } from 'date-fns';

interface LoadTasksOptions {
  offset?: string;
  pageSize?: number;
  filterType?: 'upcoming' | 'all' | 'today';
}

interface LoadTasksResult {
  tasks: Task[];
  offset?: string;
  hasMore: boolean;
}

interface LoadObservationsResult {
  observations: Observation[];
  offset?: string;
  hasMore: boolean;
}

const handleAirtableError = (error: any): never => {
  const errorDetails = {
    error,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    online: navigator.onLine,
    timestamp: new Date().toISOString()
  };

  console.error('Airtable operation details:', errorDetails);

  if (!navigator.onLine) {
    throw new Error('You are offline. Please try again when online.');
  }

  if (error instanceof Error) {
    throw new Error(`Airtable operation failed: ${error.message}`);
  }

  throw new Error('An unexpected error occurred while communicating with Airtable.');
};

export const initAirtable = (tableName?: string) => {
  const { airtableToken } = useSettingsStore.getState();
  
  if (!airtableToken) {
    throw new Error('Airtable configuration is missing');
  }

  const base = new Airtable({ apiKey: airtableToken }).base(env.airtableBase);
  return base(tableName || env.airtableTable);
};

export const fetchBases = async (token: string) => {
  try {
    const response = await fetch('https://api.airtable.com/v0/meta/bases', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch bases');
    }

    const data = await response.json();
    return data.bases.map((base: any) => ({
      id: base.id,
      name: base.name,
    }));
  } catch (error) {
    handleAirtableError(error);
  }
};

export const fetchTables = async (token: string, baseId: string) => {
  try {
    const response = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tables');
    }

    const data = await response.json();
    return data.tables.map((table: any) => ({
      id: table.id,
      name: table.name,
    }));
  } catch (error) {
    handleAirtableError(error);
  }
};

export const loadTasks = async ({ offset, pageSize = 25, filterType = 'today' }: LoadTasksOptions = {}): Promise<LoadTasksResult> => {
  if (!navigator.onLine) {
    throw new Error('Cannot load tasks while offline');
  }

  try {
    const table = initAirtable();
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);
    const sevenDaysFromNow = addDays(today, 7);

    const formatAirtableDate = (date: Date) => format(date, 'yyyy-MM-dd');

    let filterByFormula = '';
    switch (filterType) {
      case 'upcoming':
        filterByFormula = `AND(
          {To Do Date} >= '${formatAirtableDate(yesterday)}',
          {To Do Date} <= '${formatAirtableDate(sevenDaysFromNow)}',
          {Status} != 'Done'
        )`;
        break;
      case 'today':
        filterByFormula = `AND(
          IS_AFTER({To Do Date}, '${formatAirtableDate(subDays(today, 2))}'),
          IS_BEFORE({To Do Date}, '${formatAirtableDate(addDays(today, 2))}'),
          {Status} != 'Done'
        )`;
        break;
    }

    const query: Airtable.SelectOptions = {
      pageSize,
      sort: [
        { field: 'Importance', direction: 'desc' },
        { field: 'To Do Date', direction: 'asc' }
      ],
      fields: [
        'Task',
        'Notes',
        'Status',
        'To Do Date',
        'Completed Date',
        'Photos',
        'Repeated Task',
        'Repeat Every X Days',
        'Importance'
      ]
    };

    if (filterByFormula) {
      query.filterByFormula = filterByFormula;
    }

    if (offset) {
      query.offset = offset;
    }

    const records = await table.select(query).all();
    const startIndex = 0;
    const endIndex = pageSize;
    const pageRecords = records.slice(startIndex, endIndex);
    
    const tasks = pageRecords.map(record => ({
      id: record.id,
      title: record.get('Task') as string || '',
      description: record.get('Notes') as string || '',
      status: (record.get('Status') as TaskStatus) || 'To do',
      dueDate: new Date(record.get('To Do Date') as string || new Date()),
      completedDate: record.get('Completed Date') ? new Date(record.get('Completed Date') as string) : undefined,
      priority: 'medium',
      importance: (record.get('Importance') as TaskImportance) || 'normal',
      images: ((record.get('Photos') as any[]) || []).map(photo => photo.url),
      assigneeId: null,
      isRepeating: record.get('Repeated Task') as boolean || false,
      repeatEveryDays: record.get('Repeat Every X Days') as number || undefined
    }));

    return {
      tasks,
      offset: records[endIndex]?.id,
      hasMore: endIndex < records.length
    };
  } catch (error) {
    handleAirtableError(error);
  }
};

export const createTask = async (task: Omit<Task, 'id'>): Promise<string> => {
  try {
    const table = initAirtable();
    
    const fields = {
      'Task': task.title,
      'Notes': task.description,
      'Status': task.status,
      'To Do Date': task.dueDate.toISOString().split('T')[0],
      'Photos': task.images.map(url => ({ url })),
      'Repeated Task': task.isRepeating || false,
      'Repeat Every X Days': task.repeatEveryDays,
      'Importance': task.importance || 'normal'
    };

    const record = await table.create(fields);
    return record.id;
  } catch (error) {
    handleAirtableError(error);
  }
};

export const syncTask = async (task: Task): Promise<void> => {
  try {
    const table = initAirtable();
    
    const fields = {
      'Task': task.title,
      'Notes': task.description,
      'Status': task.status,
      'To Do Date': task.dueDate.toISOString().split('T')[0],
      ...(task.completedDate && {
        'Completed Date': task.completedDate.toISOString().split('T')[0]
      }),
      'Photos': task.images.map(url => ({ url })),
      'Repeated Task': task.isRepeating || false,
      'Repeat Every X Days': task.repeatEveryDays,
      'Importance': task.importance || 'normal'
    };

    await table.update(task.id, fields);
  } catch (error) {
    handleAirtableError(error);
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const table = initAirtable();
    await table.destroy(taskId);
  } catch (error) {
    handleAirtableError(error);
  }
};

export const loadObservations = async (options: { offset?: string; pageSize?: number } = {}): Promise<LoadObservationsResult> => {
  if (!navigator.onLine) {
    throw new Error('Cannot load observations while offline');
  }

  try {
    const table = initAirtable(env.observationsTable);
    const { offset, pageSize = 25 } = options;

    const query: Airtable.SelectOptions = {
      pageSize,
      sort: [{ field: 'Date', direction: 'desc' }],
      fields: [
        'Observation',
        'Notes',
        'Who Observed',
        'Related Tasks',
        'Date',
        'Photos'
      ]
    };

    if (offset) {
      query.offset = offset;
    }

    const records = await table.select(query).all();
    const startIndex = 0;
    const endIndex = pageSize;
    const pageRecords = records.slice(startIndex, endIndex);
    
    const observations = pageRecords.map(record => ({
      id: record.id,
      title: record.get('Observation') as string || '',
      description: record.get('Notes') as string || '',
      observer: record.get('Who Observed') as string || '',
      relatedTasks: record.get('Related Tasks') as string[] || [],
      date: new Date(record.get('Date') as string || new Date()),
      photos: ((record.get('Photos') as any[]) || []).map(photo => photo.url),
      type: 'other',
      severity: 'low'
    }));

    return {
      observations,
      offset: records[endIndex]?.id,
      hasMore: endIndex < records.length
    };
  } catch (error) {
    handleAirtableError(error);
  }
};

export const createObservation = async (observation: Omit<Observation, 'id'>): Promise<string> => {
  try {
    const table = initAirtable(env.observationsTable);
    
    const fields = {
      'Observation': observation.title,
      'Notes': observation.description,
      'Who Observed': observation.observer || '',
      'Date': observation.date.toISOString().split('T')[0],
      'Photos': (observation.photos || []).map(url => ({ url })),
      'Related Tasks': observation.relatedTasks || []
    };

    const record = await table.create(fields);
    return record.id;
  } catch (error) {
    handleAirtableError(error);
  }
};

export const updateObservation = async (observation: Observation): Promise<void> => {
  try {
    const table = initAirtable(env.observationsTable);
    
    const fields = {
      'Observation': observation.title,
      'Notes': observation.description,
      'Who Observed': observation.observer || '',
      'Date': observation.date.toISOString().split('T')[0],
      'Photos': (observation.photos || []).map(url => ({ url })),
      'Related Tasks': observation.relatedTasks || []
    };

    await table.update(observation.id, fields);
  } catch (error) {
    handleAirtableError(error);
  }
};

export const deleteObservation = async (observationId: string): Promise<void> => {
  try {
    const table = initAirtable(env.observationsTable);
    await table.destroy(observationId);
  } catch (error) {
    handleAirtableError(error);
  }
};