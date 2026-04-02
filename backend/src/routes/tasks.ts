import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = createTaskSchema.partial();

// GET /tasks
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const where: Record<string, unknown> = { userId };
  if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
    where.status = status;
  }
  if (search) {
    where.title = { contains: search };
  }

  try {
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);
    res.json({ tasks, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /tasks
router.post('/', validate(createTaskSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { title, description, status, priority, dueDate } = req.body;
  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'PENDING',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
    });
    res.status(201).json(task);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /tasks/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid task ID' }); return; }
  try {
    const task = await prisma.task.findFirst({ where: { id, userId } });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }
    res.json(task);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /tasks/:id
router.patch('/:id', validate(updateTaskSchema), async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid task ID' }); return; }
  try {
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
    const { dueDate, ...rest } = req.body;
    const task = await prisma.task.update({
      where: { id },
      data: { ...rest, ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}) },
    });
    res.json(task);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /tasks/:id
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid task ID' }); return; }
  try {
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Task deleted' });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /tasks/:id/toggle
router.patch('/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const id = parseInt(req.params['id'] as string);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid task ID' }); return; }
  try {
    const existing = await prisma.task.findFirst({ where: { id, userId } });
    if (!existing) { res.status(404).json({ error: 'Task not found' }); return; }
    const nextStatus = existing.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    const task = await prisma.task.update({ where: { id }, data: { status: nextStatus } });
    res.json(task);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
