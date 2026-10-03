import dotenv from 'dotenv';
import userService from './src/modules/identity-access/services/user.service.js';

dotenv.config();

async function testRegistrationAndEmail() {
  console.log('='.repeat(60));
  console.log('🧪 TESTING REAL USER REGISTRATION & CREDENTIAL EMAIL DISPATCH');
  console.log('='.repeat(60));

  const testEmail = `test.user.${Date.now()}@example.com`;
  const userData = {
    firstName: 'Test',
    lastName: 'Employee',
    email: testEmail,
    jobTitle: 'Software Engineer',
    userTypeCode: 'STAFF'
  };

  const mockActor = {
    userId: 1,
    tenantId: 1,
    userTypeCode: 'SUPER_ADMIN'
  };

  try {
    console.log(`👤 Registering user: ${userData.firstName} ${userData.lastName} (${userData.email})...`);
    const result = await userService.createUser(userData, mockActor);

    console.log('\n✅ USER CREATED IN DATABASE:');
    console.log(`   - UserID:            ${result.UserID}`);
    console.log(`   - Assigned Username: ${result.generatedUsername}`);
    console.log(`   - Temp Password:     ${result.tempPassword}`);
    console.log(`   - Registered Email:  ${result.Email}`);

    console.log('\n📧 EMAIL DISPATCH RESULT:');
    console.log(`   - Email Sent:        ${result.emailSent ? '✅ SUCCESS' : '❌ FAILED'}`);
    if (result.emailError) {
      console.log(`   - Error Details:     ${result.emailError}`);
    }
    if (result.emailPreviewUrl) {
      console.log(`   - Email Preview Link: ${result.emailPreviewUrl}`);
      console.log(`   👉 You can open this link in any browser to see the EXACT delivered email!`);
    }

    console.log('='.repeat(60));
  } catch (err) {
    console.error('❌ Registration test error:', err.message);
  }
}

testRegistrationAndEmail().catch(console.error);
