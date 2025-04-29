// ChatPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [mobile, setMobile] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/user/requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history");
      }
    };
    fetchHistory();
  }, []);

  const handleSend = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/ai/chat",
        { input },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponse(res.data.output);
      setHistory([...history, { request_type: "text", input, output: res.data.output }]);
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setShowPopup(true);
      } else {
        alert("Something went wrong");
      }
    }
  };

  const handleContactSales = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/sales/contact",
        { message: `Please contact me, my mobile number is ${mobile}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Your message has been sent to our sales team.");
      setShowPopup(false);
    } catch (err) {
      alert("Failed to submit details");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col h-screen text-black bg-white">
      <div className="flex justify-between items-center p-4 border-b bg-gray-100">
        <h1 className="text-xl font-bold">AI Assistant</h1>
        <div className="space-x-4">
          <button onClick={handleHome} className="text-black hover:underline">Home</button>
          <button onClick={handleLogout} className="text-black hover:underline">Logout</button>
        </div>
      </div>

      <div className="flex flex-grow">
        <div className="w-1/4 border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Recent Requests</h2>
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li key={index} className="border p-2 rounded bg-gray-100">
                <div className="text-sm font-medium">{item.input}</div>
                <div className="text-xs text-gray-500">{item.output.slice(0, 50)}...</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-3/4 p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold">Chat with AI</h1>
          <textarea
            rows="4"
            className="border p-3 w-full"
            placeholder="Type your question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          ></textarea>
          <button
            onClick={handleSend}
            className="bg-black text-white px-4 py-2 rounded self-start"
          >
            Send
          </button>
          {response && (
            <div className="border p-4 rounded bg-gray-100">
              <h3 className="font-semibold">AI Response:</h3>
              <p>{response}</p>
            </div>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-2">Trial Limit Reached</h2>
            <p className="mb-4">Please contact our sales team to continue using our services.</p>
            <input
              placeholder="Your Mobile Number"
              className="p-2 border w-full mb-4"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
            <button
              onClick={handleContactSales}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Contact Sales Team
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
