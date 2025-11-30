import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const ResponseViewer = () => {
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${import.meta.env.VITE_API_URL}/api/forms/${formId}/responses`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setResponses(res.data);
      setLoading(false);
    })
    .catch(err => console.error(err));
  }, [formId]);

  if (loading) return <div className="p-8">Loading responses...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h1 className="text-2xl font-bold">Form Responses</h1>
          <Link to="/dashboard" className="text-gray-600 hover:text-black">← Back to Dashboard</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 border-b font-semibold">Submitted At</th>
                <th className="p-4 border-b font-semibold">Status</th>
                <th className="p-4 border-b font-semibold">Answers Preview (JSON)</th>
                <th className="p-4 border-b font-semibold">Airtable ID</th>
              </tr>
            </thead>
            <tbody>
              {responses.map(res => (
                <tr key={res._id} className="hover:bg-gray-50">
                  <td className="p-4 border-b text-sm">
                    {new Date(res.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      res.status === 'deletedInAirtable' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                  <td className="p-4 border-b text-sm font-mono text-gray-600 max-w-xs truncate">
                    {JSON.stringify(res.answers)}
                  </td>
                  <td className="p-4 border-b text-sm text-gray-500">
                    {res.airtableRecordId}
                  </td>
                </tr>
              ))}
              {responses.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No responses yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResponseViewer;