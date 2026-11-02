import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

const emailArg = process.argv.find((value) => value.startsWith('--email='));
const email = (emailArg?.split('=', 2)[1] || process.env.LOCAL_DEMO_STAFF_EMAIL || 'rashid.alfalasi@lykarealty.ae').trim().toLowerCase();
const environmentPassword = process.env.LOCAL_DEMO_STAFF_PASSWORD?.trim();
const temporaryPassword = environmentPassword || crypto.randomBytes(24).toString('base64url');

const databasePath = path.resolve(process.cwd(), 'data', 'crm_db.json');
const database = JSON.parse(fs.readFileSync(databasePath, 'utf8')) as {
  users: Array<{ id: string; email: string; passwordHash: string; role: string; name: string }>;
};

const user = database.users.find((entry) => entry.email.toLowerCase() === email);
if (!user) {
  throw new Error(`Local account not found for ${email}. No account was created.`);
}
if (!['sales_agent', 'admin', 'super_admin', 'manager'].includes(user.role)) {
  throw new Error(`The local account has role ${user.role}, not an authorized staff role.`);
}

user.passwordHash = bcrypt.hashSync(temporaryPassword, 12);
const temporaryPath = `${databasePath}.tmp`;
fs.writeFileSync(temporaryPath, JSON.stringify(database, null, 2), 'utf8');
fs.renameSync(temporaryPath, databasePath);

const privateReportPath = path.resolve(
  'C:\\Users\\smani\\.copilot\\session-state\\c3ce25bf-cdc8-4bc3-9341-7e0d338b78b8\\files',
  'local-staff-credentials.json'
);
fs.mkdirSync(path.dirname(privateReportPath), { recursive: true });
let privateReport: Array<{ email: string; role: string; name: string; temporaryPassword: string }> = [];
if (fs.existsSync(privateReportPath)) {
  const existingReport = JSON.parse(fs.readFileSync(privateReportPath, 'utf8'));
  privateReport = Array.isArray(existingReport) ? existingReport : [existingReport];
}
privateReport = privateReport.filter((entry) => entry.email !== email);
privateReport.push({
  email,
  role: user.role,
  name: user.name,
  temporaryPassword
});
fs.writeFileSync(privateReportPath, JSON.stringify(privateReport, null, 2), 'utf8');

const privateDisplayReportPath = path.resolve(
  'C:\\Users\\smani\\.copilot\\session-state\\c3ce25bf-cdc8-4bc3-9341-7e0d338b78b8\\files',
  'local-staff-credentials-private-report.json'
);
let displayReport: Array<{
  role: string;
  name: string | null;
  email: string | null;
  accountExists: boolean;
  active: boolean;
  temporaryPassword: string;
}> = [];
if (fs.existsSync(privateDisplayReportPath)) {
  displayReport = JSON.parse(fs.readFileSync(privateDisplayReportPath, 'utf8')) as typeof displayReport;
}
const displayRole = user.role === 'sales_agent'
  ? 'Sales Agent'
  : user.role === 'admin'
    ? 'Admin'
    : user.role === 'super_admin'
      ? 'Super Admin'
      : 'Manager';
displayReport = displayReport.filter((entry) => entry.role !== displayRole);
displayReport.push({
  role: displayRole,
  name: user.name,
  email: user.email,
  accountExists: true,
  active: true,
  temporaryPassword
});
fs.writeFileSync(privateDisplayReportPath, JSON.stringify(displayReport, null, 2), 'utf8');

console.log(`Configured bcrypt password for local account ${email} (${user.role}).`);
console.log('Temporary credentials were written only to the private session report.');
