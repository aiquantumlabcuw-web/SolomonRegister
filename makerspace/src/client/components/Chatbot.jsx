import React, { useState, useEffect } from 'react';
import { FaCommentAlt, FaArrowDown, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  const navigate = useNavigate();

  const toggleChat = () => setIsOpen(!isOpen);

  const typeMessage = (message, delay = 0) => {
    let index = -1;
    setIsTyping(true);
    const interval = setInterval(() => {
      if (index < message.length) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { fromBot: true, text: prev[prev.length - 1].text + message[index] },
        ]);
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, delay);
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setMessages([{ fromBot: true, text: '' }]);
        typeMessage("Hello! Welcome to Maker's Space. How can I assist you today?");
      }, 5);
    }
  }, [isOpen]);

  const handleSendMessage = (e) => {
    if (e && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (input.trim() === '') return;

    // Add user input message
    let newMessages = [...messages, { fromBot: false, text: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Bot response logic based on input
    let botResponse = '';
    if (input.toLowerCase().includes('location')) {
      botResponse = "We are located at 123 Maker's Avenue, Concordia University. Visit us during working hours!";
    } else if (input.toLowerCase().includes('contact')) {
      botResponse = "You can reach us at +1 (262) 327-9422 or email us at computer.science.cuwaa@gmail.com.";
    } else if (input.toLowerCase().includes('services')) {
      botResponse = "At Maker's Space, we offer 3D printing, laser cutting, and design assistance. Let us know what you need!";
    } else if (input.toLowerCase().includes('hours')) {
      botResponse = "Our working hours are from 9 AM to 5 PM, Monday through Friday.";
    } else if (input.toLowerCase().includes('faq')) {
      botResponse = "Here are some common FAQs: \n1. What does priority field mean? \n2. How can I check the ticket status? \n3. How can I access ticket submission? \nPlease ask one!";
    } else if (input.toLowerCase().includes('priority field')) {
      botResponse = "Choose the priority level for your ticket based on urgency. Options range from low to high.";
    } else if (input.toLowerCase().includes('unable to submit query')) {
      botResponse = "Only registered users can submit tickets. Please register before submitting a ticket.";
    } else if (input.toLowerCase().includes('submit ticket')) {
      botResponse = "Click on the 'Submit Ticket' button to start the ticket submission process.";
    } else if (input.toLowerCase().includes('ticket status')) {
      botResponse = "Log in to your account to check the status of your tickets at any time.";
    } else if (input.toLowerCase().includes('register')) {
      botResponse = "You need to register to use this feature. Click the button below to register.";
    } else if (input.toLowerCase().includes('attach files')) {
      botResponse = "You can attach up to 5 files (max 10240KB). Allowed file types: jpg, jpeg, png, stl.";
    } else {
      botResponse = "Sorry, I didn't quite understand. Can you please clarify or ask about something else?";
    }

    // Add bot response with typing effect
    setTimeout(() => {
      setMessages([...newMessages, { fromBot: true, text: '' }]);
      typeMessage(botResponse);
    }, 500);
  };

  return (
    <div className="fixed bottom-4 right-4">
      {/* Chat Icon */}
      <button
        className="bg-gray-900 text-white p-4 rounded-full shadow-lg hover:bg-gray-700 transition"
        onClick={toggleChat}
        style={{ fontSize: '24px' }}
      >
        <FaCommentAlt />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white shadow-lg rounded-lg max-w-xs w-full p-4">
          <div className="flex justify-between items-center bg-gray-800 text-white p-2 rounded-t-lg">
            <h2 className="text-lg font-bold">Hi there 👋</h2>
            <button onClick={toggleChat}>
              <FaArrowDown />
            </button>
          </div>
          <div className="mt-4 mb-2 h-64 overflow-y-auto border-t border-gray-300 pt-2">
            {messages.map((msg, index) => (
              <div key={index} className={`mb-2 ${msg.fromBot ? 'text-left' : 'text-right'}`}>
                <span
                  className={`inline-block px-4 py-2 rounded-lg ${
                    msg.fromBot ? 'bg-gray-200 text-black' : 'bg-blue-600 text-white'
                  }`}
                >
                  {msg.text}
                  {/* Register button logic */}
                  {msg.text.includes('register') && (
                    <button
                      onClick={() => navigate('/signup')}
                      className="ml-2 bg-blue-600 text-white p-2 rounded-lg"
                    >
                      Register Here
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
          {isTyping && <div className="text-gray-500 text-sm">Typing...</div>}
          {/* Input */}
          <div className="flex items-center">
            <input
              className="flex-1 border rounded-lg p-2 focus:outline-none focus:ring"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={handleSendMessage}
            />
            <button className="ml-2 bg-blue-600 text-white p-2 rounded-full" onClick={sendMessage}>
              <FaArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
