const fs = require('fs');

async function testHttpUpload() {
  const serverUrl = 'http://localhost:5000';
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const username = `user_${randomSuffix}`;
  const email = `user_${randomSuffix}@example.com`;
  const password = 'testpassword123';

  console.log(`1. Registering user: ${username}...`);
  const regRes = await fetch(`${serverUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  if (!regRes.ok) {
    const errorText = await regRes.text();
    throw new Error(`Registration failed: ${regRes.status} - ${errorText}`);
  }
  const regData = await regRes.json();
  const token = regData.token;
  console.log(`✅ Registered user. Token retrieved.`);

  console.log(`2. Creating VocabSet...`);
  const setRes = await fetch(`${serverUrl}/api/vocabulary/sets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: `SQL & Database (HTTP Test ${randomSuffix})`, description: 'Created via integration test' })
  });
  if (!setRes.ok) {
    const errorText = await setRes.text();
    throw new Error(`VocabSet creation failed: ${setRes.status} - ${errorText}`);
  }
  const setData = await setRes.json();
  const vocabSetId = setData._id;
  console.log(`✅ Created VocabSet with ID: ${vocabSetId}`);

  console.log(`3. Uploading PDF file...`);
  const pdfPath = '../Từ Vựng Tiếng Anh Chuyên Ngành SQL & Database v2.pdf';
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found at ${pdfPath}`);
  }
  const fileBlob = new Blob([fs.readFileSync(pdfPath)], { type: 'application/pdf' });
  
  const formData = new FormData();
  formData.append('pdf', fileBlob, 'sql_database.pdf');
  formData.append('vocabSetId', vocabSetId);

  const uploadRes = await fetch(`${serverUrl}/api/vocabulary/upload-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Upload failed: ${uploadRes.status} - ${errorText}`);
  }

  const uploadData = await uploadRes.json();
  console.log(`\n✅ UPLOAD SUCCESSFUL!`);
  console.log(`Response message: ${uploadData.message}`);
  console.log(`Word count imported: ${uploadData.count}`);
  console.log(`Groups detected: ${uploadData.groups.join(', ')}`);
  
  if (uploadData.count === 45) {
    console.log(`\n🎉 HTTP END-TO-END TEST PASSED SUCCESSFULLY!`);
  } else {
    console.error(`\n❌ HTTP END-TO-END TEST FAILED: expected 45 words, got ${uploadData.count}`);
    process.exit(1);
  }
}

testHttpUpload().catch(err => {
  console.error("❌ HTTP TEST RUNNER ERROR:", err);
  process.exit(1);
});
