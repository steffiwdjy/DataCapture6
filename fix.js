const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Replace table columns
code = code.replace(/r\.user_email/g, 'r.user_pengguna_id');
code = code.replace(/r\.diedit_oleh/g, 'r.editor_pengguna_id');
code = code.replace(/u\.user_email/g, 'u.user_pengguna_id');

code = code.replace(/user_email\s*=\s*\?/g, 'user_pengguna_id = ?');
code = code.replace(/diedit_oleh\s*=\s*\?/g, 'editor_pengguna_id = ?');
code = code.replace(/user_email,/g, 'user_pengguna_id,');
code = code.replace(/user_email\s+as/g, 'user_pengguna_id as');
code = code.replace(/GROUP BY user_email/g, 'GROUP BY user_pengguna_id');

// violations
code = code.replace(/uploaded_by/g, 'pengguna_id');

// JS properties
code = code.replace(/req\.user\.email/g, 'req.user.id');
code = code.replace(/user\.email/g, 'user.id');
code = code.replace(/changedFields\.diedit_oleh/g, 'changedFields.editor_pengguna_id');

// specific variables
code = code.replace(/req\.body\.agent_email/g, 'req.body.agent_id');
code = code.replace(/let agent_email\s*=\s*req\.user\.id;/g, 'let agent_id = req.user.id;');
code = code.replace(/agent_email\s*=\s*req\.body\.agent_id;/g, 'agent_id = req.body.agent_id;');
code = code.replace(/resolvedAgentEmail/g, 'resolvedAgentId');
code = code.replace(/agent_email\s+as\s+agent_email/g, 'user_pengguna_id as agent_id');

// In log queries: email to pengguna_id
code = code.replace(/email,\s*rental_id/g, 'pengguna_id, rental_id');

fs.writeFileSync('app.js', code);
console.log('Fixed app.js successfully');
