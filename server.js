const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const nodemailer = require('nodemailer');
const validator = require('validator');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const app = express();
const port = 8000;

app.use(bodyParser.json());
app.use(cors());
// OpenAI API setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.get('/', (req, res) => {
  res.send(
    '<h1>Welcome to the Email Service API</h1>' +
    '<p>Use a POST request to /calculate to send an email with a personalized health analysis</p>'
  );
})

// Endpoint to handle form submission
app.post('/calculate', async (req, res) => {
  const { type, inputs, email } = req.body;

  console.log('Received email:', email); // Debugging

  if (!email) {
    return res.status(400).json({ message: 'Email is required!' });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address!' });
  }

  try {
    // Generate a prompt for OpenAI
    const prompt = `Act as a health coach. Provide a detailed, motivational, and engaging analysis of the following health metrics. Use emojis, motivational quotes, and a friendly tone to connect with the user. Here are the metrics:\n\n${JSON.stringify(inputs)}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    const analysis = response.choices[0].message.content;

    // Send email with the analysis
    await sendEmail(email, analysis);

    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
});

// Function to send email
async function sendEmail(email, analysis) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '🌟 Your Personalized Health Analysis 🌟',
    text: analysis,
    html: `<div style="font-family: Arial, sans-serif; color: #333;">
             <h2 style="color: #3498db;">🌟 Your Health Analysis 🌟</h2>
             <p>${analysis.replace(/\n/g, '<br>')}</p>
             <p>Stay healthy and keep shining! 💪✨</p>
             <p>Warm regards,<br>Your Health Coach 🩺</p>
           </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});