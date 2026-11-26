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
import { generateRandomAdultDob } from '@/lib/dob-policy';
import { getPresetTemplate } from '@/lib/themes';
import type {
  CustomTemplateDefinition,
  ExamEntry,
  ExamTimetableMeta,
  PresetTemplateId,
  SavedExamTimetableRecord,
  SavedExamTimetableSummary,
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

export async function upsertUserProfile(
  user: User,
  dobInfo?: { dob: string; guardianConsent?: boolean }
): Promise<{ needsDob: boolean }> {
  const ref = doc(db, 'users', user.uid);
  const existingSnap = await getDoc(ref).catch(() => null);
  const existingData = existingSnap?.exists() ? existingSnap.data() : null;
  const existingDob =
    typeof existingData?.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(existingData.dob)
      ? existingData.dob
      : null;

  const createdMs = user.metadata?.creationTime ? Date.parse(user.metadata.creationTime) : 0;
  // Only accounts created before the DOB rollout are treated as legacy accounts
  const DOB_ROLLOUT_EPOCH_MS = Date.parse('2026-11-26T09:50:00Z');
  const isLegacyAccount = createdMs > 0 && createdMs < DOB_ROLLOUT_EPOCH_MS;

  let resolvedDob: string | null = existingDob ?? dobInfo?.dob ?? null;
  let resolvedGuardianConsent = existingDob
    ? Boolean(existingData?.guardianConsent)
    : Boolean(dobInfo?.guardianConsent);

  // Backfill a random adult DOB for already-created accounts
  if (!resolvedDob && isLegacyAccount) {
    resolvedDob = generateRandomAdultDob();
    resolvedGuardianConsent = false;
  }

  const payload: Record<string, unknown> = {
    uid: user.uid,
    displayName: (user.displayName ?? '').slice(0, 120),
    email: (user.email ?? '').slice(0, 200),
    photoURL: (user.photoURL ?? '').slice(0, 500),
    updatedAt: serverTimestamp(),
  };

  if (resolvedDob) {
    payload.dob = resolvedDob;
    payload.guardianConsent = resolvedGuardianConsent;
  }

  await setDoc(ref, payload, { merge: true });
  return { needsDob: !resolvedDob };
}

export async function saveUserDob(
  uid: string,
  dob: string,
  guardianConsent: boolean
): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    dob,
    guardianConsent,
    updatedAt: serverTimestamp(),
  });
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

function sanitizeCustomTemplateCore(
  uid: string,
  template: Omit<CustomTemplateDefinition, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>,
  authorFallback: string,
  categoryFallback: string
) {
  return {
    ownerUid: uid,
    name: (template.name || 'My Custom Theme').slice(0, 80),
    category: (template.category || categoryFallback).slice(0, 40),
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
    authorName: (authorFallback || template.authorName || 'GridWise Creator').slice(0, 80),
  };
}

export async function saveUserCustomTemplate(
  uid: string,
  template: Omit<CustomTemplateDefinition, 'id' | 'createdAt' | 'updatedAt' | 'ownerUid'>,
  existingId?: string | null
): Promise<string> {
  const templateId = existingId && existingId.length >= 6 ? existingId : `custom-${generateRandomId(6)}`;
  const ref = doc(db, 'users', uid, 'custom_templates', templateId);

  const cleanPayload = {
    ...sanitizeCustomTemplateCore(uid, template, template.authorName || 'GridWise Creator', 'Custom'),
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
    ...sanitizeCustomTemplateCore(
      uid,
      template,
      authorName || template.authorName || 'Anonymous Creator',
      'Community'
    ),
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

// ===============================================================
// Exam Timetables Management (Private Only — Never Shared)
// ===============================================================

export async function listUserExamTimetables(
  uid: string
): Promise<SavedExamTimetableSummary[]> {
  const colRef = collection(db, 'users', uid, 'exam_timetables');
  const q = query(colRef, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: String(data.title || 'Untitled Exam Schedule'),
      subtitle: String(data.subtitle || ''),
      templateId: (data.templateId ?? 'cron-studio') as PresetTemplateId,
      examCount: Array.isArray(data.exams) ? data.exams.length : 0,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  });
}

export async function getUserExamTimetable(
  uid: string,
  examId: string
): Promise<SavedExamTimetableRecord | null> {
  const ref = doc(db, 'users', uid, 'exam_timetables', examId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();

  return {
    id: snap.id,
    meta: (data.meta ?? {
      title: data.title ?? 'Untitled Exam Schedule',
      subtitle: data.subtitle ?? '',
      timeFormat: '12h',
    }) as ExamTimetableMeta,
    exams: (data.exams ?? []) as ExamEntry[],
    templateId: (data.templateId ?? 'cron-studio') as PresetTemplateId,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export async function saveUserExamTimetable(
  uid: string,
  input: {
    meta: ExamTimetableMeta;
    exams: ExamEntry[];
    templateId: PresetTemplateId;
  },
  existingId?: string | null
): Promise<string> {
  const id = existingId ?? `exam-${generateRandomId(6)}`;
  const ref = doc(db, 'users', uid, 'exam_timetables', id);

  let createdAtValue: unknown = serverTimestamp();
  if (existingId) {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      createdAtValue = existingSnap.data().createdAt ?? serverTimestamp();
    }
  }

  const cleanMeta: ExamTimetableMeta = {
    title: (input.meta.title || 'Untitled Exam Schedule').slice(0, 120),
    subtitle: (input.meta.subtitle || '').slice(0, 160),
    timeFormat: input.meta.timeFormat === '24h' ? '24h' : '12h',
  };

  await setDoc(ref, {
    ownerUid: uid,
    title: cleanMeta.title,
    subtitle: cleanMeta.subtitle,
    templateId: input.templateId,
    meta: cleanMeta,
    exams: input.exams.slice(0, 60),
    createdAt: createdAtValue,
    updatedAt: serverTimestamp(),
  });

  return id;
}

export async function duplicateUserExamTimetable(
  uid: string,
  sourceId: string
): Promise<SavedExamTimetableRecord | null> {
  const source = await getUserExamTimetable(uid, sourceId);
  if (!source) return null;

  const copyMeta: ExamTimetableMeta = {
    ...source.meta,
    title: `${source.meta.title} (Copy)`.slice(0, 120),
  };
  const newId = await saveUserExamTimetable(
    uid,
    {
      meta: copyMeta,
      exams: source.exams,
      templateId: source.templateId,
    },
    null
  );

  return {
    id: newId,
    meta: copyMeta,
    exams: source.exams,
    templateId: source.templateId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function deleteUserExamTimetable(
  uid: string,
  examId: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'exam_timetables', examId));
}
