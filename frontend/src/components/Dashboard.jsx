// components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const token = localStorage.getItem("token");

  const fetchHistory = async () => {
    const res = await axios.get("http://localhost:5000/api/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setHistory(res.data);
  };

  const handleSubmit = async () => {
    const res = await axios.post(
      "http://localhost:5000/api/ai/chat",
      { input },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setOutput(res.data.output);
    fetchHistory();
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="flex h-screen">
      <aside className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h2 className="font-bold mb-4">Recent Requests</h2>
        <ul>
          {history.map((req, idx) => (
            <li key={idx} className="mb-2 text-sm">{req.input}</li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-4">
        <h2 className="text-xl font-bold mb-4">Ask ChatGPT</h2>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full p-2 border mb-4"
          rows={5}
          placeholder="Enter your prompt..."
        ></textarea>
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
        {output && (
          <div className="mt-4 p-4 border bg-white rounded">
            <h3 className="font-semibold">Response:</h3>
            <p>{output}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;