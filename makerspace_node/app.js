const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db.js');
const userRoutes = require('./routes/userRoutes.js');
const adminRoutes = require('./routes/adminRoutes.js');
const cors=require('cors')
const emailRoutes = require('./routes/emailRoutes.js')
const ticketRoutes = require('./routes/ticketRoutes.js');
const path = require('path');
const privilegeRoutes = require('./routes/privilegeRoutes');
const roleRoutes = require('./routes/roleRoutes');
const contactRoutes = require('./routes/contact'); 

// const key= require("./config/secret.js");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
require('dotenv').config();
const multer = require('multer');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const app = express();
const store = new MongoDBStore({
  uri: process.env.URI,
  collection: "sessions",
});

// Connect to MongoDB
connectDB();

app.set('trust proxy', true);
console.log('proxy set')

// Configure CORS to allow credentials (cookies) from the frontend
app.use(
  cors({
    origin: ["https://cuwcs.com/","http://cuwcs.com/","http://localhost:5174", "http://localhost:5173","http://localhost:5050", "http://72.167.47.19:5050", "https://72.167.47.19:443", "https://72.167.47.19:5050", "https://72.167.47.19","https://www.cuwcs.com/","cuwcs.com/"], // React app's origin
    credentials: true, // Allow cookies to be sent with requests
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  })
);

// Middleware
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

 

app.use(
  session({
    secret: "makerspace",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);
// Routes
app.use("/api", userRoutes);
app.use("/admin",adminRoutes)
app.use("/mail", emailRoutes);
app.use('/ticket',ticketRoutes);
app.get('/uploads/:filename', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'uploads', req.params.filename));
  });
app.use('/privilege', privilegeRoutes);
app.use('/role', roleRoutes);
app.use('/apicontact', contactRoutes);  

app.get("/", (req, res) => {
  res.send("Welcome to the Makerspace API");
});
// Start the server
app.use(cors()); // Allow cross-origin requests
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Node Server is running on http://localhost:${PORT}`);
});

// Error handling
app.on("error", (error) => {
  console.error(`Server error: ${error.message}`);
});
