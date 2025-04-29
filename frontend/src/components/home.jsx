import React from "react";
import { Link } from "react-router-dom";
import ChatPage from "./chat";

const Header = () => (
  <header className="bg-white shadow-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <img src="logo.png" alt="WX.ai Logo" className="h-16" />
      <nav className="space-x-4 text-sm font-semibold hidden md:flex">
        <a href="#about" className="hover:text-red-600">About</a>
        <a href="#services" className="hover:text-red-600">Services</a>
        <a href="#projects" className="hover:text-red-600">Projects</a>
        <a href="#contact" className="hover:text-red-600">Contact</a>
      </nav>
    </div>
  </header>
);

const Hero = () => (
  <section className="text-center py-20 sm:py-24 bg-white px-4">
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6">WorkPlace Xperience. Reimagined by AI.</h1>
      <p className="text-base sm:text-lg text-gray-700 mb-8">
        We design intelligent, emotionally aware WorkPlaces that adapt to your people, your culture, and your business—powered by design, data, and artificial intelligence.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <a href="https://wa.me/919035615972" target="_blank" className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition cursor-pointer">Let’s Talk</a>
        <Link to="/chat"><button className="bg-gray-200 text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-300 transition cursor-pointer">Experience Our AI</button></Link>
      </div>
    </div>
  </section>
);

const Features = () => (
  <section id="about" className="py-20 bg-gray-100 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">We’ve Evolved.</h2>
      <p className="mb-6">
        <strong>iWPS Global</strong> is now <strong><em>wX.ai</em></strong>. Same purpose, new identity — delivering next-gen workplace experiences powered by AI, design, and data.
      </p>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
        <li className="bg-white p-6 rounded-lg shadow">AI-Powered Space Planning</li>
        <li className="bg-white p-6 rounded-lg shadow">Experience Strategy</li>
        <li className="bg-white p-6 rounded-lg shadow">Bespoke Interior Architecture</li>
        <li className="bg-white p-6 rounded-lg shadow">Real-Time Space Optimization</li>
      </ul>
    </div>
  </section>
);

const Clients = () => (
  <section className="py-20 bg-white px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Trusted by Future-Forward Teams</h2>
      <a href="#cases" className="inline-block bg-black text-white px-6 py-3 rounded-md mb-6 hover:bg-red-700 transition">View Case Studies</a>
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="p-6 bg-gray-50 rounded-lg shadow">
          <strong className="block text-xl">C5i</strong>
          <small className="text-gray-600">Command xtecorns OI WorkPlaces</small>
        </div>
        <div className="p-6 bg-gray-50 rounded-lg shadow">
          <strong className="block text-xl">Elanco</strong>
          <small className="text-gray-600">Wellness-focused HQs</small>
        </div>
      </div>
    </div>
  </section>
);

const Callout = () => (
  <section className="py-20 bg-gray-100 px-4">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-4">Built for People. Enhanced by AI.</h2>
      <p className="mb-6">Book a free discovery call and let’s reimagine your WorkPlace.</p>
      <ul className="space-y-3 text-left max-w-md mx-auto">
        <li>✓ Every space is designed with intention.</li>
        <li>✓ Every decision is backed by insights.</li>
        <li>✓ Every WorkPlace is one-of-one.</li>
        <li>✓ We don’t do templates. We do transformation.</li>
      </ul>
    </div>
  </section>
);

const Vision = () => (
  <section className="py-20 bg-white px-4">
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
      <p className="mb-8">To redefine how people experience their workplace—blending design, AI, and emotion into every square foot.</p>

      <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
      <p className="mb-8">To build environments where people thrive, teams connect, and data drives every decision.</p>

      <h3 className="text-2xl font-semibold mb-4">What Makes Us Different</h3>
      <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        <li className="bg-gray-100 p-6 rounded-lg"> <strong>Design + AI = Impact:</strong> Cost-effective, future-ready workplaces</li>
        <li className="bg-gray-100 p-6 rounded-lg"> <strong>Bespoke Solutions:</strong> Tailored designs for organizations of any size</li>
        <li className="bg-gray-100 p-6 rounded-lg"> <strong>Emotionally Aware:</strong> Spaces crafted to engage senses and elevate well-being</li>
      </ul>
    </div>
  </section>
);

const Footer = () => (
  <footer id="call" className="bg-black text-white py-20 text-center px-4">
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Let’s Build the Future of Work Together</h2>
      <p className="mb-6">Book a free discovery call and let’s reimagine your WorkPlace.</p>
      <a
        href="https://wa.me/919035615972"
        className="inline-block bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-red-700 hover:text-white transition"
      >
        Book a Call
      </a>
    </div>
  </footer>
);

const App = () => (
  <div className="bg-gray-50 text-gray-900 font-[Inter]">
    <Header />
    <Hero />
    <Features />
    <Clients />
    <Callout />
    <Vision />
    <Footer />
  </div>
);

export default App;
