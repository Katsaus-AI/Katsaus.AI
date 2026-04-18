import { existsSync, readFileSync } from 'node:fs';
import { cert } from 'firebase-admin/app';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

type TestOrganization = {
  id: string;
  name: string;
  description: string;
};

type TestUser = {
  email: string;
  password: string;
  displayName: string;
  orgId: string;
  desiredScrapers: string[];
  isAdmin: boolean;
};

const TEST_ORGANIZATIONS: TestOrganization[] = [
  {
    id: 'org-alpha',
    name: 'Alpha Labs',
    description: 'Testiorganisaatio Alpha',
  },
  {
    id: 'org-beta',
    name: 'Beta Works',
    description: 'Testiorganisaatio Beta',
  },
  {
    id: 'org-gamma',
    name: 'Gamma Research',
    description: 'Testiorganisaatio Gamma',
  },
  {
    id: 'org-delta',
    name: 'Delta Services',
    description: 'Testiorganisaatio Delta',
  },
];

const TEST_USERS: TestUser[] = [
  {
    email: 'alpha.admin@example.com',
    password: 'Testi123!',
    displayName: 'Alpha Admin',
    orgId: 'org-alpha',
    desiredScrapers: ['jyu', 'atlassian', 'yle', 'bbc'],
    isAdmin: true,
  },
  {
    email: 'alpha.viewer@example.com',
    password: 'Testi123!',
    displayName: 'Alpha Viewer',
    orgId: 'org-alpha',
    desiredScrapers: ['jyu', 'yle'],
    isAdmin: false,
  },
  {
    email: 'beta.admin@example.com',
    password: 'Testi123!',
    displayName: 'Beta Admin',
    orgId: 'org-beta',
    desiredScrapers: ['jyu', 'atlassian', 'bbc'],
    isAdmin: true,
  },
  {
    email: 'beta.viewer@example.com',
    password: 'Testi123!',
    displayName: 'Beta Viewer',
    orgId: 'org-beta',
    desiredScrapers: ['jyu', 'helsinki', 'tampere'],
    isAdmin: false,
  },
  {
    email: 'gamma.admin@example.com',
    password: 'Testi123!',
    displayName: 'Gamma Admin',
    orgId: 'org-gamma',
    desiredScrapers: ['jyu', 'aalto', 'turku', 'uef', 'lut'],
    isAdmin: true,
  },
  {
    email: 'gamma.viewer@example.com',
    password: 'Testi123!',
    displayName: 'Gamma Viewer',
    orgId: 'org-gamma',
    desiredScrapers: ['jyu', 'oulu', 'lapland', 'vaasa'],
    isAdmin: false,
  },
  {
    email: 'delta.admin@example.com',
    password: 'Testi123!',
    displayName: 'Delta Admin',
    orgId: 'org-delta',
    desiredScrapers: ['jyu', 'abo-akademi', 'hanken', 'uniarts', 'atlassian'],
    isAdmin: true,
  },
  {
    email: 'delta.viewer@example.com',
    password: 'Testi123!',
    displayName: 'Delta Viewer',
    orgId: 'org-delta',
    desiredScrapers: ['jyu', 'yle', 'bbc'],
    isAdmin: false,
  },
];

function initializeAdminApp() {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
    return;
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && existsSync(credentialsPath)) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(credentialsPath, 'utf8'))) });
    return;
  }

  initializeApp();
}

initializeAdminApp();

const firestore = getFirestore();
const auth = getAuth();

async function seedTestTenants() {
  const organizationBatch = firestore.batch();

  for (const organization of TEST_ORGANIZATIONS) {
    const orgRef = firestore.collection('organizations').doc(organization.id);
    organizationBatch.set(
      orgRef,
      {
        ...organization,
        createdAt: new Date().toISOString(),
      },
      { merge: true },
    );
  }

  await organizationBatch.commit();

  const seededUsers: Array<{ email: string; uid: string; orgId: string; password: string }> = [];

  for (const user of TEST_USERS) {
    let account;

    try {
      account = await auth.getUserByEmail(user.email);
      await auth.updateUser(account.uid, {
        displayName: user.displayName,
        password: user.password,
        emailVerified: true,
      });
    } catch {
      account = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true,
      });
    }

    await firestore.collection('users').doc(account.uid).set(
      {
        email: user.email,
        displayName: user.displayName,
        orgId: user.orgId,
        desiredScrapers: user.desiredScrapers,
        isAdmin: user.isAdmin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    seededUsers.push({
      email: user.email,
      uid: account.uid,
      orgId: user.orgId,
      password: user.password,
    });
  }

  return {
    ok: true,
    organizations: TEST_ORGANIZATIONS,
    users: seededUsers,
  };
}

async function main() {
  const result = await seedTestTenants();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[seed-test-tenants] ${message}`);
  process.exit(1);
});