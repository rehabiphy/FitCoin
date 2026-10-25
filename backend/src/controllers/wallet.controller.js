import ApiError from '../utils/ApiError.js';
import { getTransaction, getWalletSummary, listTransactions } from '../services/wallet.service.js';

/** GET /wallet?tzOffset=330 */
export async function summary(req, res) {
  const wallet = await getWalletSummary(req.user._id, req.validatedQuery.tzOffset ?? req.tzOffset);
  res.json({ success: true, data: { wallet } });
}

/** GET /wallet/transactions?page=1&limit=20&type=earn */
export async function transactions(req, res) {
  const data = await listTransactions(req.user._id, req.validatedQuery);
  res.json({ success: true, data });
}

/** GET /wallet/transactions/:id */
export async function transaction(req, res) {
  const tx = await getTransaction(req.user._id, req.params.id);
  if (!tx) {
    throw ApiError.notFound('Transaction not found');
  }
  res.json({ success: true, data: { transaction: tx.toPublicJSON() } });
}
