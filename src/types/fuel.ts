export type FuelOperationType = 'Purchase' | 'Use' | 'Transfer to Bottle' | 'Transfer to Contractor';
export type FuelType = 'Diesel' | 'Petrol';
export type Operator = 'David' | 'Artem';

export interface FuelOperation {
  id: string;
  type: FuelOperationType;
  amount: number;
  date: Date;
  fuelType: FuelType;
  operator: Operator;
  notes?: string;
}