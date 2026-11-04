/* Local-only cache for an authenticated teacher's previously loaded ClassRoll data. */
(function(){
  const DB='classroll-offline-records-v1', STORE='teachers';
  function open(){
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open(DB,1);
      request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'userId'});};
      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('Cannot open offline storage'));
    });
  }
  async function tx(mode,callback){
    const db=await open();
    try {
      return await new Promise((resolve,reject)=>{
        const transaction=db.transaction(STORE,mode);
        const request=callback(transaction.objectStore(STORE));
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error||new Error('Offline storage failed'));
      });
    } finally {db.close();}
  }
  window.ClassRollOffline={
    read(userId){return tx('readonly',store=>store.get(userId));},
    write(record){return tx('readwrite',store=>store.put(record));},
    remove(userId){return tx('readwrite',store=>store.delete(userId));}
  };
})();