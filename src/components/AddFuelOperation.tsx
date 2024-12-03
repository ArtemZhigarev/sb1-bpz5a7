import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { createFuelOperation } from '../services/fuel';
import { FuelOperationType, FuelType, Operator } from '../types/fuel';
import toast from 'react-hot-toast';

interface AddFuelOperationProps {
  onClose: () => void;
}

export const AddFuelOperation: React.FC<AddFuelOperationProps> = ({ onClose }) => {
  const { darkMode } = useSettingsStore();
  const [type, setType] = useState<FuelOperationType>('Purchase');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelType, setFuelType] = useState<FuelType>('Diesel');
  const [operator, setOperator] = useState<Operator>('David');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    setIsSubmitting(true);
    try {
      await createFuelOperation({
        type,
        amount: parseFloat(amount),
        date: new Date(date),
        fuelType,
        operator,
        notes
      });
      toast.success('Fuel operation added successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to add fuel operation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-lg mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              New Fuel Operation
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Operation Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as FuelOperationType)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="Purchase">Purchase</option>
                <option value="Use">Use</option>
                <option value="Transfer to Bottle">Transfer to Bottle</option>
                <option value="Transfer to Contractor">Transfer to Contractor</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Fuel Type
              </label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Amount (Liters)
              </label>
              <input
                type="number"
                step="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder="Enter amount in liters"
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Operator
              </label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as Operator)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="David">David</option>
                <option value="Artem">Artem</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div className={`flex justify-end gap-3 px-6 py-4 border-t ${
            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                darkMode ? 'focus:ring-offset-gray-900' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Operation
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};