#!/usr/bin/env node
/**
 * generate-changelog.js
 *
 * Generates CHANGELOG.md from conventional commits.
 *
 * Usage:
 *   node scripts/generate-changelog.js              # write changelog
 *   node scripts/generate-changelog.js --preview    # print to stdout only
 *   node scripts/generate-changelog.js --from v1.0.0 --to HEAD
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CHANGELOG_PATH = path.resolve(__dirname, '..', 'CHANGELOG.md');

const SECTION_CONFIG = [
  { type: 'feat',     emoji: '✨', title: 'Features' },
  { type: 'fix',      emoji: '🐛', title: 'Bug Fixes' },
  { type: 'perf',     emoji: '⚡', title: 'Performance Improvements' },
  { type: 'revert',   emoji: '⏪', title: 'Reverts' },
  { type: 'docs',     emoji: '📚', title: 'Documentation' },
  { type: 'build',    emoji: '🏗️', title: 'Build System' },
  { type: 'ci',       emoji: '🔧', title: 'CI/CD' },
  { type: 'refactor', emoji: '♻️',  title: 'Code Refactoring' },
  { type: 'style',    emoji: '💅', title: 'Styles' },
  { type: 'test',     emoji: '🧪', title: 'Tests' },
  { type: 'chore',    emoji: '🔨', title: 'Chores' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function getLatestTag() {
  return run('git describe --tags --abbrev=0 2>/dev/null') || null;
}

function getNextVersion() {
  // Read version from root package.json
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf8'));
    return pkg.version || '0.1.0';
  } catch {
    return '0.1.0';
  }
}

function getCommits(from, to = 'HEAD') {
  const range = from ? `${from}..${to}` : to;
  // Format: hash<SEP>subject<SEP>body
  const SEP = '|||';
  const raw = run(`git log ${range} --pretty=format:"%H${SEP}%s${SEP}%b${SEP}%an" --no-merges`);
  if (!raw) return [];

  return raw.split('\n').map((line) => {
    const [hash, subject, body, author] = line.split(SEP);
    return { hash: (hash || '').trim(), subject: (subject || '').trim(), body: (body || '').trim(), author: (author || '').trim() };
  }).filter((c) => c.hash && c.subject);
}

function parseCommit(commit) {
  // Conventional commit regex: type(scope)!: description
  const conventionalRe = /^(\w+)(\(([^)]+)\))?(!)?: (.+)$/;
  const match = commit.subject.match(conventionalRe);
  if (!match) return null;

  const breaking =
    match[4] === '!' ||
    /^BREAKING[ -]CHANGE:/im.test(commit.body);

  return {
    hash: commit.hash,
    type: match[1],
    scope: match[3] || null,
    breaking,
    description: match[5],
    body: commit.body,
    author: commit.author,
  };
}

function getRepoUrl() {
  const remote = run('git remote get-url origin 2>/dev/null');
  return remote.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/') || null;
}

function shortHash(hash) {
  return hash.slice(0, 7);
}

function commitLink(hash, repoUrl) {
  if (!repoUrl) return `\`${shortHash(hash)}\``;
  return `[\`${shortHash(hash)}\`](${repoUrl}/commit/${hash})`;
}

// ---------------------------------------------------------------------------
// Changelog building
// ---------------------------------------------------------------------------
function buildSection(title, emoji, entries, repoUrl) {
  if (!entries.length) return '';
  const lines = [`### ${emoji} ${title}\n`];
  for (const e of entries) {
    const scope = e.scope ? `**${e.scope}:** ` : '';
    const link = commitLink(e.hash, repoUrl);
    lines.push(`- ${scope}${e.description} (${link})`);
  }
  return lines.join('\n') + '\n';
}

function buildChangelog(version, commits, repoUrl) {
  const date = new Date().toISOString().split('T')[0];
  const sections = [];

  // Group by type
  const byType = {};
  const breaking = [];

  for (const raw of commits) {
    const parsed = parseCommit(raw);
    if (!parsed) continue;
    if (parsed.breaking) breaking.push(parsed);
    (byType[parsed.type] = byType[parsed.type] || []).push(parsed);
  }

  // Breaking changes section first
  if (breaking.length) {
    const lines = [`### 💥 Breaking Changes\n`];
    for (const e of breaking) {
      const scope = e.scope ? `**${e.scope}:** ` : '';
      const link = commitLink(e.hash, repoUrl);
      lines.push(`- ${scope}${e.description} (${link})`);
      if (e.body) {
        const breakingNote = (e.body.match(/^BREAKING[ -]CHANGE: (.+)$/im) || [])[1];
        if (breakingNote) lines.push(`  > ${breakingNote}`);
      }
    }
    sections.push(lines.join('\n') + '\n');
  }

  // Typed sections
  for (const { type, emoji, title } of SECTION_CONFIG) {
    const entries = (byType[type] || []).filter((e) => !e.breaking || type === 'feat');
    const section = buildSection(title, emoji, entries, repoUrl);
    if (section) sections.push(section);
  }

  const compareUrl = repoUrl ? `\n[Full Changelog](${repoUrl}/compare/${version}...HEAD)\n` : '';
  const header = `## [${version}] - ${date}\n`;

  return header + '\n' + sections.join('\n') + compareUrl;
}

function prependToChangelog(newEntry, existingContent) {
  const marker = '<!-- CHANGELOG BELOW -->';
  if (existingContent.includes(marker)) {
    return existingContent.replace(marker, `${marker}\n\n${newEntry}`);
  }
  // Insert after the top-level heading if it exists
  const headingMatch = existingContent.match(/^(# .+\n\n?)/);
  if (headingMatch) {
    const after = headingMatch[1];
    return existingContent.replace(after, `${after}${newEntry}\n`);
  }
  return `${newEntry}\n\n${existingContent}`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const preview = args.includes('--preview');
  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');
  const fromRef = fromIdx !== -1 ? args[fromIdx + 1] : getLatestTag();
  const toRef = toIdx !== -1 ? args[toIdx + 1] : 'HEAD';

  const version = getNextVersion();
  const repoUrl = getRepoUrl();
  const commits = getCommits(fromRef, toRef);

  if (!commits.length) {
    console.log('No commits found in range. Nothing to add to changelog.');
    process.exit(0);
  }

  const parsed = commits.map(parseCommit).filter(Boolean);
  const relevant = parsed.filter((c) => SECTION_CONFIG.some((s) => s.type === c.type) || c.breaking);

  if (!relevant.length) {
    console.log('No conventional commits found in range. Nothing to add to changelog.');
    process.exit(0);
  }

  console.log(`\nGenerating changelog for v${version}...`);
  console.log(`  Range : ${fromRef || '<beginning>'} → ${toRef}`);
  console.log(`  Commits: ${commits.length} total, ${relevant.length} conventional\n`);

  const newEntry = buildChangelog(version, commits, repoUrl);

  if (preview) {
    console.log('--- PREVIEW ---\n');
    console.log(newEntry);
    return;
  }

  const existing = fs.existsSync(CHANGELOG_PATH)
    ? fs.readFileSync(CHANGELOG_PATH, 'utf8')
    : '';

  const updated = prependToChangelog(newEntry, existing);
  fs.writeFileSync(CHANGELOG_PATH, updated, 'utf8');
  console.log(`✅  CHANGELOG.md updated successfully.`);
}

main();
