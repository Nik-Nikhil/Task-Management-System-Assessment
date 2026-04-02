import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const libsql = createClient({ url: 'file:./prisma/dev.db' });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaLibSql(libsql as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

export default prisma;
