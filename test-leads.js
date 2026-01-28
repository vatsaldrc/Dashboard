const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const leads = await prisma.leads.findMany({
    take: 5,
  });
  
  console.log('Sample leads:');
  console.log(JSON.stringify(leads, null, 2));
  
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
