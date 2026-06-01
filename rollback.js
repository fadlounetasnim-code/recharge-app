const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\ayoub\\.gemini\\antigravity\\brain\\00d44116-6bdc-4164-a19a-7e85dceb504f\\.system_generated\\logs\\transcript.jsonl';
const targetFiles = [
  'public/js/db.js',
  'public/index.html',
  'public/js/ui.js',
  'public/js/pdf.js',
  'public/js/app.js'
];

function deepParse(val) {
  if (typeof val !== 'string') return val;
  let current = val.trim();
  while (typeof current === 'string') {
    try {
      if (!current.startsWith('"') && !current.startsWith('{') && !current.startsWith('[') && !current.startsWith("'")) {
        break;
      }
      const parsed = JSON.parse(current);
      if (parsed === current) break;
      current = parsed;
    } catch (e) {
      break;
    }
  }
  return current;
}

function normalizeNewlines(s) {
  if (typeof s !== 'string') return '';
  return s.replace(/\r\n/g, '\n');
}

async function main() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const edits = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const step = JSON.parse(line);
      const stepIdx = step.step_index;
      if (stepIdx < 851) continue;

      if (step.tool_calls) {
        for (const tc of step.tool_calls) {
          const name = tc.name;
          const args = tc.args || {};
          const isDone = tc.status === 'DONE' || tc.status === undefined;
          
          if ((name.endsWith('replace_file_content') || name.endsWith('multi_replace_file_content')) && isDone) {
            const filePath = deepParse(args.AbsolutePath || args.TargetFile || '');
            const normalized = filePath.replace(/\\/g, '/');
            const matched = targetFiles.find(tf => normalized.endsWith(tf));
            if (matched) {
              edits.push({
                stepIdx,
                tool: name,
                file: matched,
                args
              });
            }
          }
        }
      }
    } catch (e) {}
  }

  // Sort edits in reverse chronological order (highest stepIndex first)
  edits.sort((a, b) => b.stepIdx - a.stepIdx);

  console.log(`Found ${edits.length} edits to rollback.`);

  // Load current file contents from disk
  const projectDir = __dirname;
  const fileContents = {};
  for (const f of targetFiles) {
    const fullPath = path.join(projectDir, f);
    if (fs.existsSync(fullPath)) {
      fileContents[f] = normalizeNewlines(fs.readFileSync(fullPath, 'utf8'));
      console.log(`Loaded ${f} (${fileContents[f].length} chars)`);
    } else {
      fileContents[f] = '';
    }
  }

  const rolledBackContents = { ...fileContents };
  let successCount = 0;
  let failCount = 0;
  let failuresText = '';

  for (const edit of edits) {
    const filename = edit.file;
    let content = rolledBackContents[filename];

    if (edit.tool.endsWith('replace_file_content')) {
      const target = normalizeNewlines(deepParse(edit.args.TargetContent));
      const replacement = normalizeNewlines(deepParse(edit.args.ReplacementContent));

      const idx = content.indexOf(replacement);
      if (idx !== -1) {
        content = content.substring(0, idx) + target + content.substring(idx + replacement.length);
        rolledBackContents[filename] = content;
        console.log(`Step ${edit.stepIdx}: Reverted replace on ${filename} (Success)`);
        successCount++;
      } else {
        console.log(`Step ${edit.stepIdx}: Reverted replace on ${filename} (Failed - replacement content not found)`);
        failuresText += `Step ${edit.stepIdx}: replace on ${filename} failed\nSought: ${replacement.substring(0, 200)}...\n\n`;
        failCount++;
      }
    }

    if (edit.tool.endsWith('multi_replace_file_content')) {
      const chunks = deepParse(edit.args.ReplacementChunks);
      console.log(`Step ${edit.stepIdx}: Reverting multi_replace on ${filename} with ${chunks ? chunks.length : 0} chunks.`);
      let chunksSuccess = 0;
      let chunksFail = 0;

      if (chunks) {
        const reversedChunks = [...chunks].reverse();
        for (const chunk of reversedChunks) {
          const target = normalizeNewlines(deepParse(chunk.TargetContent));
          const replacement = normalizeNewlines(deepParse(chunk.ReplacementContent));
          
          const idx = content.indexOf(replacement);
          if (idx !== -1) {
            content = content.substring(0, idx) + target + content.substring(idx + replacement.length);
            chunksSuccess++;
          } else {
            console.log(`  Failed chunk lookup!`);
            failuresText += `Step ${edit.stepIdx}: multi_replace chunk on ${filename} failed\nSought: ${replacement.substring(0, 200)}...\n\n`;
            chunksFail++;
          }
        }
      }
      rolledBackContents[filename] = content;
      if (chunksFail === 0) {
        console.log(`Step ${edit.stepIdx}: Reverted multi_replace on ${filename} (Success)`);
        successCount++;
      } else {
        console.log(`Step ${edit.stepIdx}: Reverted multi_replace on ${filename} (Failed: ${chunksFail} chunk(s) failed)`);
        failCount++;
      }
    }
  }

  console.log(`\nRollback Summary: Success: ${successCount}, Fail: ${failCount}`);

  console.log("\nApplying rolled back contents to disk...");
  for (const f of targetFiles) {
    const fullPath = path.join(projectDir, f);
    fs.writeFileSync(fullPath, rolledBackContents[f], 'utf8');
    console.log(`Wrote ${f}`);
  }
  
  if (failCount > 0) {
    fs.writeFileSync(path.join(projectDir, 'rollback_failures.txt'), failuresText, 'utf8');
    console.log(`Wrote rollback_failures.txt with details of the ${failCount} failed reversions.`);
  } else {
    try {
      fs.unlinkSync(path.join(projectDir, 'rollback_failures.txt'));
    } catch(e) {}
  }
  console.log("Done!");
}

main();
