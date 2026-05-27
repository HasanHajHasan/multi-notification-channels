'use strict';

/**
 * Multi-Channel Notification Action — Node.js runtime
 *
 * Uses only Node.js built-in modules; no npm install required at runtime.
 * Apprise CLI must be installed before this script is called (see action.yml).
 */

const { spawnSync } = require('child_process');
const fs            = require('fs');
const path          = require('path');

// ── Read inputs ───────────────────────────────────────────────────────────────

const ACTION_PATH = process.env.ACTION_PATH || path.resolve(__dirname, '..');
const preset      = (process.env.INPUT_PRESET   || '').trim().toLowerCase();
const inputTitle  = (process.env.INPUT_TITLE    || '').trim();
const inputMsg    = (process.env.INPUT_MESSAGE  || '').trim();
const debugMode   = process.env.INPUT_DEBUG === 'true';
const channels    = (process.env.INPUT_CHANNELS || 'slack')
  .split(',')
  .map(c => c.trim().toLowerCase())
  .filter(Boolean);

// ── GitHub context (available on runners, usable in presets and templates) ────

const repository = process.env.GITHUB_REPOSITORY  || '';
const refName    = process.env.GITHUB_REF_NAME    || '';
const workflow   = process.env.GITHUB_WORKFLOW    || '';
const sha        = process.env.GITHUB_SHA         || '';
const actor      = process.env.GITHUB_ACTOR       || '';
const serverUrl  = process.env.GITHUB_SERVER_URL  || 'https://github.com';
const runId      = process.env.GITHUB_RUN_ID      || '';
const runUrl     = repository && runId
  ? `${serverUrl}/${repository}/actions/runs/${runId}`
  : '';

// ── Load presets from presets/ directory ──────────────────────────────────────
// Each .json file becomes a preset keyed by its filename (without extension).
// To add a new preset, drop a JSON file with "title" and "message" fields into
// the presets/ directory — no code changes required.

const presetsDir = path.join(ACTION_PATH, 'presets');
const PRESETS    = {};

if (fs.existsSync(presetsDir)) {
  for (const file of fs.readdirSync(presetsDir).sort()) {
    if (!file.endsWith('.json')) continue;
    const name = path.basename(file, '.json');
    try {
      const def = JSON.parse(fs.readFileSync(path.join(presetsDir, file), 'utf8'));
      PRESETS[name] = {
        title  : def.title,
        message: Array.isArray(def.message) ? def.message.join('\n') : def.message,
      };
    } catch (err) {
      console.warn(`⚠  Could not load preset "${name}": ${err.message}`);
    }
  }
}

// ── Resolve title and message ─────────────────────────────────────────────────
// Substitute GitHub context vars into a preset string.
const CTX = {
  '{REPOSITORY}' : repository,
  '{BRANCH}'     : refName,
  '{WORKFLOW}'   : workflow,
  '{COMMIT}'     : sha,
  '{AUTHOR}'     : actor,
  '{RUN_URL}'    : runUrl,
};
const resolveCtx = str => Object.entries(CTX).reduce((s, [k, v]) => s.split(k).join(v), str);

const presetDef = PRESETS[preset];
const title     = inputTitle || (presetDef ? resolveCtx(presetDef.title)   : '');
const message   = inputMsg   || (presetDef ? resolveCtx(presetDef.message) : '');

if (!title) {
  console.error(`✗ Input "title" is missing — provide it directly or set a valid preset (${Object.keys(PRESETS).join(' | ')}).`);
  process.exit(1);
}
if (!message) {
  console.error(`✗ Input "message" is missing — provide it directly or set a valid preset (${Object.keys(PRESETS).join(' | ')}).`);
  process.exit(1);
}

// ── Template variables ────────────────────────────────────────────────────────

const VARS = {
  '{TITLE}'      : title,
  '{MESSAGE}'    : message,
  '{REPOSITORY}' : repository,
  '{BRANCH}'     : refName,
  '{WORKFLOW}'   : workflow,
  '{COMMIT}'     : sha,
  '{AUTHOR}'     : actor,
  '{RUN_URL}'    : runUrl,
};

// ── Template file map ─────────────────────────────────────────────────────────

const TEMPLATE_FILES = {
  slack    : 'slack.txt',
  discord  : 'discord.txt',
  telegram : 'telegram.txt',
  teams    : 'teams.txt',
  gchat    : 'gchat.txt',
  email    : 'email.html',
  sns      : 'sns.txt',
  gotify   : 'gotify.txt',
  ntfy     : 'ntfy.txt',
  webhook  : 'webhook.txt',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderTemplate(content) {
  return Object.entries(VARS).reduce((out, [k, v]) => out.split(k).join(v), content);
}

function resolveBody(channel) {
  const customTplPath  = (process.env[`INPUT_${channel.toUpperCase()}_TEMPLATE`] || '').trim();
  const bundledTplFile = TEMPLATE_FILES[channel] || `${channel}.txt`;
  const bundledTplPath = path.join(ACTION_PATH, 'templates', bundledTplFile);

  let tplPath = '';

  if (customTplPath && fs.existsSync(customTplPath)) {
    tplPath = customTplPath;
  } else if (fs.existsSync(bundledTplPath)) {
    tplPath = bundledTplPath;
  }

  if (tplPath) {
    return renderTemplate(fs.readFileSync(tplPath, 'utf8'));
  }

  return message;
}

function sendNotification(channel, url, body) {
  console.log(`\n→ [${channel}] Sending notification…`);

  const appriseArgs = debugMode
    ? ['-vv', '-t', title, '-b', body, url]
    : ['-v',  '-t', title, '-b', body, url];

  const result = spawnSync('apprise', appriseArgs, {
    encoding : 'utf8',
    // Pipe all streams — avoids leaking the URL via shell expansion
    stdio    : ['pipe', 'pipe', 'pipe'],
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    // spawnSync itself failed (e.g. apprise not found)
    console.error(`✗ [${channel}] spawn error: ${result.error.message}`);
    process.exitCode = 1;
    return;
  }

  if (result.status !== 0) {
    console.error(`✗ [${channel}] notification failed (exit code: ${result.status})`);
    process.exitCode = 1;
  } else {
    console.log(`✓ [${channel}] notification sent successfully`);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────

let notified = 0;

for (const channel of channels) {
  const url = (process.env[`INPUT_${channel.toUpperCase()}_URL`] || '').trim();

  if (!url) {
    console.log(`⚠  [${channel}] skipped — no URL configured (set ${channel}_url input)`);
    continue;
  }

  const body = resolveBody(channel);
  sendNotification(channel, url, body);
  notified++;
}

if (notified === 0) {
  console.warn('\n⚠  No channels were notified. Provide at least one *_url input with a valid Apprise URL.');
}
