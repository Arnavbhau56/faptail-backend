import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getTenantIds() {
  console.log('\n📋 TENANT IDs FOR CUSTOMER FRONTEND SETUP');
  console.log('═══════════════════════════════════════════════════\n');

  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      is_open: true,
    },
    orderBy: { created_at: 'asc' },
  });

  if (tenants.length === 0) {
    console.log('❌ No tenants found. Run: npm run seed\n');
    return;
  }

  tenants.forEach((tenant, index) => {
    console.log(`🏪 STORE ${index + 1}: ${tenant.name}`);
    console.log(`   Tenant ID: ${tenant.id}`);
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   Domain: ${tenant.domain}`);
    console.log(`   Status: ${tenant.is_open ? '🟢 Open' : '🔴 Closed'}`);
    console.log('');
    console.log(`   📝 Add to user/.env.local:`);
    console.log(`   NEXT_PUBLIC_TENANT_ID=${tenant.id}`);
    console.log('');
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('💡 Copy the NEXT_PUBLIC_TENANT_ID line for your store\n');
}

getTenantIds()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
