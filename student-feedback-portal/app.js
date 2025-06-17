const express    = require('express');
const bodyParser = require('body-parser');
const path       = require('path');
const mongoose   = require('mongoose');
require('dotenv').config();

const Feedback = require('./models/Feedback');

const app  = express();
const PORT = process.env.PORT || 3000;
const { ADMIN_USERNAME, ADMIN_PASSWORD, MONGODB_URI } = process.env;

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => res.render('index'));

app.post('/submit', async (req, res) => {
  try {
    const feedback = await Feedback.create(req.body);
    res.render('thankyou', { feedback });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error saving feedback.');
  }
});

app.post('/edit/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    const within5s = Date.now() - feedback.createdAt.getTime() < 5000;
    if (!within5s) {
      return res.send('<h2>⏰ Edit window expired.</h2><a href="/">Home</a>');
    }
    await Feedback.findByIdAndUpdate(req.params.id, req.body);
    res.send('<h2>✅ Feedback updated.</h2><a href="/">Home</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating feedback.');
  }
});

app.get('/admin', (_req, res) => res.render('admin'));

app.post('/admin', async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    return res.render('adminView', { feedbacks });
  }
  res.send('<h2>Access Denied</h2><a href="/admin">Try Again</a>');
});

app.post('/delete/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
    res.render('adminView', { feedbacks });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete feedback.');
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
