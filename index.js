const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require('bcrypt');
const fs = require("fs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const UserModel = require("./models/User"); 
const ListingModel = require("./models/Listing"); 
const CheckoutModel = require("./models/checkout"); 
const AccountDetailsModel = require("./models/AccountDetails");
const SubscriberModel = require("./models/Subscriber");
const AddressModel = require("./models/Address");
const BlogModel = require("./models/Blog");
const ContactModel = require("./models/ContactForm");
const CommentModel = require("./models/Comment");
const CompanyModel = require('./models/Company'); 
const UpcomingProject = require("./models/UpcomingProjects");
const NeighbourModel = require("./models/NeighbourModel");
const ReviewModel = require("./models/Review");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: ["https://creativedevops.com/real-estate-portfolio/"],
  methods: ["POST","GET"],
  credentials: true
}));

const port = process.env.PORT || 5000;
const baseURL = process.env.MONGO_URL;

// console.log('Email User:', process.env.EMAIL_USER);
// console.log('Email Pass:', process.env.EMAIL_PASS);

const connectDB = async () => {
  try {
    await mongoose.connect(baseURL);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

connectDB();

app.get("/", (req, res) => {
  res.send("Welcome to server");
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Find the user by email
    const user = await UserModel.findOne({ email: email });
    
    if (!user) {
      return res.status(404).json({ status: "Failure", message: "No record existed" });
    }
    
    // Compare the provided password with the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (isMatch) {
      res.status(200).json({
        status: "Success",
        user: {
          id: user._id,
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          username: user.username, // Ensure username is included if it exists in the UserModel
          phone: user.phone,
          address: user.address,
          profileImage: user.profileImage, // Ensure profileImage is included if it exists in the UserModel
        }
      });
    } else {
      res.status(401).json({ status: "Failure", message: "The credentials are incorrect" });
    }
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ status: "Error", message: "Internal Server Error" });
  }
});

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ensure these are set in your .env file
    pass: process.env.EMAIL_PASS,
  },
});

// Forgot Password Route
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).send('User with this email does not exist.');
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Save the token and expiry time to the user's record
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send the reset email
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
             Please click on the following link, or paste this into your browser to complete the process:\n\n
             ${resetUrl}\n\n
             If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).send('A password reset email has been sent to ' + user.email);
  } catch (error) {
    console.error('Error in forgot-password route:', error);
    res.status(500).send('Error sending password reset email');
  }
});

// Reset Password Route
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  console.log('Received token:', token);
  console.log('Received newPassword:', newPassword);

  try {
    const user = await UserModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send('Password reset token is invalid or has expired.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).send('Password has been reset successfully.');
  } catch (error) {
    console.error('Error in reset-password route:', error);
    res.status(500).send('Error resetting password.');
  }
});


// Register user
app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = await UserModel.create({ ...req.body, password: hashedPassword });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Listing property route
app.post("/listing", upload.array("files"), (req, res) => {
  const listingData = req.body;
  const files = req.files;

  listingData.images = [];
  listingData.pdfFile = null;

  files.forEach((file) => {
    if (file.mimetype.startsWith("image/")) {
      listingData.images.push(file.filename);
    } else if (file.mimetype === "application/pdf") {
      listingData.pdfFile = file.filename;
    }
  });

   // Parse JSON strings for array fields
   ['interiorDetails', 'outdoorDetails', 'utilities', 'otherFeatures'].forEach((field) => {
    if (listingData[field]) {
      try {
        listingData[field] = JSON.parse(listingData[field]);
      } catch (error) {
        return res.status(400).json({ error: `Invalid JSON for field: ${field}` });
      }
    }
  });

  ListingModel.create(listingData)
    .then((listing) => res.status(201).json(listing))
    .catch((err) => res.status(400).json(err));
});

// Fetch all listings
app.get("/listings", (req, res) => {
  ListingModel.find({})
    .then((listings) => res.status(200).json(listings))
    .catch((err) => res.status(400).json(err));
});


// Get a single listing by ID
app.get('/listings/:id', async (req, res) => {
  try {
    const listing = await ListingModel.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }
    res.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete listing by ID
app.delete('/listings/:id', (req, res) => {
  const listingId = req.params.id;
  ListingModel.findByIdAndDelete(listingId)
    .then(() => res.status(200).json({ message: 'Listing deleted successfully' }))
    .catch((err) => res.status(400).json(err));
});

// Update listing by ID
app.put('/listings/:id', upload.array('files'), (req, res) => {
  const { id } = req.params;
  const listingData = req.body;

  // Parse JSON strings for array fields
  ['interiorDetails', 'outdoorDetails', 'utilities', 'otherFeatures'].forEach((field) => {
    if (listingData[field]) {
      try {
        listingData[field] = JSON.parse(listingData[field]);
      } catch (error) {
        return res.status(400).json({ error: `Invalid JSON for field: ${field}` });
      }
    }
  });

  if (req.files) {
    listingData.images = req.files.map(file => file.filename);
  }

  ListingModel.findByIdAndUpdate(id, listingData, { new: true })
    .then(updatedListing => res.status(200).json(updatedListing))
    .catch(error => res.status(400).json({ error: 'Error updating listing', details: error }));
});

// Endpoint to list image files for a specific listing
app.get('/api/listings/:id/images', async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await ListingModel.findById(listingId);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const uploadsDir = path.join(__dirname, 'uploads');
    const imageFiles = fs.readdirSync(uploadsDir);

    // Filter images to only those listed in the database for the given listing
    const validImages = listing.images.filter(image => imageFiles.includes(image));

    if (validImages.length === 0) {
      return res.status(404).json({ message: 'No valid images found for this listing' });
    }

    res.json(validImages);
  } catch (error) {
    console.error('Error fetching listing images:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Post a new Review for a specific listing
app.post("/listing/:id/review", async (req, res) => {
  const { name, email, website, content } = req.body;
  const review = ReviewModel({
    listingId: req.params.id,
    name,
    email,
    website,
    content,
    date: new Date(),
  });
  try {
    const savedReview = await review.save();
    res.status(201).json(savedReview);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Fetch Review for a specific Listing
app.get("/listing/:id/review", async (req, res) => {
  try {
    const review = await ReviewModel.find({ listingId: req.params.id });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Change password endpoint
app.post('/change-password/:userId', (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  UserModel.findById(userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (user.password !== currentPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      user.password = newPassword;
      return user.save();
    })
    .then(() => res.status(200).json({ message: 'Password changed successfully!' }))
    .catch(error => {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    });
});

// Update user details route
app.put("/users/:id", upload.single("file"), async (req, res) => {
  const userId = req.params.id;
  const updateData = req.body;

  if (req.file) {
    updateData.profileImage = req.file.filename;
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const handleMultipartData = upload.single('profileImage');

// Create or update account details
app.post('/account-details', handleMultipartData, async (req, res) => {
  const { userId, fname, lname, username, email, phone, address } = req.body;
  const profileImage = req.file ? req.file.filename : null;

  try {
    let accountDetails = await AccountDetailsModel.findOne({ userId: userId });
    if (accountDetails) {
      accountDetails.fname = fname;
      accountDetails.lname = lname;
      accountDetails.username = username;
      accountDetails.email = email;
      accountDetails.phone = phone;
      accountDetails.address = address;
      if (profileImage) {
        accountDetails.profileImage = profileImage;
      }
      accountDetails = await accountDetails.save();
    } else {
      accountDetails = await AccountDetailsModel.create({
        userId,
        fname,
        lname,
        username,
        email,
        phone,
        address,
        profileImage,
      });
    }
    res.status(200).json(accountDetails);
  } catch (error) {
    console.error('Error updating account details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Get account details by user ID
app.get('/account-details/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const accountDetails = await AccountDetailsModel.findOne({ userId: userId });
    if (!accountDetails) {
      return res.status(404).json({ message: 'Account details not found' });
    }
    res.json(accountDetails);
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/checkout', (req, res) => {
  CheckoutModel.create(req.body)
    .then((savedCheckout) => res.status(201).json(savedCheckout))
    .catch((err) => {
      console.error('Error saving checkout:', err);
      res.status(400).json({ error: 'Error saving checkout' });
    });
});

app.get("/checkout", (req, res) => {
  CheckoutModel.find({})
    .then((checkout) => res.status(200).json(checkout))
    .catch((err) => res.status(400).json(err));
});

//News Letter
app.post('/subscribe', async (req, res) => {
  try {
    const subscriber = await SubscriberModel.create(req.body);
    res.status(201).json(subscriber);
  } catch (err) {
    console.error('Error subscribing:', err.message);
    res.status(400).json({ error: err.message });
  }
});

//Addresses
 
app.post("/address", (req, res) => {
  AddressModel.create(req.body)
    .then((user) => res.status(201).json(user))
    .catch((err) => res.status(400).json(err));
});

app.get("/address", (req, res) => {
  AddressModel.find({})
    .then((checkout) => res.status(200).json(checkout))
    .catch((err) => res.status(400).json(err));
});

// PUT route to update address
app.put('/address', (req, res) => {
  const { email, ...updatedAddress } = req.body;

  AddressModel.findOneAndUpdate(
    { email: email },
    { $set: updatedAddress },
    { new: true } // Return the updated document
  )
    .then((updatedAddress) => {
      if (!updatedAddress) {
        return res.status(404).json({ error: 'Address not found for the provided email' });
      }
      res.status(200).json(updatedAddress);
    })
    .catch((err) => {
      console.error('Error updating address:', err);
      res.status(500).json({ error: 'Error updating address' });
    });
});

app.post('/contact', (req, res) => {
  ContactModel.create(req.body)
  .then((user) => res.status(201).json(user))
  .catch((err) => res.status(400).json(err));
});

app.get("/contact", (req, res) => {
  ContactModel.find({})
    .then((contact) => res.status(200).json(contact))
    .catch((err) => res.status(400).json(err));
});

app.post("/add-blog", upload.single('file'), async (req, res) => {
  const { title, description, tags } = req.body;
  const bannerImage = req.file ? req.file.filename : null;

  if (!title || !description || !tags || !bannerImage) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const newBlog = new BlogModel({
      title,
      description,
      tags: tags.split(','),
      bannerImage,
    });

    await newBlog.save();
    res.status(201).json({ message: 'Blog created successfully!' });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// GET route to fetch all blogs
app.get('/blogs', async (req, res) => {
  try {
    const blogs = await BlogModel.find({}); // Fetch all blogs from the database
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blogs" });
  }
});

// Route to get a blog by ID
app.get('/blogs/:id', async (req, res) => {
  try {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Fetch comments for a specific blog
app.get("/blogs/:id/comments", async (req, res) => {
  try {
    const comments = await CommentModel.find({ blogId: req.params.id });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post a new comment for a specific blog
app.post("/blogs/:id/comments", async (req, res) => {
  const { name, email, website, content } = req.body;
  const comment = new CommentModel({
    blogId: req.params.id,
    name,
    email,
    website,
    content,
    date: new Date(),
  });
  try {
    const savedComment = await comment.save();
    res.status(201).json(savedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Post a reply to a comment
app.post('/comments/:commentId/reply', async (req, res) => {
  const { commentId } = req.params;
  const { name, email, website, content } = req.body;

  if (!name || !email || !content) {
    return res.status(400).json({ message: 'Name, email, and content are required.' });
  }

  try {
    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    const reply = {
      name,
      email,
      website,
      content,
      date: new Date()
    };

    comment.replies.push(reply);
    await comment.save();

    res.status(201).json(reply);
  } catch (error) {
    console.error('Error posting reply:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Company details route
app.post('/company', upload.single('file'), async (req, res) => {
  const { description, email, phone, address } = req.body;
  const logo = req.file ? req.file.filename : null;

  try {
    let company = await CompanyModel.findOne();
    if (company) {
      // Update existing company details
      company.description = description;
      company.email = email;
      company.phone = phone;
      company.address = address;
      if (logo) company.logo = logo;
    } else {
      // Create new company details
      company = new CompanyModel({
        description,
        email,
        phone,
        address,
        logo,
      });
    }
    await company.save();
    res.status(200).json(company);
  } catch (err) {
    console.error('Error saving company details:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get company details
app.get('/company', async (req, res) => {
  try {
    const company = await CompanyModel.findOne();
    if (!company) {
      return res.status(404).json({ message: 'Company details not found' });
    }
    res.json(company);
  } catch (err) {
    console.error('Error fetching company details:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to add a new upcoming project
app.post('/upcoming-projects', upload.single('file'), async (req, res) => {
  try {
    const { projectName, type, address, noOfApartments, investment } = req.body;
    const file = req.file ? req.file.filename : null;

    if (!projectName || !type || !address || !noOfApartments || !investment || !file) {
      return res.status(400).json({ message: 'All fields are required!' });
    }

    const newProject = new UpcomingProject({
      projectName,
      type,
      address,
      noOfApartments,
      investment,
      file,
    });

    await newProject.save();
    res.status(201).json({ message: 'Upcoming project added successfully!' });
  } catch (error) {
    console.error('Error adding upcoming project:', error);
    res.status(500).json({ message: 'An error occurred while adding the project. Please try again.' });
  }
});

// Route to fetch all upcoming projects
app.get('/upcoming-projects', async (req, res) => {
  try {
    const projects = await UpcomingProject.find({});
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching upcoming projects:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Route to add a new neighbor
app.post('/neighbour', upload.fields([{ name: 'banner_image', maxCount: 1 }, { name: 'inner_image', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, distance, description } = req.body;
    const files = req.files;
    
    const banner_image = files.banner_image ? files.banner_image[0].filename : null;
    const inner_image = files.inner_image ? files.inner_image[0].filename : null;

    if (!title || !distance || !description || !banner_image || !inner_image) {
      return res.status(400).json({ message: 'All fields are required!' });
    }

    const newNeighbor = new NeighbourModel({
      title,
      distance,
      description,
      banner_image,
      inner_image,
    });

    await newNeighbor.save();
    res.status(201).json({ message: 'Neighbor added successfully!' });
  } catch (error) {
    console.error('Error adding neighbor:', error);
    res.status(500).json({ message: 'An error occurred while adding the neighbor. Please try again.' });
  }
});


// GET route to fetch neighbourhood details
app.get('/neighbour', async (req, res) => {
  try {
    const neighbours = await NeighbourModel.find();
    res.status(200).json(neighbours);
  } catch (error) {
    console.error('Error fetching neighbourhood details:', error);
    res.status(500).json({ message: 'An error occurred while fetching neighbourhood details. Please try again.' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
