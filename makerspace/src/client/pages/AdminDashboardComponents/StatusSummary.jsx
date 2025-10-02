import React, { useState, useEffect } from 'react';
import ClipLoader from 'react-spinners/ClipLoader';
import GlobalConfig from '../../../../config/GlobalConfig';

export default function StatusSummary() {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getCountByStatus`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch status data');
        }
        const data = await response.json();
        // data should look like:
        // [ { id: "Open", value: 5, label: "Open" }, { id: "In Progress", value: 10, label: "In Progress" }, ... ]

        setStatusData(data);
      } catch (error) {
        console.error('StatusSummary fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusData();
  }, []);

  if (loading) {
    return <ClipLoader color="#080f9c" loading={loading} size={50} />;
  }

  if (!statusData || statusData.length === 0) {
    return <p>No ticket status data available</p>;
  }

  return (
    <div style={{ lineHeight: '1.6' }}>
      {statusData.map((item) => (
        <div key={item.id}>
          {item.id}: {item.value}
        </div>
      ))}
    </div>
  );
}
