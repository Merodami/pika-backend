-- Add Essential Backend Translations Migration
-- This migration adds languages and core backend translations (emails and errors)
-- UI translations are handled by the frontend

-- Ensure languages exist (idempotent upsert)
INSERT INTO i18n.languages (code, name, direction, is_default, is_active, created_at, updated_at)
VALUES 
    ('es', 'Español', 'ltr', true, true, NOW(), NOW()),
    ('en', 'English', 'ltr', false, true, NOW(), NOW()),
    ('gn', 'Guaraní', 'ltr', false, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
    updated_at = NOW();

-- Helper function to insert translations safely
CREATE OR REPLACE FUNCTION i18n.upsert_translation(
    p_key TEXT,
    p_language_code TEXT,
    p_value TEXT,
    p_context TEXT DEFAULT NULL,
    p_service TEXT DEFAULT 'backend'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO i18n.translations (key, language_code, value, context, service, created_at, updated_at)
    VALUES (p_key, p_language_code, p_value, p_context, p_service, NOW(), NOW())
    ON CONFLICT (key, language_code) DO UPDATE SET
        value = EXCLUDED.value,
        context = EXCLUDED.context,
        service = EXCLUDED.service,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Email Templates
SELECT i18n.upsert_translation('email.welcome.subject', 'en', 'Welcome to The VoucherBook!');
SELECT i18n.upsert_translation('email.welcome.subject', 'es', '¡Bienvenido a The VoucherBook!');
SELECT i18n.upsert_translation('email.welcome.subject', 'gn', 'Tereg̃ua The VoucherBook-pe!');

SELECT i18n.upsert_translation('email.welcome.greeting', 'en', 'Hello {name}!');
SELECT i18n.upsert_translation('email.welcome.greeting', 'es', '¡Hola {name}!');
SELECT i18n.upsert_translation('email.welcome.greeting', 'gn', 'Mba''éichapa {name}!');

SELECT i18n.upsert_translation('email.welcome.body', 'en', 'Welcome to our voucher marketplace. Start discovering amazing deals!');
SELECT i18n.upsert_translation('email.welcome.body', 'es', 'Bienvenido a nuestro mercado de vouchers. ¡Comienza a descubrir ofertas increíbles!');
SELECT i18n.upsert_translation('email.welcome.body', 'gn', 'Tereg̃ua ore voucher ñemuhã renda. ¡Eñepyrũ ejuhu oferta iporãitéva!');

SELECT i18n.upsert_translation('email.reset_password.subject', 'en', 'Reset Your Password');
SELECT i18n.upsert_translation('email.reset_password.subject', 'es', 'Restablecer tu contraseña');
SELECT i18n.upsert_translation('email.reset_password.subject', 'gn', 'Emoambue ne ñe''ẽñemi');

SELECT i18n.upsert_translation('email.reset_password.body', 'en', 'Click the link below to reset your password. This link expires in 1 hour.');
SELECT i18n.upsert_translation('email.reset_password.body', 'es', 'Haz clic en el enlace a continuación para restablecer tu contraseña. Este enlace expira en 1 hora.');
SELECT i18n.upsert_translation('email.reset_password.body', 'gn', 'Eñemboguejy ko link rehe emoambue hag̃ua ne ñe''ẽñemi. Ko link opáta 1 aravo rire.');

SELECT i18n.upsert_translation('email.voucher_purchased.subject', 'en', 'Your Voucher is Ready!');
SELECT i18n.upsert_translation('email.voucher_purchased.subject', 'es', '¡Tu Voucher está Listo!');
SELECT i18n.upsert_translation('email.voucher_purchased.subject', 'gn', '¡Ne Voucher oĩma!');

SELECT i18n.upsert_translation('email.payment_confirmed.subject', 'en', 'Payment Confirmed');
SELECT i18n.upsert_translation('email.payment_confirmed.subject', 'es', 'Pago Confirmado');
SELECT i18n.upsert_translation('email.payment_confirmed.subject', 'gn', 'Jehepyme''ẽ Oñemoneĩ');

-- Backend Error Messages
SELECT i18n.upsert_translation('error.not_found', 'en', 'Resource not found');
SELECT i18n.upsert_translation('error.not_found', 'es', 'Recurso no encontrado');
SELECT i18n.upsert_translation('error.not_found', 'gn', 'Ndojejuhúi pe mba''e');

SELECT i18n.upsert_translation('error.unauthorized', 'en', 'You are not authorized to perform this action');
SELECT i18n.upsert_translation('error.unauthorized', 'es', 'No estás autorizado para realizar esta acción');
SELECT i18n.upsert_translation('error.unauthorized', 'gn', 'Nderekatúi rejapo ko mba''e');

SELECT i18n.upsert_translation('error.server_error', 'en', 'An error occurred. Please try again later.');
SELECT i18n.upsert_translation('error.server_error', 'es', 'Ocurrió un error. Por favor, intenta más tarde.');
SELECT i18n.upsert_translation('error.server_error', 'gn', 'Oiko peteĩ jejavy. Eha''ãjey ag̃ave.');

SELECT i18n.upsert_translation('error.validation_failed', 'en', 'The provided data is invalid');
SELECT i18n.upsert_translation('error.validation_failed', 'es', 'Los datos proporcionados son inválidos');
SELECT i18n.upsert_translation('error.validation_failed', 'gn', 'Umi dato ome''ẽva ndoikói');

SELECT i18n.upsert_translation('error.email_already_exists', 'en', 'This email is already registered');
SELECT i18n.upsert_translation('error.email_already_exists', 'es', 'Este correo ya está registrado');
SELECT i18n.upsert_translation('error.email_already_exists', 'gn', 'Ko correo oñeregistráma');

SELECT i18n.upsert_translation('error.invalid_credentials', 'en', 'Invalid email or password');
SELECT i18n.upsert_translation('error.invalid_credentials', 'es', 'Correo o contraseña inválidos');
SELECT i18n.upsert_translation('error.invalid_credentials', 'gn', 'Correo térã ñe''ẽñemi ndoikói');

SELECT i18n.upsert_translation('error.token_expired', 'en', 'Your session has expired. Please log in again.');
SELECT i18n.upsert_translation('error.token_expired', 'es', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
SELECT i18n.upsert_translation('error.token_expired', 'gn', 'Ne sesión opáma. Emoñepyrũjey ne sesión.');

SELECT i18n.upsert_translation('error.payment_failed', 'en', 'Payment could not be processed');
SELECT i18n.upsert_translation('error.payment_failed', 'es', 'No se pudo procesar el pago');
SELECT i18n.upsert_translation('error.payment_failed', 'gn', 'Ndaikatúi oñemboguata pe jehepyme''ẽ');

SELECT i18n.upsert_translation('error.voucher_expired', 'en', 'This voucher has expired');
SELECT i18n.upsert_translation('error.voucher_expired', 'es', 'Este voucher ha expirado');
SELECT i18n.upsert_translation('error.voucher_expired', 'gn', 'Ko voucher opáma');

SELECT i18n.upsert_translation('error.voucher_not_available', 'en', 'This voucher is no longer available');
SELECT i18n.upsert_translation('error.voucher_not_available', 'es', 'Este voucher ya no está disponible');
SELECT i18n.upsert_translation('error.voucher_not_available', 'gn', 'Ko voucher ndoĩvéima ojepuru hag̃ua');

-- Drop the helper function
DROP FUNCTION IF EXISTS i18n.upsert_translation;

-- Add a comment to document this migration
COMMENT ON SCHEMA i18n IS 'Internationalization schema for The VoucherBook platform backend services';