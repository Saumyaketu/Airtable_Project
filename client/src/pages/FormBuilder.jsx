import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

const FormBuilder = () => {
  const navigate = useNavigate();
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedBase, setSelectedBase] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [fields, setFields] = useState([]);
  const [selectedFields, setSelectedFields] = useState([]);
  const [formTitle, setFormTitle] = useState('New Form');

  useEffect(() => {
    api.get('/forms/bases').then(res => setBases(res.data));
  }, []);

  const handleBaseChange = async (e) => {
    const baseId = e.target.value;
    setSelectedBase(baseId);
    const res = await api.get(`/forms/bases/${baseId}/tables`);
    setTables(res.data);
  };

  const handleTableChange = async (e) => {
    const tableId = e.target.value;
    setSelectedTable(tableId);
    const table = tables.find(t => t.id === tableId);
    if(table) setFields(table.fields);
  };

  const toggleField = (field) => {
    if (selectedFields.find(f => f.id === field.id)) {
      setSelectedFields(selectedFields.filter(f => f.id !== field.id));
    } else {
      setSelectedFields([...selectedFields, {
        ...field,
        questionKey: crypto.randomUUID(),
        required: false,
        conditionalRules: { logic: 'AND', conditions: [] }
      }]);
    }
  };

  const updateFieldConfig = (index, key, value) => {
    const updated = [...selectedFields];
    updated[index][key] = value;
    setSelectedFields(updated);
  };

  const addCondition = (index) => {
    const updated = [...selectedFields];
    updated[index].conditionalRules.conditions.push({
      questionKey: selectedFields[0]?.questionKey,
      operator: 'equals',
      value: ''
    });
    setSelectedFields(updated);
  };

  const updateCondition = (fieldIndex, condIndex, key, value) => {
    const updated = [...selectedFields];
    updated[fieldIndex].conditionalRules.conditions[condIndex][key] = value;
    setSelectedFields(updated);
  };

  const saveForm = async () => {
    if (!selectedBase || !selectedTable) {
      alert("Please select a Base and a Table first.");
      return;
    }
    if (selectedFields.length === 0) {
      alert("Please add at least one question to the form.");
      return;
    }
    const payload = {
      baseId: selectedBase,
      tableId: selectedTable,
      title: formTitle,
      questions: selectedFields.map(f => ({
        questionKey: f.questionKey,
        airtableFieldId: f.id,
        label: f.name,
        type: f.type,
        options: f.options?.choices?.map(c => c.name) || [],
        required: f.required,
        conditionalRules: f.conditionalRules
      }))
    };

    try {
      await api.post('/forms', payload);
      alert('Form saved successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Error saving form');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Form</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input className="border p-2" placeholder="Form Title" value={formTitle} onChange={e => setFormTitle(e.target.value)} />
        <select className="border p-2" onChange={handleBaseChange}>
          <option>Select Base</option>
          {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="border p-2" onChange={handleTableChange} disabled={!selectedBase}>
          <option>Select Table</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="mb-6">
        <h3 className="font-bold mb-2">Available Fields</h3>
        <div className="flex flex-wrap gap-2">
          {fields.map(f => (
            <button 
              key={f.id} 
              onClick={() => toggleField(f)}
              className={`px-3 py-1 rounded border ${selectedFields.find(sf => sf.id === f.id) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {selectedFields.map((field, idx) => (
          <div key={field.id} className="border p-4 rounded bg-white shadow">
            <div className="flex justify-between mb-2">
              <span className="font-bold">{field.name} ({field.type})</span>
              <label>
                <input type="checkbox" checked={field.required} onChange={e => updateFieldConfig(idx, 'required', e.target.checked)} /> Required
              </label>
            </div>
            
            <div className="bg-gray-50 p-2 text-sm mt-2">
              <p>Conditional Logic</p>
              {field.conditionalRules.conditions.map((cond, cIdx) => (
                <div key={cIdx} className="flex gap-2 mt-1">
                  <select 
                    className="border"
                    value={cond.questionKey} 
                    onChange={e => updateCondition(idx, cIdx, 'questionKey', e.target.value)}
                  >
                    {selectedFields.map(sf => (
                      <option key={sf.questionKey} value={sf.questionKey}>{sf.name}</option>
                    ))}
                  </select>
                  <select 
                    className="border"
                    value={cond.operator}
                    onChange={e => updateCondition(idx, cIdx, 'operator', e.target.value)}
                  >
                    <option value="equals">Equals</option>
                    <option value="notEquals">Not Equals</option>
                  </select>
                  <input 
                    className="border p-1" 
                    placeholder="Value" 
                    value={cond.value} 
                    onChange={e => updateCondition(idx, cIdx, 'value', e.target.value)}
                  />
                </div>
              ))}
              <button onClick={() => addCondition(idx)} className="text-blue-500 text-xs mt-1">+ Add Condition</button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={saveForm} className="mt-6 bg-green-600 text-white px-6 py-3 rounded font-bold w-full">
        Save Form
      </button>
    </div>
  );
};

export default FormBuilder;