// RestoreBackup.js
import {useState} from "react";
import styled from "styled-components";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

// Styling for the component
const Container = styled.div`
  padding: 20px;
  font-family: Arial, sans-serif;
`;

const Title = styled.h1`
  color: #4a90e2;
  text-align: center;
  margin-bottom: 20px;
`;

const Subtitle = styled.h2`
  color: #333;
  margin-bottom: 10px;
`;

const Step = styled.p`
  color: #555;
  font-size: 18px;
  margin: 10px 0;
`;

const CodeBlock = styled.code`
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  display: block;
  margin-bottom: 20px;
`;

const Note = styled.p`
  font-size: 16px;
  font-style: italic;
  color: #888;
  margin-top: 10px;
`;
const files = ['10_Sep','11_Sep','12_Sep','13_Sep']
const RestoreBackup = () => {
  const [value, setValue] = useState('1');
  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const [selectedFile, setSelectedFile] = useState(files[0])
  return (
     
    
      
        <Box sx={{ width: '100%', typography: 'body1' }}>
          <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList onChange={handleChange} aria-label="lab API tabs example">
                <Tab label="Restoring" value="1" />
                <Tab label="backing up script" value="2" />
                <Tab label="Schedule of backing up / Cronjob" value="3" />
              </TabList>
            </Box>
            <TabPanel value="1"> 
              <Container>
      <Title>MongoDB Backup Restoration Guide</Title>
      <Subtitle>Steps to Restore a Backup:</Subtitle>

      <Step>1. Open the terminal on your server.</Step>
      <Step>2. Select the backup file you want to restore: <strong>Available Backups on Server :</strong><select onChange={(e) => {setSelectedFile(e.target.value)}}>
      {files.map((file, index) => (
        <option key={index} value={file}>
          {file}
        </option>
      ))}
    </select></Step> 
      <Step>3. Navigate to the directory where your backup file is stored:</Step>
     <CodeBlock>cd home/username/backups/{selectedFile}</CodeBlock>

      <Step>3. Run the following command to restore the backup:</Step>
      <CodeBlock>mongorestore --archive={selectedFile}/{selectedFile}.archive --db makerspace</CodeBlock>

      <Note>
        Note: Replace <strong>backup.archive</strong> with your actual backup file name and <strong>yourDatabaseName</strong> with your MongoDB database name.
      </Note>

      <Step>4. Wait for the process to complete. You will see a success message if the restore was successful.</Step>

      <Subtitle>How to Verify the Restore:</Subtitle>

      <Step>1. Open the MongoDB shell:</Step>
      <CodeBlock>mongo</CodeBlock>

      <Step>2. Switch to your restored database:</Step>
      <CodeBlock>use makerspace</CodeBlock>

      <Step>3. Verify that the data was restored by listing the collections:</Step>
      <CodeBlock>show collections</CodeBlock>

      <Step>4. Check the data in a collection:</Step>
      <CodeBlock>db.yourCollectionName.find().pretty()</CodeBlock>

      <Note>
        Tip: Make sure your MongoDB service is running before attempting to restore a backup.
      </Note>
    </Container>  </TabPanel>
            <TabPanel value="2"> 
              <Container>
      <Title>MongoDB Backup Script</Title>
      <Subtitle>Steps to See and Edit Script:</Subtitle>

      <Step>1. Open the terminal on your server.</Step>
      <Step>2. Go To the Directory where the script is stored</Step>
      <CodeBlock>cd /home/vboxuser</CodeBlock> 
      <Step>3. The Following command will open the backup script otherwise create a new one</Step>
      <CodeBlock>sudo mongo_backup.sh</CodeBlock>
      <Step>4. The following script should be there otherwise write it in vim </Step>
      <CodeBlock>#!/bin/bash<br/>

# Define the backup directory<br/>
BACKUP_DIR=&quot;/home/vboxuser/mongo_backups/$(date +\%Y-\%m-\%d_\%H-\%M-\%S)&quot;; <br/>
mkdir -p &quot;$BACKUP_DIR&quot;;<br/>

# Export the database to JSON format<br/>
mongodump --out &quot;$BACKUP_DIR&quot; --archive=&quot;$BACKUP_DIR/backup.archive&quot; --gzip;<br/>

# Optionally, you can export a specific database by adding --db makerspace<br/>
# mongodump --db makerspace --out &quot;$BACKUP_DIR&quot; --archive=&quot;$BACKUP_DIR/backup.archive&quot; --gzip;<br/>
</CodeBlock>
<Step>5. Save and exit the file (Ctrl+X, then Y, and Enter).</Step>
<Step>6. Make the script executable:</Step>
<CodeBlock>chmod +x /home/vboxuser/mongo_backup.sh
</CodeBlock>
      </Container> 
      </TabPanel>
            <TabPanel value="3"> <Container>
      <Title>Cron job Script</Title>
      <Subtitle>Steps to See and Edit Cronjob:</Subtitle>
<Note>Next, you'll set up a cron job to execute the backup script at your desired intervals.</Note>
    <Step>1. Open the crontab editor:</Step>
      <CodeBlock>crontab -e
      </CodeBlock>
      <Step>2. Add the following line to schedule the backup (modify the time as needed):</Step>
      <CodeBlock>0 2 * * * /home/vboxuser/mongo_backup.sh
      </CodeBlock>
      <Note>This example schedules the backup to run every day at 2:00 AM. <br/><br/>Here’s a breakdown of the cron job schedule:<br/>

0 2 * * *: This means at minute 0 of the 2nd hour (2:00 AM) every day.<br/>
/home/vboxuser/mongo_backup.sh: The path to the backup script.</Note>
<Step>3. Save and exit the crontab file.</Step>
<Step>4. Verify the Cron Job</Step>
<Note>To ensure your cron job is set up correctly, you can list all scheduled cron jobs:</Note>
<CodeBlock>crontab -l
</CodeBlock>
<Note>Your backups will be stored in the directory /home/vboxuser/mongo_backups/, organized by date and time.</Note>
      </Container></TabPanel>
          </TabContext>
        </Box>
  
    
  );
};

export default RestoreBackup;