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
  console.log('🗑️  Clearing database...');
  
  // Delete all data in order
  await prisma.orderItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.oTP.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.tenant.deleteMany();

  console.log('✅ Database cleared');
  console.log('🌱 Seeding database...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Superadmin
  const superadmin = await prisma.adminUser.create({
    data: {
      email: 'superadmin@canteen.com',
      password: hashedPassword,
      role: 'SUPERADMIN',
      tenant_id: null,
    },
  });
  console.log('✅ Superadmin created:', superadmin.email);

  // Create Tenant 1: Campus Canteen
  const tenant1 = await prisma.tenant.create({
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

  const admin1 = await prisma.adminUser.create({
    data: {
      email: 'admin@campus.com',
      password: hashedPassword,
      role: 'ADMIN',
      tenant_id: tenant1.id,
    },
  });
  console.log('✅ Tenant 1 created:', tenant1.name, '| Admin:', admin1.email);

  // Create Categories for Tenant 1
  const cat1_beverages = await prisma.category.create({
    data: { tenant_id: tenant1.id, name: 'Beverages', slug: 'beverages', sort_order: 1, is_active: true },
  });
  const cat1_snacks = await prisma.category.create({
    data: { tenant_id: tenant1.id, name: 'Snacks', slug: 'snacks', sort_order: 2, is_active: true },
  });
  const cat1_meals = await prisma.category.create({
    data: { tenant_id: tenant1.id, name: 'Meals', slug: 'meals', sort_order: 3, is_active: true },
  });

  // Create Products for Tenant 1
  await prisma.product.createMany({
    data: [
      { tenant_id: tenant1.id, category_id: cat1_beverages.id, name: 'Chai', price: 15, is_available: true, sort_order: 1 },
      { tenant_id: tenant1.id, category_id: cat1_beverages.id, name: 'Coffee', price: 20, is_available: true, sort_order: 2 },
      { tenant_id: tenant1.id, category_id: cat1_beverages.id, name: 'Cold Coffee', price: 40, is_available: true, sort_order: 3 },
      { tenant_id: tenant1.id, category_id: cat1_snacks.id, name: 'Samosa', price: 12, is_available: true, sort_order: 1 },
      { tenant_id: tenant1.id, category_id: cat1_snacks.id, name: 'Vada Pav', price: 18, is_available: true, sort_order: 2 },
      { tenant_id: tenant1.id, category_id: cat1_snacks.id, name: 'Sandwich', price: 35, is_available: true, sort_order: 3 },
      { tenant_id: tenant1.id, category_id: cat1_meals.id, name: 'Thali', price: 80, is_available: true, sort_order: 1 },
      { tenant_id: tenant1.id, category_id: cat1_meals.id, name: 'Biryani', price: 120, is_available: true, sort_order: 2 },
    ],
  });

  // Create Tenant 2: Food Court Express
  const tenant2 = await prisma.tenant.create({
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

  const admin2 = await prisma.adminUser.create({
    data: {
      email: 'admin@foodcourt.com',
      password: hashedPassword,
      role: 'ADMIN',
      tenant_id: tenant2.id,
    },
  });
  console.log('✅ Tenant 2 created:', tenant2.name, '| Admin:', admin2.email);

  // Create Categories for Tenant 2
  const cat2_pizza = await prisma.category.create({
    data: { tenant_id: tenant2.id, name: 'Pizza', slug: 'pizza', sort_order: 1, is_active: true },
  });
  const cat2_burgers = await prisma.category.create({
    data: { tenant_id: tenant2.id, name: 'Burgers', slug: 'burgers', sort_order: 2, is_active: true },
  });
  const cat2_desserts = await prisma.category.create({
    data: { tenant_id: tenant2.id, name: 'Desserts', slug: 'desserts', sort_order: 3, is_active: true },
  });

  // Create Products for Tenant 2
  const products2 = await prisma.product.createMany({
    data: [
      { tenant_id: tenant2.id, category_id: cat2_pizza.id, name: 'Margherita Pizza', price: 180, is_available: true, sort_order: 1 },
      { tenant_id: tenant2.id, category_id: cat2_pizza.id, name: 'Pepperoni Pizza', price: 220, is_available: true, sort_order: 2 },
      { tenant_id: tenant2.id, category_id: cat2_burgers.id, name: 'Veg Burger', price: 80, is_available: true, sort_order: 1 },
      { tenant_id: tenant2.id, category_id: cat2_burgers.id, name: 'Chicken Burger', price: 120, is_available: true, sort_order: 2 },
      { tenant_id: tenant2.id, category_id: cat2_desserts.id, name: 'Ice Cream', price: 50, is_available: true, sort_order: 1 },
      { tenant_id: tenant2.id, category_id: cat2_desserts.id, name: 'Brownie', price: 60, is_available: true, sort_order: 2 },
    ],
  });

  // Get products for orders
  const t1Products = await prisma.product.findMany({ where: { tenant_id: tenant1.id }, take: 3 });
  const t2Products = await prisma.product.findMany({ where: { tenant_id: tenant2.id }, take: 3 });

  // Create Users
  const user1 = await prisma.user.create({
    data: { tenant_id: tenant1.id, phone: '9876543210', name: 'Rahul Sharma' },
  });
  const user2 = await prisma.user.create({
    data: { tenant_id: tenant2.id, phone: '9876543211', name: 'Priya Patel' },
  });

  // Create Orders for Tenant 1
  const order1 = await prisma.order.create({
    data: {
      tenant_id: tenant1.id,
      user_id: user1.id,
      order_number: 'ORD-001',
      customer_name: 'Rahul Sharma',
      customer_phone: '9876543210',
      customer_email: 'rahul@example.com',
      status: 'PENDING',
      payment_status: 'PENDING',
      subtotal: 75,
      platform_fee: 3.75,
      delivery_fee: 0,
      total_amount: 78.75,
      items: {
        create: [
          { product_id: t1Products[0].id, name: t1Products[0].name, price: t1Products[0].price, quantity: 2, subtotal: t1Products[0].price * 2 },
          { product_id: t1Products[1].id, name: t1Products[1].name, price: t1Products[1].price, quantity: 1, subtotal: t1Products[1].price },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      tenant_id: tenant1.id,
      user_id: user1.id,
      order_number: 'ORD-002',
      customer_name: 'Amit Kumar',
      customer_phone: '9876543212',
      customer_email: 'amit@example.com',
      status: 'PENDING',
      payment_status: 'PENDING',
      subtotal: 120,
      platform_fee: 6,
      delivery_fee: 0,
      total_amount: 126,
      items: {
        create: [
          { product_id: t1Products[2].id, name: t1Products[2].name, price: t1Products[2].price, quantity: 3, subtotal: t1Products[2].price * 3 },
        ],
      },
    },
  });

  // Create Orders for Tenant 2
  const order3 = await prisma.order.create({
    data: {
      tenant_id: tenant2.id,
      user_id: user2.id,
      order_number: 'ORD-001',
      customer_name: 'Priya Patel',
      customer_phone: '9876543211',
      customer_email: 'priya@example.com',
      status: 'PENDING',
      payment_status: 'PENDING',
      subtotal: 280,
      platform_fee: 14,
      delivery_fee: 0,
      total_amount: 294,
      items: {
        create: [
          { product_id: t2Products[0].id, name: t2Products[0].name, price: t2Products[0].price, quantity: 1, subtotal: t2Products[0].price },
          { product_id: t2Products[1].id, name: t2Products[1].name, price: t2Products[1].price, quantity: 1, subtotal: t2Products[1].price },
        ],
      },
    },
  });

  console.log('✅ Orders created');
  console.log('\n📋 SEED DATA SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🔐 SUPERADMIN CREDENTIALS:');
  console.log('   Email: superadmin@canteen.com');
  console.log('   Password: password123');
  console.log('\n🏪 STORE 1: Campus Canteen');
  console.log('   Admin Email: admin@campus.com');
  console.log('   Password: password123');
  console.log('   Categories: 3 (Beverages, Snacks, Meals)');
  console.log('   Products: 8');
  console.log('   Orders: 2 (PENDING)');
  console.log('\n🏪 STORE 2: Food Court Express');
  console.log('   Admin Email: admin@foodcourt.com');
  console.log('   Password: password123');
  console.log('   Categories: 3 (Pizza, Burgers, Desserts)');
  console.log('   Products: 6');
  console.log('   Orders: 1 (PENDING)');
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
