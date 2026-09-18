#!/usr/bin/env node
// Google Cloud Text-to-Speech で音声を事前生成するスクリプト。
// アプリの実行時にはAPIを呼び出さない（一度だけ実行してaudio/以下にmp3を生成する）。
//
// 生成対象:
//   - 単語ドリルの見出し語（js/data/words.js の word）
//   - 文法ドリルの完成文（js/data/questions.js の sentence の ___ を正解で埋めたもの）
//
// 使い方:
//   GOOGLE_TTS_API_KEY=xxxxx node scripts/generate-audio.js
//
// 単語・問題を追加/変更したときに再実行する。既に生成済みのテキストはスキップする
// （manifest.json を突き合わせて差分のみ生成するので、再実行のコストは小さい）。

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const API_KEY = process.env.GOOGLE_TTS_API_KEY;
if (!API_KEY) {
  console.error("環境変数 GOOGLE_TTS_API_KEY を設定してください。");
  process.exit(1);
}

const VOICE_NAME = process.env.TTS_VOICE_NAME || "en-GB-Neural2-A";
const LANGUAGE_CODE = VOICE_NAME.startsWith("en-GB") ? "en-GB" : "en-US";
const OUT_DIR = path.join(ROOT, "audio");
const MANIFEST_PATH = path.join(ROOT, "js", "data", "audioManifest.js");

// 差分生成のリクエスト間隔（ミリ秒）。Google側のレート制限を避けるため。
const REQUEST_INTERVAL_MS = 80;

async function main() {
  const { WORDS } = await import(path.join(ROOT, "js", "data", "words.js"));
  const { QUESTIONS } = await import(path.join(ROOT, "js", "data", "questions.js"));

  const targets = [];
  for (const w of WORDS) {
    targets.push({ key: `word:${w.id}`, text: w.word });
  }
  for (const q of QUESTIONS) {
    const fullSentence = q.sentence.replace("___", q.choices[q.answer]);
    targets.push({ key: `grammar:${q.id}`, text: fullSentence });
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const manifest = loadManifest();
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const target of targets) {
    const fileName = `${sanitizeKey(target.key)}.mp3`;
    const filePath = path.join(OUT_DIR, fileName);

    if (
      manifest[target.key] &&
      manifest[target.key].text === target.text &&
      manifest[target.key].voice === VOICE_NAME &&
      existsSync(filePath)
    ) {
      skipped++;
      continue;
    }

    try {
      const audioContentBase64 = await synthesize(target.text);
      writeFileSync(filePath, Buffer.from(audioContentBase64, "base64"));
      manifest[target.key] = { text: target.text, file: `audio/${fileName}`, voice: VOICE_NAME };
      generated++;
      if (generated % 50 === 0) {
        console.log(`生成中... ${generated}件完了`);
        writeFileSync(MANIFEST_PATH, buildManifestSource(manifest));
      }
      await sleep(REQUEST_INTERVAL_MS);
    } catch (err) {
      console.error(`失敗: ${target.key} (${target.text}) - ${err.message}`);
      failed++;
    }
  }

  writeFileSync(MANIFEST_PATH, buildManifestSource(manifest));
  console.log(`完了: 新規生成 ${generated}件 / スキップ ${skipped}件 / 失敗 ${failed}件`);
  if (failed > 0) process.exitCode = 1;
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return {};
  try {
    const src = readFileSync(MANIFEST_PATH, "utf8");
    const jsonStart = src.indexOf("{");
    const jsonEnd = src.lastIndexOf("}");
    return JSON.parse(src.slice(jsonStart, jsonEnd + 1));
  } catch {
    return {};
  }
}

function buildManifestSource(manifest) {
  return (
    "// scripts/generate-audio.js が自動生成するファイル。手で編集しないこと。\n" +
    "export const AUDIO_MANIFEST = " +
    JSON.stringify(manifest, null, 2) +
    ";\n"
  );
}

function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function synthesize(text) {
  const body = JSON.stringify({
    input: { text },
    voice: { languageCode: LANGUAGE_CODE, name: VOICE_NAME },
    audioConfig: { audioEncoding: "MP3" },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "texttospeech.googleapis.com",
        path: `/v1/text:synthesize?key=${API_KEY}`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (!parsed.audioContent) {
              reject(new Error("audioContent が空でした"));
              return;
            }
            resolve(parsed.audioContent);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
