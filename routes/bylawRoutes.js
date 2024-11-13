import express from 'express';
import multer from 'multer';
import { createByLaw, getByLaw, updateByLaw, getByLawForMember } from '../controllers/ByLawRulesController.js';
import { onlyAdmin, verifyAllToken } from '../utils/tokenAuthentication.js';

const router = express.Router();

// Multer setup for PDF upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed.'), false);
    }
  },
});

router.post('/create',verifyAllToken, upload.single('document'), createByLaw);
router.get('/get', verifyAllToken, onlyAdmin, getByLaw);
router.get('/get/list', verifyAllToken, getByLawForMember);
router.put('/update/:id', verifyAllToken, onlyAdmin, updateByLaw);

export default router;
