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
  CustomTemplateDefinition,
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

// ===============================================================
// Custom Templates Management
// ===============================================================

export async function saveUserCustomTemplate(
  uid: string,
  template: Omit<CustomTemplateDefinition, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>,
  existingId?: string | null
): Promise<string> {
  const templateId = existingId && existingId.length >= 6 ? existingId : `custom-${generateRandomId(6)}`;
  const ref = doc(db, 'users', uid, 'custom_templates', templateId);

  const cleanPayload = {
    name: (template.name || 'My Custom Theme').slice(0, 80),
    category: (template.category || 'Custom').slice(0, 40),
    description: (template.description || '').slice(0, 240),
    layout: template.layout,
    bgPattern: template.bgPattern,
    mode: template.mode,
    displayFont: template.displayFont,
    bodyFont: template.bodyFont,
    monoFamily: template.monoFamily,
    radiusPx: Math.min(Math.max(Number(template.radiusPx) || 0, 0), 32),
    tokens: {
      canvasBg: (template.tokens?.canvasBg || '#09090B').slice(0, 64),
      surfaceBg: (template.tokens?.surfaceBg || '#121215').slice(0, 64),
      cardBg: (template.tokens?.cardBg || '#18181D').slice(0, 64),
      cardElevatedBg: (template.tokens?.cardElevatedBg || '#202026').slice(0, 64),
      border: (template.tokens?.border || '#272730').slice(0, 64),
      borderStrong: (template.tokens?.borderStrong || '#383844').slice(0, 64),
      text: (template.tokens?.text || '#FAFAFA').slice(0, 64),
      textMuted: (template.tokens?.textMuted || '#A1A1AA').slice(0, 64),
      accent: (template.tokens?.accent || '#3B82F6').slice(0, 64),
      accentSoft: (template.tokens?.accentSoft || 'rgba(59, 130, 246, 0.16)').slice(0, 64),
      headerBannerBg: template.tokens?.headerBannerBg ? template.tokens.headerBannerBg.slice(0, 256) : '',
    },
    ownerUid: uid,
    authorName: (template.authorName || 'GridWise Creator').slice(0, 80),
    shareId: template.shareId ?? null,
    updatedAt: serverTimestamp(),
  };

  let createdAtValue: unknown = serverTimestamp();
  if (existingId) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      createdAtValue = snap.data().createdAt ?? serverTimestamp();
    }
  }

  await setDoc(ref, {
    ...cleanPayload,
    createdAt: createdAtValue,
  });

  return templateId;
}

export async function listUserCustomTemplates(
  uid: string
): Promise<CustomTemplateDefinition[]> {
  const colRef = collection(db, 'users', uid, 'custom_templates');
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      name: String(data.name || 'Untitled Theme'),
      category: String(data.category || 'Custom'),
      description: String(data.description || ''),
      layout: data.layout || 'cron-sidebar-grid',
      bgPattern: data.bgPattern || 'solid',
      mode: data.mode || 'dark',
      displayFont: data.displayFont || 'inter',
      bodyFont: data.bodyFont || 'inter',
      monoFamily: data.monoFamily || 'geist-mono',
      radiusPx: typeof data.radiusPx === 'number' ? data.radiusPx : 12,
      tokens: data.tokens || {},
      ownerUid: data.ownerUid,
      authorName: data.authorName,
      shareId: data.shareId ?? null,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function getUserCustomTemplate(
  uid: string,
  templateId: string
): Promise<CustomTemplateDefinition | null> {
  const ref = doc(db, 'users', uid, 'custom_templates', templateId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    name: String(data.name || 'Untitled Theme'),
    category: String(data.category || 'Custom'),
    description: String(data.description || ''),
    layout: data.layout || 'cron-sidebar-grid',
    bgPattern: data.bgPattern || 'solid',
    mode: data.mode || 'dark',
    displayFont: data.displayFont || 'inter',
    bodyFont: data.bodyFont || 'inter',
    monoFamily: data.monoFamily || 'geist-mono',
    radiusPx: typeof data.radiusPx === 'number' ? data.radiusPx : 12,
    tokens: data.tokens || {},
    ownerUid: data.ownerUid,
    authorName: data.authorName,
    shareId: data.shareId ?? null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function deleteUserCustomTemplate(
  uid: string,
  templateId: string
): Promise<void> {
  const ref = doc(db, 'users', uid, 'custom_templates', templateId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const shareId = snap.data().shareId;
    if (typeof shareId === 'string' && shareId.length >= 10) {
      await deleteDoc(doc(db, 'shared_templates', shareId)).catch(() => {});
    }
  }
  await deleteDoc(ref);
}

export async function publishSharedCustomTemplate(
  uid: string,
  template: CustomTemplateDefinition,
  authorName?: string,
  existingShareId?: string | null
): Promise<string> {
  const shareId =
    existingShareId && existingShareId.length >= 10
      ? existingShareId
      : `tpl-${generateRandomId(8)}`;
  const ref = doc(db, 'shared_templates', shareId);

  let createdAtValue: unknown = serverTimestamp();
  if (existingShareId) {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      createdAtValue = existingSnap.data().createdAt ?? serverTimestamp();
    }
  }

  await setDoc(ref, {
    ownerUid: uid,
    name: (template.name || 'Custom Theme').slice(0, 80),
    category: (template.category || 'Community').slice(0, 40),
    description: (template.description || '').slice(0, 240),
    layout: template.layout,
    bgPattern: template.bgPattern,
    mode: template.mode,
    displayFont: template.displayFont,
    bodyFont: template.bodyFont,
    monoFamily: template.monoFamily,
    radiusPx: template.radiusPx,
    tokens: template.tokens,
    authorName: (authorName || template.authorName || 'Anonymous Creator').slice(0, 80),
    createdAt: createdAtValue,
    updatedAt: serverTimestamp(),
  });

  // Link shareId to user's saved template if it exists
  if (template.id && !template.id.startsWith('default')) {
    await updateDoc(doc(db, 'users', uid, 'custom_templates', template.id), {
      shareId,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }

  return shareId;
}

export async function getSharedCustomTemplate(
  shareId: string
): Promise<CustomTemplateDefinition | null> {
  if (!shareId || shareId.length < 8) return null;
  const ref = doc(db, 'shared_templates', shareId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  return {
    id: snap.id,
    name: String(data.name || 'Community Theme'),
    category: String(data.category || 'Shared'),
    description: String(data.description || ''),
    layout: data.layout || 'cron-sidebar-grid',
    bgPattern: data.bgPattern || 'solid',
    mode: data.mode || 'dark',
    displayFont: data.displayFont || 'inter',
    bodyFont: data.bodyFont || 'inter',
    monoFamily: data.monoFamily || 'geist-mono',
    radiusPx: typeof data.radiusPx === 'number' ? data.radiusPx : 12,
    tokens: data.tokens || {},
    ownerUid: data.ownerUid,
    authorName: data.authorName || 'Community Creator',
    shareId: snap.id,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}
