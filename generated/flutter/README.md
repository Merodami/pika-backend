# Generated Flutter Types

This directory contains automatically generated Dart types from your Zod schemas.

## 📊 Generation Stats

- **7** Dart files
- **0** classes
- **0** enums  
- **118** serialization methods

## 📁 Structure

\`\`\`
lib/generated/api/
├── auth_login.dart          # Authentication login types
├── auth_register.dart       # Authentication registration types
├── business_business.dart   # Business management types
├── category_category.dart   # Category types
├── user_profile.dart        # User profile types
└── voucher_voucher.dart     # Voucher types
\`\`\`

## 🚀 Usage in Flutter

\`\`\`dart
import 'package:your_app/generated/api/auth_login.dart';

// Use the generated types
final authResponse = AuthLogin.fromJson(jsonData);
print(authResponse.accessToken);
\`\`\`

## 🔄 Regeneration

To regenerate these types after updating your Zod schemas:

\`\`\`bash
# From the backend directory
yarn generate:flutter-types
\`\`\`

---
*Generated automatically from Zod schemas using native z.toJSONSchema() and QuickType*
