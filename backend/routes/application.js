const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const jsPDF = require('jspdf');

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Files only!');
    }
  }
});

// Add application
router.post('/', auth, upload.fields([{ name: 'profilePicture' }, { name: 'markSheet' }]), async (req, res) => {
  const { name, mobile, email, gender, applicationAmount } = req.body;
  const profilePicture = req.files.profilePicture[0].path;
  const markSheet = req.files.markSheet[0].path;

  try {
    const newApplication = new Application({
      name,
      mobile,
      email,
      gender,
      applicationAmount,
      profilePicture,
      markSheet
    });

    await newApplication.save();
    res.json(newApplication);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// List applications
router.get('/', auth, async (req, res) => {
  try {
    const applications = await Application.find();
    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update application
router.put('/:id', auth, async (req, res) => {
  const { name, mobile, email, gender, applicationAmount } = req.body;

  try {
    let application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    application.name = name || application.name;
    application.mobile = mobile || application.mobile;
    application.email = email || application.email;
    application.gender = gender || application.gender;
    application.applicationAmount = applicationAmount || application.applicationAmount;

    await application.save();
    res.json(application);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete application
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    await application.remove();
    res.json({ msg: 'Application removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Download applications as Excel
router.get('/download/excel', auth, async (req, res) => {
  try {
    const applications = await Application.find();
    const workSheet = XLSX.utils.json_to_sheet(applications.map(app => ({
      name: app.name,
      mobile: app.mobile,
      email: app.email,
      gender: app.gender,
      applicationAmount: app.applicationAmount,
      profilePicture: app.profilePicture,
      markSheet: app.markSheet
    })));
    const workBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workBook, workSheet, 'Applications');
    const buffer = XLSX.write(workBook, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', 'attachment; filename=applications.xlsx');
    res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Download individual application as PDF
router.get('/download/pdf/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ msg: 'Application not found' });
    }

    const doc = new jsPDF();
    doc.text(`Name: ${application.name}`, 10, 10);
    doc.text(`Mobile: ${application.mobile}`, 10, 20);
    doc.text(`Email: ${application.email}`, 10, 30);
    doc.text(`Gender: ${application.gender}`, 10, 40);
    doc.text(`Application Amount: ${application.applicationAmount}`, 10, 50);
    doc.save('application.pdf');

    res.download('application.pdf');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;