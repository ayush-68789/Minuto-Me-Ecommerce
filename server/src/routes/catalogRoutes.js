// Owner: M3  — public catalog routes (no auth)
import express from 'express';
import { listProducts, getProduct } from '../controllers/catalogController.js';

const router = express.Router();

router.get('/',           listProducts);   // GET /api/catalog?slug=&search=&...
router.get('/:productId', getProduct);     // GET /api/catalog/:productId?slug=

export default router;
