# Multilingual API Design: Enterprise-grade Patterns

## Executive Summary

This document outlines a comprehensive strategy for implementing multilingual content handling in REST APIs, following industry best practices and enterprise-grade standards. It analyzes the current challenges in the Pika project and proposes a robust, maintainable approach for delivering language-specific content through APIs.

## Current Challenges

1. **Schema Validation Conflicts**: The current implementation attempts to handle both full multilingual objects and language-specific responses with the same schema, causing validation errors.

2. **"es is required!"**: The schema validation requires a specific field ('es') to always be present, which conflicts with the goal of returning streamlined language-specific responses.

3. **Maintainability Issues**: Current approaches mix concerns between schema definition, validation, and transformation logic.

4. **Circular Dependencies**: The implementation has created circular dependencies between packages.

## Industry Standard Approaches

### 1. Content Negotiation (Recommended Primary Approach)

**Overview**: Use HTTP content negotiation via the `Accept-Language` header rather than query parameters.

**Benefits**:

- Follows HTTP standards for content negotiation
- Cleanly separates content formats from business logic
- Backend can provide language-specific views without schema changes
- Well-supported by frameworks and client libraries

**Implementation Pattern**:

```
GET /categories
Accept-Language: en
```

### 2. Dedicated Language-specific Endpoints (Alternative Approach)

**Overview**: Provide separate endpoints for each language or use language prefixes in URLs.

**Examples**:

```
GET /en/categories  # English-specific endpoint
GET /es/categories  # Spanish-specific endpoint
```

**Benefits**:

- Clear separation of concerns
- Simplifies schema validation
- Easier to cache language-specific responses

### 3. Embedded Fields Approach (For Backward Compatibility)

**Overview**: Return fully localized objects where multilingual fields contain the requested language content directly.

**Example Response**:

```json
{
  "id": "123",
  "name": "Product Name in English", // Instead of {es: "...", en: "..."}
  "description": "Description in English"
}
```

## Proposed Architecture

### 1. Separation of Concerns

The multilingual handling should be separated into distinct layers:

1. **Domain Entities**: Store full multilingual data
2. **API DTOs**: Define formats for both full and localized responses
3. **Transformers**: Handle conversion between formats
4. **Content Negotiation Middleware**: Process language preferences

### 2. Schema Definitions

Define separate schemas for different response formats:

1. **Full Multilingual Schema**: Contains complete language objects

   ```typescript
   export const MultilingualCategorySchema = Type.Object({
     id: UUIDSchema,
     name: Type.Object({
       es: Type.String(),
       en: Type.Optional(Type.String()),
       gn: Type.Optional(Type.String()),
     }),
     // ...other fields
   })
   ```

2. **Localized Schema**: Contains language-specific content
   ```typescript
   export const LocalizedCategorySchema = Type.Object({
     id: UUIDSchema,
     name: Type.String(),
     // ...other fields
   })
   ```

### 3. Response Serialization Strategy

Implement a clean serialization strategy that responds with the appropriate format based on the `Accept-Language` header or language query parameter:

```typescript
// Middleware function
function languageHandler(request, reply, done) {
  // Get language preference from header or query param
  const lang = request.headers['accept-language'] ||
               request.query.lang ||
               'es'; // Default

  // Attach to request for use in handlers
  request.preferredLanguage = lang;
  done();
}

// In route handler
function getCategoriesHandler(request, reply) {
  const categories = // ...fetch categories

  if (request.preferredLanguage !== 'all') {
    // Return localized format using the dedicated schema
    reply.send(localizationService.localizeCollection(
      categories,
      request.preferredLanguage
    ));
  } else {
    // Return full multilingual format
    reply.send(categories);
  }
}
```

### 4. Clean Architecture Implementation

1. **Localization Service**: Create a dedicated service for handling transformations
2. **Content Negotiation Middleware**: Process language preferences
3. **Controller Layer**: Focus on orchestration, not transformation
4. **Schema Registry**: Manage schemas for different response formats

## Implementation Plan

### Phase 1: Content Negotiation (MVP)

1. Enhance existing localization utilities in `@pika/shared`
2. Implement middleware for HTTP content negotiation using Accept-Language header
3. Add support for query parameter fallback (`?lang=en`) for backward compatibility
4. Update schema definitions to properly support both formats

### Phase 2: API Enhancements

1. Modify controllers to respect the language preference from Accept-Language
2. Implement proper response transformation based on language
3. Add proper API documentation for language selection
4. Create integration tests to validate behavior

### Phase 3: Client Integration

1. Update frontend to set appropriate Accept-Language headers
2. Ensure resilient handling of language preferences across the application
3. Implement fallback mechanisms for missing translations

## Specific Recommendations for Pika Project

1. **Enhance Shared Package**: Extend the existing localization utilities in `@pika/shared` rather than creating a new package
2. **Use Content Negotiation**: Implement proper HTTP content negotiation with Accept-Language header
3. **Define Clear DTOs**: Separate multilingual DTOs from localized DTOs
4. **Prevent Circular Dependencies**: Ensure packages have a clear dependency direction

## When to Return All Languages vs. Single Language

### Cases for Returning All Languages

1. **Content Management Interfaces**: Admin interfaces where editors need to see and edit all available translations simultaneously
2. **Translation Management**: Tools for translators to compare versions across languages
3. **Data Export**: When exporting data for backup or migration purposes
4. **Caching Considerations**: Sometimes it's more efficient to cache a single multilingual object and let the client extract the needed language

### Cases for Returning Single Language

1. **End-User Interfaces**: Customer-facing applications where users only see content in their preferred language
2. **Performance Optimization**: Reduces payload size, especially important for mobile applications
3. **Simplified Frontend Logic**: No need for language extraction logic in the client
4. **SEO and Accessibility**: Cleaner HTML with direct text rather than extracted from objects

### Recommendation for Pika

For the Pika project, we recommend:

- Use single-language responses for all customer-facing endpoints (via Accept-Language)
- Reserve full multilingual responses for admin/management interfaces
- Implement a consistent approach that can handle both scenarios efficiently

## Impact on Current Implementation

### Code to Retain

1. The basic structure of `localization.ts` with its transformation capabilities
2. The configuration-based approach for specifying multilingual fields

### Code to Remove or Refactor

1. The circular dependencies between SDK and shared packages
2. The direct schema validation in response handlers
3. The mixed-model approach for handling different formats with single schema

### Required New Components

1. Content negotiation middleware
2. Dedicated localization service
3. Separate schema definitions for different response formats

## Expected Benefits

1. **Maintainability**: Clear separation of concerns
2. **Performance**: Better caching opportunities
3. **Extensibility**: Easier to add new languages
4. **Standards Compliance**: Follows HTTP standards
5. **Developer Experience**: Clearer, more consistent API

## Development Log

- 2024-05-08: Created initial analysis document
- 2024-05-08: Identified core issues with current implementation
- 2024-05-08: Researched industry standards for multilingual API design
- 2024-05-08: Drafted comprehensive implementation strategy
