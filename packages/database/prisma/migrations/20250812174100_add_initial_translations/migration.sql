-- Initial Languages
INSERT INTO i18n.languages (code, name, direction, is_default, is_active, created_at, updated_at) VALUES
    ('es', 'Español', 'ltr', true, true, NOW(), NOW()),
    ('en', 'English', 'ltr', false, true, NOW(), NOW()),
    ('gn', 'Guaraní', 'ltr', false, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    direction = EXCLUDED.direction,
    is_default = EXCLUDED.is_default,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Initial Translations for Email Templates  
-- Note: The id field uses cuid() which we'll generate using gen_random_uuid() for simplicity
INSERT INTO i18n.translations (id, key, language_code, value, service, created_at, updated_at) VALUES
    -- Welcome Email
    (gen_random_uuid(), 'email.welcome.subject', 'es', 'Bienvenido a Pika!', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.welcome.subject', 'en', 'Welcome to Pika!', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.welcome.subject', 'gn', 'Tereg̃uahẽporãite Pika-pe!', 'email', NOW(), NOW()),
    
    (gen_random_uuid(), 'email.welcome.greeting', 'es', 'Hola {{name}},', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.welcome.greeting', 'en', 'Hello {{name}},', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.welcome.greeting', 'gn', 'Mba''éichapa {{name}},', 'email', NOW(), NOW()),
    
    -- Verification Email
    (gen_random_uuid(), 'email.verification.subject', 'es', 'Verifica tu correo electrónico', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.verification.subject', 'en', 'Verify your email', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.verification.subject', 'gn', 'Emboaje ne correo electrónico', 'email', NOW(), NOW()),
    
    (gen_random_uuid(), 'email.verification.button', 'es', 'Verificar Correo', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.verification.button', 'en', 'Verify Email', 'email', NOW(), NOW()),
    (gen_random_uuid(), 'email.verification.button', 'gn', 'Emboaje Correo', 'email', NOW(), NOW())
ON CONFLICT (key, language_code) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();