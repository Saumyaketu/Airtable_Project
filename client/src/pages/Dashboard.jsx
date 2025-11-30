import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    axios.get(`${import.meta.env.VITE_API_URL}/api/forms/my-forms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setForms(res.data))
    .catch(err => console.error(err));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Forms</h1>
          <Link 
            to="/create" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            + Create New Form
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
              <h2 className="text-xl font-bold mb-2">{form.title}</h2>
              <p className="text-gray-500 text-sm mb-4">
                Linked to: <span className="font-mono bg-gray-100 px-1 rounded">{form.airtableTableId}</span>
              </p>
              
              <div className="flex flex-col gap-2 mt-4">
                <Link 
                  to={`/form/${form._id}`} 
                  target="_blank"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  Open Live Form
                </Link>
                <Link 
                  to={`/forms/${form._id}/responses`}
                  className="text-green-600 hover:underline flex items-center gap-1"
                >
                  View Responses
                </Link>
              </div>
            </div>
          ))}
          
          {forms.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              You haven't created any forms yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;