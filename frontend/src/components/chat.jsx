import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const [history, setHistory] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [mobile, setMobile] = useState("");
  const [responseImage, setResponseImage] = useState("");
  const [form, setForm] = useState({
    length: "",
    width: "",
    roomType: "",
    style: "",
    workstations: "",
    notes: "",
  });

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSend = async () => {
    const prompt = `A ${form.style} ${form.roomType} room design of ${form.length}ft x ${form.width}ft with ${form.workstations} workstation(s). ${form.notes}`;
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/ai/image",
        { input: prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResponseImage(res.data.output); // expected to be image URL
      setHistory([...history, { request_type: "image", input: prompt, output: res.data.output }]);
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
        <h1 className="text-xl font-bold">Room Design Generator</h1>
        <div className="space-x-4">
          <button onClick={handleHome} className="text-black hover:underline">Home</button>
          <button onClick={handleLogout} className="text-black hover:underline">Logout</button>
        </div>
      </div>

      <div className="flex flex-grow">
        {/* Left sidebar - history */}
        <div className="w-1/4 border-r p-4 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Recent Requests</h2>
          <ul className="space-y-2">
            {history.map((item, index) => (
              <li key={index} className="border p-2 rounded bg-gray-100">
                <div className="text-sm font-medium">{item.input.slice(0, 40)}...</div>
              </li>
            ))}
          </ul>
        </div>

        {/* Main content */}
        <div className="w-3/4 p-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold mb-4">Enter Your Room Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="length" placeholder="Room Length (ft)" value={form.length} onChange={handleChange} className="border p-2" />
            <input name="width" placeholder="Room Width (ft)" value={form.width} onChange={handleChange} className="border p-2" />
            <input name="roomType" placeholder="Room Type (e.g., Office, Bedroom)" value={form.roomType} onChange={handleChange} className="border p-2" />
            <input name="style" placeholder="Design Style (e.g., Minimalist)" value={form.style} onChange={handleChange} className="border p-2" />
            <input name="workstations" placeholder="No. of Workstations" type="number" value={form.workstations} onChange={handleChange} className="border p-2" />
            <textarea name="notes" placeholder="Additional Notes (e.g., lighting preferences)" value={form.notes} onChange={handleChange} className="border p-2 col-span-full" />
          </div>

          <button onClick={handleSend} className="bg-black text-white px-4 py-2 rounded mt-4 w-fit">
            Generate Room Design
          </button>

          {responseImage && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Generated Design:</h3>
              <img src={responseImage} alt="Generated Room Design" className="w-full max-w-xl border rounded shadow" />
            </div>
          )}
        </div>
      </div>

      {/* Popup for trial limit */}
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
            <p className="mb-4">+91 94430</p>
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
