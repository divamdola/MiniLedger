import { Request, Response } from 'express';
import pool from './db';
import { authenticateToken } from './auth';
import { validateFriendName, validateAmount, validateDate } from './validation';

export const addLoan = async (req: Request, res: Response) => {
  const { friend_name, amount, due_date, receipt_photo } = req.body;
  const userId = (req as any).user.userId;

  if (!friend_name || !amount || !due_date) {
    return res.status(400).json({ error: 'Friend name, amount, and due date are required' });
  }

  if (!validateFriendName(friend_name)) {
    return res.status(400).json({ error: 'Friend name must be between 2 and 100 characters' });
  }

  if (!validateAmount(parseFloat(amount))) {
    return res.status(400).json({ error: 'Amount must be between 0 and 1,000,000' });
  }

  if (!validateDate(due_date)) {
    return res.status(400).json({ error: 'Due date must be a valid future date' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO loans (user_id, friend_name, amount, due_date, receipt_photo) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, friend_name, amount, due_date, receipt_photo || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding loan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLoans = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    const loans = result.rows.map(loan => ({
      ...loan,
      is_overdue: !loan.is_repaid && new Date(loan.due_date) < new Date()
    }));

    res.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsRepaid = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.userId;

  try {
    const result = await pool.query(
      'UPDATE loans SET is_repaid = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error marking loan as repaid:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  const userId = (req as any).user.userId;

  try {
    const totalLentResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE user_id = $1',
      [userId]
    );

    const totalRepaidResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE user_id = $1 AND is_repaid = TRUE',
      [userId]
    );

    const overdueResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM loans WHERE user_id = $1 AND is_repaid = FALSE AND due_date < CURRENT_DATE',
      [userId]
    );

    const totalLent = parseFloat(totalLentResult.rows[0].total) || 0;
    const totalRepaid = parseFloat(totalRepaidResult.rows[0].total) || 0;
    const overdueAmount = parseFloat(overdueResult.rows[0].total) || 0;

    res.json({
      total_lent: totalLent,
      total_repaid: totalRepaid,
      overdue_amount: overdueAmount,
      pending_amount: totalLent - totalRepaid,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadReceipt = async (req: Request, res: Response) => {
  if (!(req as any).file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = (req as any).file.path;
  const fileUrl = `/uploads/${(req as any).file.filename}`;

  res.json({ receipt_url: fileUrl });
};
