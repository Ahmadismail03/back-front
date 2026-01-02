import { prisma } from '../src/db/prisma';
import { AzureEmbeddingProvider } from "../src/modules/semantic/azureEmbeddingProvider";

async function reembedServices() {
  const provider = new AzureEmbeddingProvider();

  const services = await prisma.service.findMany({
    where: { isActive: true },
    select: {
      id: true,
      canonicalName: true,
      description: true,
      searchText: true,
    },
  });

  console.log(`Found ${services.length} services`);

  for (const service of services) {
    const text =
      service.searchText ||
      `${service.canonicalName}\n${service.description ?? ""}`;

    console.log(`Embedding service: ${service.canonicalName}`);

    const embedding = await provider.embed(text);

    await prisma.service.update({
      where: { id: service.id },
      data: { embedding },
    });
  }

  console.log("✅ Re-embedding completed");
}

reembedServices()
  .catch((err) => {
    console.error("❌ Re-embedding failed", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
