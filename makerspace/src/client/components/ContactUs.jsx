import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import Loader from './Loader';
import Swal from 'sweetalert2';
import { FaEnvelope, FaPhoneAlt, FaMapMarkerAlt } from 'react-icons/fa';
import './ContactUs.css';
import GlobalConfig from "../../../config/GlobalConfig";

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', question: '' });
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef();
  const isXLScreen = window.innerWidth >= 2000;
  const isSmallScreen = window.innerWidth < 640; // Example for screens smaller than 640px

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleRecaptchaChange = (token) => setRecaptchaToken(token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!recaptchaToken) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please complete the reCAPTCHA', timer: 2500 });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${GlobalConfig.nodeUrl}/apicontact/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, recaptchaToken })
      });

      if (response.ok) {
        Swal.fire({ icon: 'success', title: 'Success', text: 'Your message has been sent!', timer: 2500 });
        setFormData({ name: '', email: '', question: '' });
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to send your message.', timer: 2500 });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'An error occurred. Please try again.', timer: 2500 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[100svh] bg-white py-8 px-4">
      {loading && <Loader />}

      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-slate-900">Contact Us</h1>
          <p className="text-slate-600 mt-1 sm:text-base">AI & Quantum Innovation Lab • Department of Computer Science</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Info + Map */}
          <div className="lg:col-span-2 bg-[#115175] text-white rounded-2xl shadow p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Get in touch</h2>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <FaEnvelope className='text-xl' />
                <div>
                  <div className="text-sm opacity-90">Email</div>
                  <a href="mailto:computer.science.cuwaa@gmail.com" className="text-white underline-offset-2 hover:underline">computer.science.cuwaa@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaPhoneAlt className='text-xl' />
                <div>
                  <div className="text-sm opacity-90">Phone</div>
                  <a href="tel:+12623279422" className="text-white">+1 (262) 327-9422</a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3">
              <div className="flex items-center justify-center gap-2 mb-2 text-slate-800">
                <FaMapMarkerAlt className='text-lg' />
                <h3 className='font-semibold'>Location</h3>
              </div>
              <div className="w-full h-52 sm:h-64 md:h-72">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d726.4879245930606!2d-87.91469205505777!3d43.25243410722831!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8804e757bf2136c3%3A0x1e466e14195bcc43!2sRobert%20W.%20Plaster%20Free%20Enterprise%20Center!5e0!3m2!1sen!2sus!4v1722831698351!5m2!1sen!2sus"
                  className='w-full h-full border border-blue-500 rounded-xl'
                  allowFullScreen="true"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm mt-2 text-center">
                Maker's Space Lab, Department of Computer Science, Concordia University of Wisconsin
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6">
            <h2 className="text-slate-900 text-lg sm:text-xl font-semibold mb-4">Ask us anything</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm text-slate-700 mb-1">Your Name</label>
                <input
                  id="name"
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  type="text"
                  name="name"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-slate-700 mb-1">Your Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="jane@example.edu"
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label htmlFor="question" className="block text-sm text-slate-700 mb-1">Your Question</label>
                <textarea
                  id="question"
                  name="question"
                  placeholder="How can we help?"
                  className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400 min-h-28"
                  value={formData.question}
                  onChange={handleChange}
                  required
                  rows={5}
                ></textarea>
              </div>

              <div
                style={{
                  height: isSmallScreen ? '40px' : isXLScreen ? '90px' : '70px',
                  transform: `scale(${isXLScreen ? 1.6 : isSmallScreen ? 0.4 : 0.9})`,
                  transformOrigin: '0 0',
                }}
              >
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey="6LfgryEqAAAAAAjgDC59sPicE-5035y8Xz32r2u5"
                  onChange={handleRecaptchaChange}
                />
              </div>

              <div className='pt-2'>
                <button type="submit" className="inline-flex items-center justify-center rounded-md bg-[#115175] px-4 py-2 text-white text-sm font-medium shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400">
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;