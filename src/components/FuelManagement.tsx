import React, { useState, useEffect } from 'react';
import { Plus, Droplet, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { loadFuelOperations } from '../services/fuel';
import { FuelOperation } from '../types/fuel';
import { AddFuelOperation } from './AddFuelOperation';
import { FuelOperationDetail } from './FuelOperationDetail';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const FuelManagement: React.FC = () => {
  const { darkMode, isConfigured } = useSettingsStore();
  const [operations, setOperations] = useState<FuelOperation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<FuelOperation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState<string>();
  const [fuelBalances, setFuelBalances] = useState<Record<string, number>>({});

  const calculateFuelBalances = (ops: FuelOperation[]) => {
    const balances: Record<string, number> = {
      Diesel: 0,
      Petrol: 0
    };
    
    ops.forEach(op => {
      switch (op.type) {
        case 'Purchase':
          balances[op.fuelType] += op.amount;
          break;
        case 'Use':
        case 'Transfer to Bottle':
        case 'Transfer to Contractor':
          balances[op.fuelType] -= op.amount;
          break;
      }
    });

    setFuelBalances(balances);
  };

  const loadMoreOperations = async () => {
    if (!isConfigured || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await loadFuelOperations({ offset: currentOffset });
      const newOperations = currentOffset ? [...operations, ...result.operations] : result.operations;
      setOperations(newOperations);
      setCurrentOffset(result.offset);
      setHasMore(result.hasMore);
      calculateFuelBalances(newOperations);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load fuel operations';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured) {
      setCurrentOffset(undefined);
      setHasMore(true);
      loadMoreOperations();
    }
  }, [isConfigured]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
        !isLoading &&
        hasMore &&
        navigator.onLine
      ) {
        loadMoreOperations();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, currentOffset]);

  const handleDeleteOperation = async (id: string) => {
    // Implementation for delete operation
    const updatedOperations = operations.filter(op => op.id !== id);
    setOperations(updatedOperations);
    calculateFuelBalances(updatedOperations);
  };

  const handleUpdateOperation = async (updatedOperation: FuelOperation) => {
    // Implementation for update operation
    const updatedOperations = operations.map(op =>
      op.id === updatedOperation.id ? updatedOperation : op
    );
    setOperations(updatedOperations);
    calculateFuelBalances(updatedOperations);
  };

  if (!isConfigured) {
    return (
      <div className="text-center py-12">
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
          Please configure your Airtable connection in settings first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Fuel Management
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className={`inline-flex items-center px-4 py-2 rounded-lg ${
            darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Operation
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {Object.entries(fuelBalances).map(([fuelType, amount]) => (
          <div
            key={fuelType}
            className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                amount > 0
                  ? darkMode
                    ? 'bg-green-900/20 text-green-400'
                    : 'bg-green-100 text-green-600'
                  : darkMode
                    ? 'bg-red-900/20 text-red-400'
                    : 'bg-red-100 text-red-600'
              }`}>
                <Droplet className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {fuelType}
                </p>
                <p className={`text-lg font-bold ${
                  amount > 0
                    ? darkMode ? 'text-green-400' : 'text-green-600'
                    : darkMode ? 'text-red-400' : 'text-red-600'
                }`}>
                  {amount.toFixed(1)} L
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading && operations.length === 0 ? (
          <div className="text-center py-12">
            <RefreshCw className={`w-8 h-8 mx-auto mb-4 animate-spin ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              Loading operations...
            </p>
          </div>
        ) : operations.length === 0 ? (
          <div className="text-center py-12">
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              No fuel operations recorded yet
            </p>
          </div>
        ) : (
          <>
            {operations.map((operation) => (
              <div
                key={operation.id}
                className={`p-4 rounded-lg cursor-pointer ${darkMode ? 'bg-gray-800' : 'bg-white'} hover:bg-opacity-90`}
                onClick={() => setSelectedOperation(operation)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        operation.type === 'Purchase'
                          ? darkMode
                            ? 'bg-green-900/20 text-green-400'
                            : 'bg-green-100 text-green-600'
                          : operation.type === 'Use'
                            ? darkMode
                              ? 'bg-red-900/20 text-red-400'
                              : 'bg-red-100 text-red-600'
                            : darkMode
                              ? 'bg-blue-900/20 text-blue-400'
                              : 'bg-blue-100 text-blue-600'
                      }`}>
                        {operation.type}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {format(operation.date, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className={`mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {operation.amount.toFixed(1)} L of {operation.fuelType}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      By {operation.operator}
                    </p>
                    {operation.notes && (
                      <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {operation.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-center py-4">
                <RefreshCw className={`w-6 h-6 mx-auto animate-spin ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </div>
            )}
          </>
        )}
      </div>

      {showAddForm && (
        <AddFuelOperation onClose={() => setShowAddForm(false)} />
      )}

      {selectedOperation && (
        <FuelOperationDetail
          operation={selectedOperation}
          onClose={() => setSelectedOperation(null)}
          onDelete={handleDeleteOperation}
          onUpdate={handleUpdateOperation}
        />
      )}
    </div>
  );
};