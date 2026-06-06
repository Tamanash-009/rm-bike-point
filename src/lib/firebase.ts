import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// --- SUPABASE CLIENT --- //

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let currentClerkToken: string | null = null;
export function setSupabaseClerkToken(token: string | null) {
  currentClerkToken = token;
}

export async function getSupabase() {
  if (currentClerkToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${currentClerkToken}` } }
    });
  }
  return supabase;
}

// --- FIREBASE SHIM --- //

export const db = 'supabase-db';
export const auth = { currentUser: null };
export const storage = 'supabase-storage';

// 1. Collections & Refs
export function collection(db: any, path: string, ...rest: string[]) {
  // If path is something like collection(db, 'blogPosts', id, 'comments'), join it
  const fullPath = rest.length ? [path, ...rest].join('_') : path;
  return { type: 'collection', path: fullPath };
}

export function doc(db: any, path: string, id: string) {
  return { type: 'doc', path, id };
}

// 2. Querying
export function query(collectionRef: any, ...constraints: any[]) {
  return { ...collectionRef, constraints };
}

export function where(field: string, op: string, value: any) {
  return { type: 'where', field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number) {
  return { type: 'limit', value: n };
}

export function startAfter(docSnap: any) {
  return { type: 'startAfter', value: docSnap };
}

// 3. Document Snapshot Format
const createSnapshot = (row: any) => ({
  id: row.id,
  data: () => {
    const data = { ...row };
    // Map created_at to Firebase-like Timestamp
    if (data.created_at) {
      data.createdAt = { toDate: () => new Date(data.created_at) };
    }
    return data;
  }
});

// 4. Data Fetching
export async function getDocs(queryObj: any) {
  const sb = await getSupabase();
  let qb = sb.from(queryObj.path).select('*');
  
  if (queryObj.constraints) {
    for (const c of queryObj.constraints) {
      // Postgres auto-lowercases unquoted identifiers, map them
      let dbField = c.field;
      if (dbField === 'userId') dbField = 'userid';
      else if (dbField === 'createdAt') dbField = 'created_at';
      else if (dbField === 'userEmail') dbField = 'useremail';
      else if (dbField === 'userName') dbField = 'username';
      else if (dbField === 'userPhoto') dbField = 'userphoto';

      if (c.type === 'where') {
        if (c.op === '==') qb = qb.eq(dbField, c.value);
        else if (c.op === '>') qb = qb.gt(dbField, c.value);
        else if (c.op === '<') qb = qb.lt(dbField, c.value);
        else if (c.op === 'in') qb = qb.in(dbField, c.value);
        else if (c.op === 'array-contains') qb = qb.contains(dbField, [c.value]);
      } else if (c.type === 'orderBy') {
        qb = qb.order(dbField, { ascending: c.direction === 'asc' });
      } else if (c.type === 'limit') {
        qb = qb.limit(c.value);
      }
    }
  }
  
  const { data, error } = await qb;
  if (error) throw error;
  
  const mapped = (data || []).map(createSnapshot);
  return {
    docs: mapped,
    empty: mapped.length === 0,
    size: mapped.length,
    forEach: function(cb: any) { this.docs.forEach(cb); }
  };
}

export async function getDoc(docRef: any) {
  const sb = await getSupabase();
  const { data, error } = await sb.from(docRef.path).select('*').eq('id', docRef.id).single();
  
  if (error || !data) {
    return { exists: () => false, data: () => null };
  }
  
  return {
    id: data.id,
    exists: () => true,
    data: () => createSnapshot(data).data()
  };
}

// 5. Data Writing
export async function addDoc(collectionRef: any, data: any) {
  const sb = await getSupabase();
  const insertData = { ...data };
  if (insertData.createdAt) delete insertData.createdAt; // Let Supabase handle default now()
  
  const { data: res, error } = await sb.from(collectionRef.path).insert([insertData]).select().single();
  if (error) throw error;
  return { id: res.id };
}

export async function setDoc(docRef: any, data: any, options?: { merge?: boolean }) {
  const sb = await getSupabase();
  const insertData = { ...data, id: docRef.id };
  if (insertData.createdAt) delete insertData.createdAt;

  const { error } = await sb.from(docRef.path).upsert([insertData]);
  if (error) throw error;
}

export async function updateDoc(docRef: any, data: any) {
  const sb = await getSupabase();
  const { error } = await sb.from(docRef.path).update(data).eq('id', docRef.id);
  if (error) throw error;
}

export async function deleteDoc(docRef: any) {
  const sb = await getSupabase();
  const { error } = await sb.from(docRef.path).delete().eq('id', docRef.id);
  if (error) throw error;
}

// 6. Realtime
export function onSnapshot(queryObj: any, callback: any, onError?: any) {
  const isDoc = queryObj.type === 'doc';

  const fetchAndCall = () => {
    if (isDoc) {
      getDoc(queryObj).then(snapshot => callback(snapshot)).catch(err => {
        console.error(err);
        if (onError) onError(err);
      });
    } else {
      getDocs(queryObj).then(snapshot => callback(snapshot)).catch(err => {
        console.error(err);
        if (onError) onError(err);
      });
    }
  };

  fetchAndCall();
  
  let channel: any;
  getSupabase().then(sb => {
    channel = sb.channel('custom-all-channel-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: isDoc ? queryObj.path.split('/')[0] : queryObj.path }, () => {
        fetchAndCall();
      })
      .subscribe();
  });
  
  return () => {
    if (channel) channel.unsubscribe();
  };
}

export function writeBatch(db: any) {
  const operations: any[] = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push(setDoc(docRef, data));
    },
    update: (docRef: any, data: any) => {
      operations.push(updateDoc(docRef, data));
    },
    delete: (docRef: any) => {
      operations.push(deleteDoc(docRef));
    },
    commit: async () => {
      await Promise.all(operations);
    }
  };
}

// 7. Utils
export function serverTimestamp() {
  return new Date();
}

export const handleFirestoreError = (error: any, operation: string) => {
  console.error(`Supabase Error (${operation}):`, error);
  return error.message || 'An error occurred';
};

export enum OperationType {
  READ = 'READ', WRITE = 'WRITE', UPDATE = 'UPDATE', DELETE = 'DELETE'
}

// --- STORAGE SHIM --- //

export function ref(storageInstance: any, path: string) {
  return { path };
}

export async function uploadBytes(fileRef: any, file: File | Blob) {
  const sb = await getSupabase();
  const { data, error } = await sb.storage.from('public-bucket').upload(fileRef.path, file, { upsert: true });
  if (error) throw error;
  return { ref: fileRef };
}

export async function getDownloadURL(fileRef: any) {
  const sb = await getSupabase();
  const { data } = sb.storage.from('public-bucket').getPublicUrl(fileRef.path);
  return data.publicUrl;
}
