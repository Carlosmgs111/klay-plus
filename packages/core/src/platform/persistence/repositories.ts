// Dynamic import to avoid loading Level in browser context
let LevelClass: typeof import("level").Level | null = null;

async function ensureLevelLoaded() {
  if (!LevelClass) {
    const levelModule = await import("level");
    LevelClass = levelModule.Level;
  }
  return LevelClass;
}

const dbs: Record<string, any> = {};

export async function getDB(dbName: string){
  if(!dbs[dbName]){
    const Level = await ensureLevelLoaded();
    dbs[dbName] = new Level("./database/level/" + dbName, { valueEncoding: "json" });
  }
  return dbs[dbName];
}
