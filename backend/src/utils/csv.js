// RFC-4180 CSV writer for the admin report exports.

// Excel/Sheets treat a leading =, +, - or @ as the start of a formula, so a
// value like "=cmd|..." pasted into a cell would execute on open. Prefixing
// with a single quote keeps the text readable and inert.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_PREFIX.test(text)) text = `'${text}`;
  if (/[",\r\n]/.test(text)) text = `"${text.replaceAll('"', '""')}"`;
  return text;
}

/**
 * @param {{key: string, label: string}[]} columns
 * @param {object[]} rows
 * @returns {string} CSV text, BOM-prefixed so Excel detects UTF-8.
 */
export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(","));
  return `﻿${[header, ...body].join("\r\n")}\r\n`;
}

// Content-Disposition filenames choke on quotes, commas and non-ASCII.
export function csvFilename(reportType, { from, to } = {}) {
  const stamp = (d) => new Date(d).toISOString().slice(0, 10);
  const window = from || to ? `_${from ? stamp(from) : "start"}_to_${to ? stamp(to) : stamp(Date.now())}` : "";
  return `${reportType.toLowerCase()}${window}_${stamp(Date.now())}.csv`;
}
