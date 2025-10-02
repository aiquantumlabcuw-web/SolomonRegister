import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { PieChart , axisClasses } from '@mui/x-charts';
import Typography from '@mui/material/Typography';
import ClipLoader from 'react-spinners/ClipLoader';
import GlobalConfig from '../../../../config/GlobalConfig';
// import Title from './Title';

// Generate Sales Data


export default function Chart() {
  const [groupByStatus, setGroupByStatus] = useState([])
  const [groupByDept, setGroupByDept] = useState([])
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
    const response = await fetch(`${GlobalConfig.nodeUrl}/ticket/getCountByStatus`,{
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`, // Replace 'your-auth-token' with your actual token
        'Content-Type': 'application/json'
      }
    });
    const response1 = await fetch(`${GlobalConfig.nodeUrl}/ticket/getCountByDept`,{
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`, // Replace 'your-auth-token' with your actual token
        'Content-Type': 'application/json'
      }
    });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                if (!response1.ok) {
                  throw new Error('Network response was not ok');
                 }
                const data = await response.json();
                const data1 = await response1.json();
                
                setGroupByStatus(data);
                setGroupByDept(data1);
                setLoading(false);
}
fetchData();
},[])
   return (
<>
{loading ? (<ClipLoader color="#080f9c" loading={loading} size={50} />):(
    <div style={{height:"35vh",  display: 'grid', gridTemplateColumns: '1fr 2fr', width: 'max-content' }}>
    
      <div style={{ width:"max-content"}}>
      <Typography>Tickets By Status</Typography>

        <PieChart
          series={[
            {
              data: [...groupByStatus],
              cx: 100,
              cy: 70,
            },
          ]}
          colors={['#1F2937', '#105267', '#008087','#25AE8D', '#8BD77E', '#F9F871', '#000000' ]}
          width={350}
          height={150}
          
        />
      </div>
      <div style={{ width:"100%" }}>
      <Typography>Tickets By Department</Typography>
   
      <PieChart
          series={[
            {
              data: [...groupByDept],
              cx: 100,
              cy: 70,
            },
          ]}
          colors={['#1F2937', '#105267', '#008087','#25AE8D', '#8BD77E', '#F9F871', '#000000' ]}
          width={350}
          height={150}
          
        />
   </div>
     
    </div>
  )}
    </>
      
  );

}