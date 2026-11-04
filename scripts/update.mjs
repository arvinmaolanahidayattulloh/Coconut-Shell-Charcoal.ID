// [CSC:UPDATE-SCRIPT] dijalankan GitHub Actions tiap 5 menit: node scripts/update.mjs
import { runUpdate } from "../src/lib/csc/update.js";

const r = await runUpdate({ budgetMs: 4 * 60 * 1000 });
console.log(JSON.stringify(r, null, 2));
if (!r.ok) process.exit(1);
// [/CSC:UPDATE-SCRIPT]
