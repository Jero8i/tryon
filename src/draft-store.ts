import type {Draft} from './admin-model';
function database():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('mirada-catalog',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('drafts',{keyPath:'id'});
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
async function transaction<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
  const db=await database();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts',mode),request=action(tx.objectStore('drafts'));
    tx.oncomplete=()=>{db.close();resolve(request.result);};
    tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};
  });
}
export const drafts={
  list:()=>transaction('readonly',s=>s.getAll()) as Promise<Draft[]>,
  get:(id:string)=>transaction('readonly',s=>s.get(id)) as Promise<Draft|undefined>,
  put:(draft:Draft)=>transaction('readwrite',s=>s.put(draft)),
  remove:(id:string)=>transaction('readwrite',s=>s.delete(id))
};
