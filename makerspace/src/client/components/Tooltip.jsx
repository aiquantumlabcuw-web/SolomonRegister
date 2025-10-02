// Tooltip.jsx
import React, { useState } from 'react';

function Tooltip({ message, children }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-3/4 mt-2 w-max bg-gray-700 text-white text-xs rounded-md px-2 py-1 shadow-lg z-10">
          {message}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
