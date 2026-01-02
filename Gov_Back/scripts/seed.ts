import bcrypt from 'bcrypt';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../src/db/prisma';
// import { DeterministicHashEmbedding } from '../src/modules/semantic/embeddingProvider';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // ----------------- Admin seed -----------------
  const username = 'admin';
  const password = 'admin1234';

  const adminExists = await prisma.adminUser.findUnique({
    where: { username }
  });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.adminUser.create({
      data: {
        id: 'ADMIN_DEFAULT',
        username,
        passwordHash,
        role: 'admin'
      }
    });

    console.log(`✅ Created admin: ${username} / ${password}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${username}`);
  }

  // ----------------- Load seed JSON -----------------
  // const provider = new DeterministicHashEmbedding(128);
  const seedPath = path.join(__dirname, 'data_collection.seed.json');
  const seedRaw = fs.readFileSync(seedPath, 'utf-8');
  const parsed = JSON.parse(seedRaw);

  // supports either: [ ... ] OR { services: [ ... ] }
  const seedServicesRaw: any[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.services)
      ? parsed.services
      : [];

  const seedServices = seedServicesRaw.filter((x) => x && typeof x === 'object');

  console.log('Seeding services count:', seedServices.length);

  // ----------------- Seed Services -----------------
  for (const s of seedServices) {
    if (!s.id) {
      console.warn('⚠️ Service skipped (missing id):', s?.canonical_name);
      continue;
    }

    const feesText = s.fees_text ?? '';

    const searchText = `
${s.canonical_name ?? ''}
${s.description ?? ''}
${s.search_text ?? ''}
${feesText}
    `.trim();

    const voiceText =
      s.voice_text ??
      `${s.canonical_name ?? ''}${feesText ? ` — الرسوم: ${feesText}` : ''}`;

    // const embedding = await provider.embed(searchText);

    await prisma.service.upsert({
      where: { id: s.id },
      update: {
        canonicalName: s.canonical_name ?? '',
        description: s.description ?? '',
        searchText,
        voiceText,
        // embedding,
        price: s.price ?? null,
        currency: s.currency ?? 'JOD',
        isActive: s.is_active ?? true
      },
      create: {
        id: s.id,
        canonicalName: s.canonical_name ?? '',
        description: s.description ?? '',
        searchText,
        voiceText,
        // embedding,
        price: s.price ?? null,
        currency: s.currency ?? 'JOD',
        isActive: s.is_active ?? true
      }
    });
  }

  // ----------------- Seed Service Documents (from root "service_documents") -----------------
  const seedDocumentsRaw: any[] = Array.isArray(parsed?.service_documents)
    ? parsed.service_documents
    : [];

  const seedDocuments = seedDocumentsRaw.filter((x) => x && typeof x === 'object');

  console.log('Seeding service documents count:', seedDocuments.length);

  // امسح الوثائق القديمة ثم أعد زرعها
  await prisma.serviceDocument.deleteMany({});

  // تحقق أن service_id موجود
  const existingServiceIds = new Set(
    (await prisma.service.findMany({ select: { id: true } })).map((x) => x.id)
  );

  const docsToInsert = seedDocuments
    .filter((d) => {
      if (!d.id) {
        console.warn('⚠️ Document skipped (missing id):', d);
        return false;
      }
      if (!d.service_id) {
        console.warn('⚠️ Document skipped (missing service_id):', d.id);
        return false;
      }
      const ok = existingServiceIds.has(d.service_id);
      if (!ok) {
        console.warn('⚠️ Document skipped (service not found):', d.id, d.service_id);
      }
      return ok;
    })
    .map((d) => ({
      id: d.id,
      serviceId: d.service_id,
      documentName: d.document_name ?? `Document`,
      documentType: d.document_type ?? 'OTHER',
      description: d.description ?? null,
      voiceText: d.voice_text ?? d.document_name ?? `Document`,
      sortOrder: d.sort_order ?? 1,
      isRequired: d.is_required ?? true
    }));

  if (docsToInsert.length) {
    await prisma.serviceDocument.createMany({
      data: docsToInsert,
      skipDuplicates: true
    });
  }

  console.log('🎉 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
