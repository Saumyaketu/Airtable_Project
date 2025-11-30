import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { shouldShowQuestion } from '../utils/logicEngine';


const FormViewer = () => {
  const { formId } = useParams();
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/forms/${formId}`)
      .then(res => setForm(res.data))
      .catch(err => console.error(err));
  }, [formId]);

  const handleChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/forms/${formId}/submit`, { answers });
      alert('Submitted!');
    } catch (err) {
      alert(err.response?.data?.error || 'Error');
    }
  };

  if (!form) return <div>Loading...</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6 text-center">{form.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {form.questions.map((q) => {
          const isVisible = shouldShowQuestion(q.conditionalRules, answers);
          if (!isVisible) return null;

          return (
            <div key={q.questionKey}>
              <label className="block font-medium mb-1">
                {q.label} {q.required && <span className="text-red-500">*</span>}
              </label>
              
              {q.type === 'singleSelect' ? (
                <select 
                  className="w-full border p-2 rounded"
                  onChange={e => handleChange(q.questionKey, e.target.value)}
                >
                  <option value="">Select...</option>
                  {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  onChange={e => handleChange(q.questionKey, e.target.value)}
                />
              )}
            </div>
          );
        })}
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded mt-4">
          Submit
        </button>
      </form>
    </div>
  );
};

export default FormViewer;