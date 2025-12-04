import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Role } from '@prisma/client';
import { SignOutButton } from '@/components/ui/SignOutButton/SignOutButton';
import { UserList } from '@/components/admin/UserList';
import { prisma } from '@/lib/prisma';
import styles from './page.module.scss';

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    redirect('/login');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Serialize dates to strings for client component
  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{session.user.email}</span>
            <SignOutButton variant="outline" size="sm" />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <UserList initialUsers={serializedUsers} />
        </div>
      </main>
    </div>
  );
}

