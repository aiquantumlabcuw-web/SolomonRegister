const mongoose = require('mongoose');
const path = require('path');
const Schema = mongoose.Schema;
const fs = require('fs');

const ticketSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
    },
    department: {
        type: String,
        required: true,
    },
    ticketType: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    ticketID: {
        type: String,
    },
    status: {
        type: String,
        default: 'Open',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    attachments: { type: [String], default: [] },
    cloudLink: {
        type: [String],
        default: [],
    },
    lastChangedAt: {
        type: Date,
        default: Date.now
    }
});




const Ticket = mongoose.model('Ticket', ticketSchema);

async function cleanup() {
  try {
    const mongoURI = "mongodb+srv://ganeshkrishnagoud:Manga22%40!@cluster0.6yuwlzk.mongodb.net/Makerspace";
    
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');
    
    const currentDate = new Date();
    console.log('Searching for tickets closed before:', currentDate);
    
    const tickets = await Ticket.find({
      status: 'Closed',
      lastChangedAt: { $lt: currentDate }  // Tickets closed before current date
    }).lean();

    console.log(`Found ${tickets.length} tickets to delete`);

    for (const ticket of tickets) {
      console.log(`Found ticket: ${ticket.ticketID} with status ${ticket.status} and last changed at ${ticket.lastChangedAt}`);
      
      if (ticket.attachments && ticket.attachments.length > 0) {
        for (const attachment of ticket.attachments) {
          try {
            fs.unlinkSync(attachment);
            console.log(`Deleted attachment: ${attachment}`);
          } catch (err) {
            console.error(`Error deleting ${attachment}:`, err);
          }
        }
      }
      
      await Ticket.deleteOne({ _id: ticket._id });
      console.log(`Deleted ticket: ${ticket.ticketID}`);
    }

    console.log('Cleanup completed');
    
  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

cleanup().catch(console.error);
