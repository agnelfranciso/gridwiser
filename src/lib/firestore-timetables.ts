import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { getPresetTemplate } from '@/lib/themes';
import type {
  PresetTemplateId,
  SavedTimetableRecord,
  SavedTimetableSummary,
  SubjectEntry,
  TimetableMeta,
} from '@/types/timetable';

function generateRandomId(bytes = 8): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function toIsoString(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

export async function upsertUserProfile(user: User): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  await setDoc(
    ref,
    {
      uid: user.uid,
      displayName: (user.displayName ?? '').slice(0, 120),
      email: (user.email ?? '').slice(0, 200),
      photoURL: (user.photoURL ?? '').slice(0, 500),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export interface FirestoreTimetableRecord extends SavedTimetableRecord {
  ownerUid: string;
  shareId?: string | null;
}

export async function listUserTimetables(
  uid: string
): Promise<SavedTimetableSummary[]> {
  const colRef = collection(db, 'users', uid, 'timetables');
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    const subjects = (Array.isArray(data.subjects) ? data.subjects : []) as SubjectEntry[];
    const sessionCount = subjects.reduce(
      (acc, s) => acc + (Array.isArray(s.occurrences) ? s.occurrences.length : 0),
      0
    );
    const tpl = getPresetTemplate((data.templateId as PresetTemplateId) ?? 'cron-studio');

    return {
      id: d.id,
      title: String(data.title ?? data.meta?.title ?? 'Untitled Timetable'),
      subtitle: String(data.subtitle ?? data.meta?.subtitle ?? ''),
      subjectCount: subjects.length,
      sessionCount,
      templateId: tpl.id,
      templateName: tpl.name,
      canvasBg: tpl.tokens.canvasBg,
      accent: tpl.tokens.accent,
      shareId:
        typeof data.shareId === 'string' && data.shareId.length >= 10
          ? data.shareId
          : null,
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function getUserTimetable(
  uid: string,
  timetableId: string
): Promise<FirestoreTimetableRecord | null> {
  const ref = doc(db, 'users', uid, 'timetables', timetableId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  return {
    id: snap.id,
    ownerUid: String(data.ownerUid ?? uid),
    shareId: typeof data.shareId === 'string' ? data.shareId : null,
    meta: data.meta as TimetableMeta,
    subjects: (data.subjects ?? []) as SubjectEntry[],
    templateId: (data.templateId ?? 'cron-studio') as PresetTemplateId,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function saveUserTimetable(
  uid: string,
  input: {
    meta: TimetableMeta;
    subjects: SubjectEntry[];
    templateId: PresetTemplateId;
    shareId?: string | null;
  },
  existingId?: string | null
): Promise<{ id: string; shareId: string | null }> {
  const id = existingId ?? generateRandomId(6);
  const ref = doc(db, 'users', uid, 'timetables', id);

  let createdAtValue: unknown = serverTimestamp();
  let preservedShareId: string | null = input.shareId ?? null;

  if (existingId) {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      createdAtValue = existingData.createdAt ?? serverTimestamp();
      if (preservedShareId === null && typeof existingData.shareId === 'string') {
        preservedShareId = existingData.shareId;
      }
    }
  }

  const cleanMeta: TimetableMeta = {
    title: (input.meta.title || 'Untitled Timetable').slice(0, 120),
    subtitle: (input.meta.subtitle || '').slice(0, 160),
    timeFormat: input.meta.timeFormat === '12h' ? '12h' : '24h',
    showWeekend: Boolean(input.meta.showWeekend),
  };

  await setDoc(ref, {
    ownerUid: uid,
    title: cleanMeta.title,
    subtitle: cleanMeta.subtitle,
    templateId: input.templateId,
    meta: cleanMeta,
    subjects: input.subjects.slice(0, 40),
    shareId: preservedShareId,
    createdAt: createdAtValue,
    updatedAt: serverTimestamp(),
  });

  return { id, shareId: preservedShareId };
}

export async function deleteUserTimetable(
  uid: string,
  timetableId: string
): Promise<void> {
  const ref = doc(db, 'users', uid, 'timetables', timetableId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const shareId = snap.data().shareId;
    if (typeof shareId === 'string' && shareId.length >= 10) {
      await deleteDoc(doc(db, 'shared_timetables', shareId)).catch(() => {});
    }
  }
  await deleteDoc(ref);
}

export async function exportAllUserTimetables(
  uid: string
): Promise<SavedTimetableRecord[]> {
  const colRef = collection(db, 'users', uid, 'timetables');
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      meta: data.meta as TimetableMeta,
      subjects: (data.subjects ?? []) as SubjectEntry[],
      templateId: (data.templateId ?? 'cron-studio') as PresetTemplateId,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function deleteAllUserContent(uid: string): Promise<number> {
  const colRef = collection(db, 'users', uid, 'timetables');
  const snap = await getDocs(colRef);
  let deleted = 0;
  for (const d of snap.docs) {
    const shareId = d.data().shareId;
    if (typeof shareId === 'string' && shareId.length >= 10) {
      await deleteDoc(doc(db, 'shared_timetables', shareId)).catch(() => {});
    }
    await deleteDoc(d.ref);
    deleted += 1;
  }
  return deleted;
}

export async function deleteUserProfileDoc(uid: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid)).catch(() => {});
}

export async function publishSharedTimetable(
  uid: string,
  input: {
    meta: TimetableMeta;
    subjects: SubjectEntry[];
    templateId: PresetTemplateId;
  },
  existingShareId?: string | null
): Promise<string> {
  const shareId =
    existingShareId && existingShareId.length >= 10
      ? existingShareId
      : generateRandomId(8);
  const ref = doc(db, 'shared_timetables', shareId);

  let createdAtValue: unknown = serverTimestamp();
  if (existingShareId) {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      createdAtValue = existingSnap.data().createdAt ?? serverTimestamp();
    }
  }

  const cleanMeta: TimetableMeta = {
    title: (input.meta.title || 'Untitled Timetable').slice(0, 120),
    subtitle: (input.meta.subtitle || '').slice(0, 160),
    timeFormat: input.meta.timeFormat === '12h' ? '12h' : '24h',
    showWeekend: Boolean(input.meta.showWeekend),
  };

  // No PII (no email, no displayName) stored in public shared_timetables
  await setDoc(ref, {
    ownerUid: uid,
    title: cleanMeta.title,
    subtitle: cleanMeta.subtitle,
    templateId: input.templateId,
    meta: cleanMeta,
    subjects: input.subjects.slice(0, 40),
    createdAt: createdAtValue,
    updatedAt: serverTimestamp(),
  });

  return shareId;
}

export async function unpublishSharedTimetable(
  uid: string,
  timetableId: string | null,
  shareId: string
): Promise<void> {
  if (shareId && shareId.length >= 10) {
    await deleteDoc(doc(db, 'shared_timetables', shareId));
  }
  if (timetableId) {
    await updateDoc(doc(db, 'users', uid, 'timetables', timetableId), {
      shareId: null,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function getSharedTimetable(
  shareId: string
): Promise<SavedTimetableRecord | null> {
  if (!shareId || shareId.length < 10) return null;
  const ref = doc(db, 'shared_timetables', shareId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  return {
    id: snap.id,
    meta: data.meta as TimetableMeta,
    subjects: (data.subjects ?? []) as SubjectEntry[],
    templateId: (data.templateId ?? 'cron-studio') as PresetTemplateId,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}
