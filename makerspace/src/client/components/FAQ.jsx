import React, { useState } from 'react';

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      question: 'What does priority field mean?',
      answer: 'Choose the priority level for your ticket from the dropdown based on your urgency. Priority options range from low to high.',
    },
    {
      question: 'Unable to submit a query?',
      answer: 'Only registered users can submit tickets. Please register on our site before submitting a ticket.',
    },
    {
      question: 'Information/Required Fields for Initiating a Ticket Submission',
      answer: 'You need to provide Email, Name, Role (dropdown), and detailed description of the issue.',
    },
    {
      question: 'What specific information should be incorporated within the description field?',
      answer: 'In the description field, describe the specific problem or query with as much detail as possible.',
    },
    {
      question: 'How can one access the ticket submission?',
      answer: 'Click on the “Submit Ticket” button to initiate the ticket submission process.',
    },
    {
      question: 'How can one check the ticket status?',
      answer: 'After submitting your ticket, log in to your account to check the status of all your tickets.',
    },
    {
      question: 'What are the requirements for attaching files to a query?',
      answer: 'It is optional. You can attach up to 5 files with a max size of 10240KB. Allowed extensions: jpg, jpeg, png, stl.',
    },
    {
      question: 'How to update my profile information?',
      answer: 'Go to your account settings and update your information such as email, password, and profile picture.',
    },
    {
      question: 'How to reset my password?',
      answer: 'Click on “Forgot Password” on the login page and follow the instructions to reset your password.',
    },
    {
      question: 'What is the response time for ticket queries?',
      answer: 'Our team responds to tickets within 24 to 48 hours, depending on the priority level you select.',
    },
    {
      question: 'Can I delete a submitted ticket?',
      answer: 'Once submitted, tickets cannot be deleted. You can close the ticket if your issue is resolved.',
    },
  ];

  const filteredFAQs = faqs.filter((faq) =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleAnswer = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="relative w-screen h-screen">
      {/* Background image */}
      <img
        src="/3D-Printing.jpg" // Replace with your image path
        alt="3D Printer"
        className="absolute inset-0 w-full h-full object-cover "
      />  
 
        <div className="relative z-10 flex justify-center items-center h-full">
        <div className=" bg-white p-6 sm:p-8 md:p-10 lg:p-12 xl:p-14 rounded-lg shadow-lg w-[88%] h-[80%] lg:w-[90%] overflow-y-auto">
          <h2 className="text-4xl font-bold text-center mb-2">FAQs</h2>
          <h3 className="text-xl font-semibold text-center mb-6">
            Find the answers for Frequently Asked Questions
          </h3>

          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-300 rounded-lg"
          />

          <div className=" max-h-[600px] sm:max-h-[400px]  md:max-h-[1000px] overflow-y-auto">
            {filteredFAQs.length > 0 ? (
              filteredFAQs.map((faq, index) => (
                <div key={index} className="mb-4">
                  <div
                    className={`p-4 border rounded-lg shadow-md cursor-pointer transition-all duration-300 ${
                      activeIndex === index
                        ? 'bg-blue-100 border-blue-500'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => toggleAnswer(index)}
                  >
                    <h3
                      className={`font-semibold text-sm sm:text-lg ${
                        activeIndex === index ? 'text-blue-800' : 'text-gray-800'
                      }`}
                    >
                      {faq.question}
                    </h3>
                  </div>
                  {activeIndex === index && (
                    <div className="mt-2 p-4">
                      <p className=" text-sm sm:text-base text-gray-700 transition-all duration-300">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No FAQs found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
   
  );
};

export default FAQ;