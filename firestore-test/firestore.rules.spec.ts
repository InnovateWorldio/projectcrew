import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    RulesTestEnvironment,
    TokenOptions,
  } from '@firebase/rules-unit-testing';

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

const getFirestore = (authUser?: { uid: string; token: TokenOptions }) =>
  authUser
    ? testEnv.authenticatedContext(authUser.uid, authUser.token).firestore()
    : testEnv.unauthenticatedContext().firestore();

    const adminAuth = {
      uid: 'admin_user',
      token: { email: 'earl.wagner@innovateworld.io' },
    };
    const badAuth = { uid: 'bad_user', token: { email: 'bad-user@test.com' } };

describe('Firestore security rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'projectcrew-ab778',
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const existingOrgDocRef = doc(
        context.firestore(),
        'orgs',
        'existingDoc'
      );
      await setDoc(existingOrgDocRef, { foo: 'bar' });
    });
  });

  it('non admin user can not read/write from the orgs collection', async () => {
    const db = getFirestore(adminAuth);
    const newDoc = db.collection('orgs').doc('testDoc');
    const existingDoc = doc(db, 'orgs', 'existingDoc');

    await Promise.all([
      assertFails(getDoc(existingDoc)), //read
      assertFails(setDoc(newDoc, { foo: 'bar' })), // create
      assertFails(setDoc(existingDoc, { foo: 'bar' })), // update
      assertFails(deleteDoc(existingDoc)), // delete
    ]);
  });
  afterAll(async () => {
    await testEnv.cleanup();
  });
});