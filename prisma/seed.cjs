const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Buat data role dasar jika belum ada
  const roles = [
    { kode: 'ADMIN', nama: 'Admin Kampus', description: 'Pengelola & Verifikator Sistem' },
    { kode: 'EVENT_OWNER', nama: 'Event Owner', description: 'Penyelenggara Acara / Ormawa' },
    { kode: 'USER', nama: 'Peserta', description: 'Mahasiswa / Peserta Acara' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { kode: role.kode },
      update: {},
      create: role,
    });
  }

  console.log('Seeding data role berhasil!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });