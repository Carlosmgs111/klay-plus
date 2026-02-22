// Dynamic import to avoid loading Level in browser context
let LevelClass: typeof import("level").Level | null = null;

async function ensureLevelLoaded() {
  console.log("ensureLevelLoaded");
  if (!LevelClass) {
    console.log("LevelClass not initialized");
    const levelModule = await import("level");
    LevelClass = levelModule.Level;
  }
  console.log("LevelClass initialized");
  return LevelClass;
}

const dbs: Record<string, any> = {};

export async function getDB(dbName: string){
  console.log("getDB", {dbs});
  if(!dbs[dbName]){
    const Level = await ensureLevelLoaded();
    dbs[dbName] = new Level("./database/level/" + dbName, { valueEncoding: "json" });
  }
  return dbs[dbName];
}
