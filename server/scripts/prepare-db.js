const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Replace SQLite provider with PostgreSQL provider
  if (schema.includes('provider = "sqlite"')) {
    schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('🎉 Prisma schema successfully updated to use "postgresql" provider!');
  } else {
    console.log('ℹ️ Prisma schema already uses "postgresql" or was already processed.');
  }
} catch (error) {
  console.error('❌ Failed to prepare Prisma schema for production:', error);
  process.exit(1);
}
