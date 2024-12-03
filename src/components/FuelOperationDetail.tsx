import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2, Save, Trash2, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { FuelOperation, FuelOperationType, FuelType, Operator } from '../types/fuel';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface FuelOperationDetailProps {
  operation: FuelOperation;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (operation: FuelOperation) => void;
}

export const FuelOperationDetail: React.FC<FuelOperationDetailProps> = ({
  operation,
  onClose,
  onDelete,
  onUpdate
}) => {
  const { darkMode } = useSettingsStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedOperation, setEditedOperation] = useState<FuelOperation>(operation);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this operation?')) return;
    setIsDeleting(true);
    try {
      await onDelete(operation.id);
      toast.success('Operation deleted');
      onClose();
    } catch (error) {
      toast.error('Failed to delete operation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedOperation);
      toast.success('Operation updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update operation');
    } finally {
      setIsSaving(false);
    }
  };

  const currentOperation = isEditing ? editedOperation : operation;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Fuel Operation Details
            </h2>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-green-400 hover:bg-green-900/20'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Save className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedOperation(operation);
                    }}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-gray-400 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-blue-400 hover:bg-blue-900/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Edit2 className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-red-400 hover:bg-red-900/20'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Trash2 className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-gray-400 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Operation Type
                  </label>
                  <select
                    value={editedOperation.type}
                    onChange={(e) => setEditedOperation({
                      ...editedOperation,
                      type: e.target.value as FuelOperationType
                    })}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
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
                    value={editedOperation.fuelType}
                    onChange={(e) => setEditedOperation({
                      ...editedOperation,
                      fuelType: e.target.value as FuelType
                    })}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
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
                    value={editedOperation.amount}
                    onChange={(e) => setEditedOperation({
                      ...editedOperation,
                      amount: parseFloat(e.target.value)
                    })}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
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
                    value={format(editedOperation.date, 'yyyy-MM-dd')}
                    onChange={(e) => setEditedOperation({
                      ...editedOperation,
                      date: new Date(e.target.value)
                    })}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Operator
                  </label>
                  <select
                    value={editedOperation.operator}
                    onChange={(e) => setEditedOperation({
                      ...editedOperation,
                      operator: e.target.value as Operator
                    })}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
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
                    Notes
                  </label>
                  <textarea
                    value={editedOperation.notes || ''}
                    onChange={(e) => setEditedOperation({
                      ...editedOperation,
                      notes: e.target.value
                    })}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Operation Type
                      </dt>
                      <dd className={`mt-1 text-lg font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentOperation.type}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Fuel Type
                      </dt>
                      <dd className={`mt-1 text-lg font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentOperation.fuelType}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Amount
                      </dt>
                      <dd className={`mt-1 text-lg font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentOperation.amount.toFixed(1)} L
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Date
                      </dt>
                      <dd className={`mt-1 text-lg font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {format(currentOperation.date, 'MMM d, yyyy')}
                      </dd>
                    </div>
                    <div>
                      <dt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Operator
                      </dt>
                      <dd className={`mt-1 text-lg font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentOperation.operator}
                      </dd>
                    </div>
                  </dl>
                  {currentOperation.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <dt className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Notes
                      </dt>
                      <dd className={`mt-1 text-lg ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {currentOperation.notes}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};