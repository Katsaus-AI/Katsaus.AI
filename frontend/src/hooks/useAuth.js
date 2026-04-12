import { useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const DEFAULT_SCRAPERS = ['jyu'];

function getDefaultProfile(user) {
  return {
    email: user.email || '',
    displayName: user.displayName || user.email || 'Käyttäjä',
    orgId: 'default-org',
    desiredScrapers: DEFAULT_SCRAPERS,
    isAdmin: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setError('');

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', nextUser.uid);
        const snapshot = await getDoc(profileRef);

        if (!snapshot.exists()) {
          const defaultProfile = getDefaultProfile(nextUser);
          await setDoc(profileRef, defaultProfile, { merge: true });
          setProfile({ ...defaultProfile, id: nextUser.uid });
        } else {
          setProfile({ id: nextUser.uid, ...snapshot.data() });
          await updateDoc(profileRef, {
            updatedAt: serverTimestamp(),
          });
        }
      } catch (profileError) {
        setError(profileError instanceof Error ? profileError.message : 'Profiilin lataus epäonnistui');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const actions = useMemo(() => ({
    async signIn(email, password) {
      setError('');
      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Kirjautuminen epäonnistui');
        return false;
      }
    },
    async signUp(email, password, extraProfile = {}) {
      setError('');
      try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        const profileRef = doc(db, 'users', credential.user.uid);
        await setDoc(profileRef, {
          ...getDefaultProfile(credential.user),
          ...extraProfile,
          email,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return credential.user;
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Tilin luonti epäonnistui');
        return null;
      }
    },
    async requestPasswordReset(email) {
      setError('');
      try {
        await sendPasswordResetEmail(auth, email);
        return true;
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Salasanan palautus epäonnistui');
        return false;
      }
    },
    async signOutUser() {
      setError('');
      try {
        await signOut(auth);
        return true;
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Uloskirjautuminen epäonnistui');
        return false;
      }
    },
    async savePreferences(updates) {
      if (!auth.currentUser) return;
      const profileRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await setDoc(profileRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        return true;
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : 'Asetusten tallennus epäonnistui');
        return false;
      }
    },
  }), []);

  return {
    user,
    profile,
    loading,
    error,
    setError,
    ...actions,
  };
}