import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database (safe mode - only inserts missing data)...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Superadmin if not exists
  let superadmin = await prisma.adminUser.findFirst({
    where: { email: 'superadmin@canteen.com' }
  });
  if (!superadmin) {
    superadmin = await prisma.adminUser.create({
      data: {
        email: 'superadmin@canteen.com',
        password: hashedPassword,
        role: 'SUPERADMIN',
        tenant_id: null,
      },
    });
    console.log('✅ Superadmin created:', superadmin.email);
  } else {
    console.log('⏭️  Superadmin already exists');
  }

  // Create Tenant 1 if not exists
  let tenant1 = await prisma.tenant.findFirst({
    where: { slug: 'campus-canteen' }
  });
  if (!tenant1) {
    tenant1 = await prisma.tenant.create({
      data: {
        slug: 'campus-canteen',
        name: 'Campus Canteen',
        domain: 'campus.localhost',
        address: '123 University Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        gst_number: '27AABCU9603R1ZM',
        is_open: true,
        credits: 500,
        credit_per_order_pct: 2,
      },
    });
    console.log('✅ Tenant 1 created:', tenant1.name);
  } else {
    console.log('⏭️  Tenant 1 already exists');
  }

  // Create Admin 1 if not exists
  let admin1 = await prisma.adminUser.findFirst({
    where: { email: 'admin@campus.com' }
  });
  if (!admin1) {
    admin1 = await prisma.adminUser.create({
      data: {
        email: 'admin@campus.com',
        password: hashedPassword,
        role: 'ADMIN',
        tenant_id: tenant1.id,
      },
    });
    console.log('✅ Admin 1 created:', admin1.email);
  } else {
    console.log('⏭️  Admin 1 already exists');
  }

  // Create Categories for Tenant 1 if not exist
  let cat1_beverages = await prisma.category.findFirst({
    where: { tenant_id: tenant1.id, slug: 'beverages' }
  });
  if (!cat1_beverages) {
    cat1_beverages = await prisma.category.create({
      data: { tenant_id: tenant1.id, name: 'Beverages', slug: 'beverages', sort_order: 1, is_active: true },
    });
  }

  let cat1_snacks = await prisma.category.findFirst({
    where: { tenant_id: tenant1.id, slug: 'snacks' }
  });
  if (!cat1_snacks) {
    cat1_snacks = await prisma.category.create({
      data: { tenant_id: tenant1.id, name: 'Snacks', slug: 'snacks', sort_order: 2, is_active: true },
    });
  }

  let cat1_meals = await prisma.category.findFirst({
    where: { tenant_id: tenant1.id, slug: 'meals' }
  });
  if (!cat1_meals) {
    cat1_meals = await prisma.category.create({
      data: { tenant_id: tenant1.id, name: 'Meals', slug: 'meals', sort_order: 3, is_active: true },
    });
  }

  // Create Products for Tenant 1 if not exist
  const productNames = ['Chai', 'Coffee', 'Cold Coffee', 'Samosa', 'Vada Pav', 'Sandwich', 'Thali', 'Biryani'];
  for (const name of productNames) {
    const exists = await prisma.product.findFirst({
      where: { tenant_id: tenant1.id, name }
    });
    if (!exists) {
      const categoryMap: { [key: string]: string } = {
        'Chai': cat1_beverages.id, 'Coffee': cat1_beverages.id, 'Cold Coffee': cat1_beverages.id,
        'Samosa': cat1_snacks.id, 'Vada Pav': cat1_snacks.id, 'Sandwich': cat1_snacks.id,
        'Thali': cat1_meals.id, 'Biryani': cat1_meals.id
      };
      const priceMap: { [key: string]: number } = {
        'Chai': 15, 'Coffee': 20, 'Cold Coffee': 40, 'Samosa': 12, 'Vada Pav': 18, 'Sandwich': 35, 'Thali': 80, 'Biryani': 120
      };
      await prisma.product.create({
        data: {
          tenant_id: tenant1.id,
          category_id: categoryMap[name],
          name,
          price: priceMap[name],
          is_available: true,
        },
      });
    }
  }
  console.log('✅ Products for Tenant 1 ensured');

  // Create Tenant 2 if not exists
  let tenant2 = await prisma.tenant.findFirst({
    where: { slug: 'food-court' }
  });
  if (!tenant2) {
    tenant2 = await prisma.tenant.create({
      data: {
        slug: 'food-court',
        name: 'Food Court Express',
        domain: 'foodcourt.localhost',
        address: '456 Mall Complex',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        gst_number: '29AABCU9603R1ZN',
        is_open: true,
        credits: 750,
        credit_per_order_pct: 1.5,
      },
    });
    console.log('✅ Tenant 2 created:', tenant2.name);
  } else {
    console.log('⏭️  Tenant 2 already exists');
  }

  // Create Admin 2 if not exists
  let admin2 = await prisma.adminUser.findFirst({
    where: { email: 'admin@foodcourt.com' }
  });
  if (!admin2) {
    admin2 = await prisma.adminUser.create({
      data: {
        email: 'admin@foodcourt.com',
        password: hashedPassword,
        role: 'ADMIN',
        tenant_id: tenant2.id,
      },
    });
    console.log('✅ Admin 2 created:', admin2.email);
  } else {
    console.log('⏭️  Admin 2 already exists');
  }

  console.log('\n📋 SEED DATA SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🔐 SUPERADMIN CREDENTIALS:');
  console.log('   Email: superadmin@canteen.com');
  console.log('   Password: password123');
  console.log('\n🏪 STORE 1: Campus Canteen');
  console.log('   Tenant ID:', tenant1.id);
  console.log('   Admin Email: admin@campus.com');
  console.log('   Password: password123');
  console.log('\n🏪 STORE 2: Food Court Express');
  console.log('   Tenant ID:', tenant2.id);
  console.log('   Admin Email: admin@foodcourt.com');
  console.log('   Password: password123');
  console.log('\n═══════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
