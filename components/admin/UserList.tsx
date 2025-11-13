'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './UserList.module.scss';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserListProps {
  initialUsers: User[];
}

export function UserList({ initialUsers }: UserListProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editingPassword, setEditingPassword] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleChangePassword = async (userId: number) => {
    if (!newPassword || newPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Passwort erfolgreich geändert');
        setEditingPassword(null);
        setNewPassword('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Fehler beim Ändern des Passworts');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Möchten Sie diesen Benutzer wirklich löschen?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Benutzer erfolgreich gelöscht');
        await fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Fehler beim Löschen des Benutzers');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !newUserPassword) {
      setError('E-Mail und Passwort sind erforderlich');
      return;
    }

    if (newUserPassword.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Benutzer erfolgreich erstellt');
        setNewUserEmail('');
        setNewUserName('');
        setNewUserPassword('');
        setShowCreateForm(false);
        await fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Fehler beim Erstellen des Benutzers');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.userList}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Benutzerübersicht</h2>
          <p className={styles.subtitle}>
            {users.length} {users.length === 1 ? 'Benutzer' : 'Benutzer'}
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setError('');
            setSuccess('');
          }}
        >
          {showCreateForm ? 'Abbrechen' : '+ Neuer Benutzer'}
        </Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {showCreateForm && (
        <div className={styles.createForm}>
          <h3 className={styles.createFormTitle}>Neuen Benutzer erstellen</h3>
          <form onSubmit={handleCreateUser}>
            <div className={styles.formRow}>
              <Input
                type="text"
                label="Name (optional)"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                disabled={loading}
                placeholder="Max Mustermann"
              />
              <Input
                type="email"
                label="E-Mail"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
              <Input
                type="password"
                label="Passwort"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                minLength={6}
                placeholder="Mindestens 6 Zeichen"
              />
            </div>
            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={loading}
              >
                {loading ? 'Wird erstellt...' : 'Benutzer erstellen'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>E-Mail</th>
              <th>Name</th>
              <th>Rolle</th>
              <th>Erstellt am</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.name || '-'}</td>
                <td>
                  <span className={styles.role}>{user.role}</span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <div className={styles.actions}>
                    {editingPassword === user.id ? (
                      <div className={styles.passwordForm}>
                        <Input
                          type="password"
                          label="Neues Passwort"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mindestens 6 Zeichen"
                          disabled={loading}
                        />
                        <div className={styles.formActions}>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleChangePassword(user.id)}
                            disabled={loading}
                          >
                            Speichern
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingPassword(null);
                              setNewPassword('');
                              setError('');
                            }}
                            disabled={loading}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingPassword(user.id);
                            setNewPassword('');
                            setError('');
                          }}
                          disabled={loading}
                        >
                          Passwort ändern
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={loading}
                        >
                          Löschen
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

