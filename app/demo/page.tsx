import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SignOutButton } from '@/components/ui/SignOutButton/SignOutButton';
import styles from './page.module.scss';

export default async function DemoPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Demo</h1>
          <div className={styles.userInfo}>
            <span className={styles.userEmail}>{session.user.email}</span>
            <SignOutButton variant="outline" size="sm" />
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.welcomeCard}>
            <h2 className={styles.welcomeTitle}>
              Willkommen, {session.user.name || session.user.email}!
            </h2>
            <p className={styles.welcomeText}>
              Dies ist Ihre Demo-Seite. Hier können Sie später Ihre Inhalte
              und Funktionen hinzufügen.
            </p>
          </div>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Feature 1</h3>
              <p className={styles.featureDescription}>
                Beschreibung für Feature 1
              </p>
            </div>

            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Feature 2</h3>
              <p className={styles.featureDescription}>
                Beschreibung für Feature 2
              </p>
            </div>

            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Feature 3</h3>
              <p className={styles.featureDescription}>
                Beschreibung für Feature 3
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

