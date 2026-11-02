import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { getPostgresPool } from '../server/postgres.js';

dotenv.config();

interface ImagePreviewRecord {
  propertyId: string | number;
  imageUrls: string[];
}

const previewPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('data/property-images.preview.json');

async function checkUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    return `${response.status} ${response.headers.get('content-type') || 'unknown-type'}`;
  } catch {
    return 'unreachable';
  }
}

async function main() {
  const pool = getPostgresPool();
  if (!pool) {
    throw new Error('PostgreSQL is not configured for this local preview.');
  }

  let records: ImagePreviewRecord[];
  try {
    records = JSON.parse(await fs.readFile(previewPath, 'utf8')) as ImagePreviewRecord[];
  } catch {
    throw new Error(`Preview manifest not found: ${previewPath}`);
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Preview manifest must be a non-empty JSON array.');
  }

  console.log(`Local-only image preview: ${previewPath}`);
  console.log('No database changes will be made.');

  for (const record of records) {
    const result = await pool.query(
      'SELECT id, title, location, address FROM properties WHERE id::text = $1 LIMIT 1',
      [String(record.propertyId)]
    );
    const property = result.rows[0];
    if (!property) {
      console.log(`NOT FOUND | propertyId=${record.propertyId}`);
      continue;
    }

    console.log(`PROPERTY | id=${property.id} | title=${property.title} | location=${property.location}`);
    for (const url of record.imageUrls || []) {
      console.log(`IMAGE | ${await checkUrl(url)} | ${url}`);
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
