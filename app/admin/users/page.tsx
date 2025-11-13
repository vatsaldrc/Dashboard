'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './page.module.scss';

export default function AdminUsersPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Fehler beim Erstellen des Benutzers');
        setIsLoading(false);
        return;
      }

      setSuccess('Benutzer erfolgreich erstellt!');
      setEmail('');
      setPassword('');
      setName('');
      setIsLoading(false);
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/admin" className={styles.backLink}>
            ← Zurück zum Dashboard
          </Link>
          <h1 className={styles.title}>Benutzer anlegen</h1>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Neuen Benutzer erstellen</h2>
            <p className={styles.cardDescription}>
              Geben Sie die Zugangsdaten für den neuen Benutzer ein.
            </p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <Input
                type="text"
                label="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Max Mustermann"
              />

              <Input
                type="email"
                label="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />

              <Input
                type="password"
                label="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
                minLength={6}
              />

              {error && <div className={styles.error}>{error}</div>}
              {success && <div className={styles.success}>{success}</div>}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isLoading}
                className={styles.submitButton}
              >
                {isLoading ? 'Wird erstellt...' : 'Benutzer erstellen'}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

