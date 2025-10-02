import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import GlobalConfig from '../../../../config/GlobalConfig';

export default function StatusChart() {
  const [chartData, setChartData] = useState([['Status', 'Count']]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatusData = async () => {
      try {
        const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getCountByStatus`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch status data');
        }
        const data = await response.json();
        const formattedData = [['Status', 'Count']];
        data.forEach(item => {
          formattedData.push([item._id, item.count]);
        });
        setChartData(formattedData);
      } catch (error) {
        console.error('Chart fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatusData();
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Ticket Distribution
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <Chart
          chartType="PieChart"
          data={chartData}
          options={{
            title: 'Tickets By Status',
            pieHole: 0.4,
            tooltip: { trigger: 'focus' },
          }}
          width="100%"
          height="300px"
          loader={<div>Loading Chart...</div>}
        />
      )}
    </div>
  );
}
