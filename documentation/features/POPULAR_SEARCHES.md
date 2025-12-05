# Popular Searches Feature

## Overview

The Popular Searches feature tracks and displays the most frequently searched terms by users on the VoucherBook platform. This helps users discover trending content and improves the search experience by showing what others are looking for.

## Implementation Date

- **Backend Implementation**: August 27, 2025
- **Frontend Implementation**: Pending

## Technical Specification

### Architecture

The feature follows a clean architecture pattern with automatic search query tracking and analytics storage:

```
User Search → VoucherService → Track Query (Async) → SearchQuery Table
                ↓
         Search Results

Popular API → VoucherService → Get Top Queries → Return Popular Terms
```

### Database Schema

**Table**: `analytics.search_queries`

| Column        | Type         | Description                                 |
| ------------- | ------------ | ------------------------------------------- |
| id            | UUID         | Primary key                                 |
| query         | VARCHAR(255) | Normalized search term (lowercase, trimmed) |
| count         | INTEGER      | Number of times searched                    |
| last_searched | TIMESTAMPTZ  | Last search timestamp                       |
| created_at    | TIMESTAMPTZ  | First search timestamp                      |
| updated_at    | TIMESTAMPTZ  | Last update timestamp                       |

**Indexes**:

- Unique constraint on `query`
- Index on `count DESC` for popular queries retrieval
- Index on `last_searched` for recent queries
- Index on `query` for upsert operations

### API Endpoints

#### GET /vouchers/search/popular

Returns the most popular search terms.

**Authentication**: None (public endpoint)

**Response**:

```json
{
  "searches": ["concerts", "restaurants", "cinema", "rooftops", "exhibitions", "tango shows", "food tours", "candlelight"]
}
```

**Caching**: 6 hours (Redis)

### Configuration

| Environment Variable   | Default | Description                                  |
| ---------------------- | ------- | -------------------------------------------- |
| POPULAR_SEARCHES_LIMIT | 8       | Maximum number of popular searches to return |

### Implementation Details

#### Search Tracking

1. **Automatic Tracking**: When users search vouchers via `GET /vouchers?search=term`, the query is automatically tracked
2. **Fire-and-Forget**: Tracking is asynchronous and doesn't block the search response
3. **Normalization**: Queries are normalized (lowercase, trimmed) before storage
4. **Filtering**: Queries shorter than 2 characters are ignored
5. **Upsert Logic**: Uses PostgreSQL `ON CONFLICT` to increment count for existing queries

#### Popular Searches Retrieval

1. **Query**: Orders by count (DESC) and last_searched (DESC) for tie-breaking
2. **Limit**: Configurable via environment variable (default: 8)
3. **Caching**: Results cached for 6 hours to reduce database load
4. **Error Handling**: Returns empty array on any database errors

### Code Organization

```
packages/
├── api/src/schemas/voucher/public/
│   └── voucher.ts                    # PopularSearchesResponse schema
├── environment/src/constants/
│   └── search.ts                      # POPULAR_SEARCHES_LIMIT constant
├── services/voucher/
│   ├── src/controllers/
│   │   └── VoucherController.ts      # getPopularSearches endpoint
│   ├── src/services/
│   │   └── VoucherService.ts         # Business logic & tracking
│   ├── src/repositories/
│   │   └── VoucherRepository.ts      # Database operations
│   ├── src/routes/
│   │   └── VoucherRoutes.ts          # Route registration
│   └── src/test/integration/
│       └── voucher.admin.integration.test.ts  # Integration tests
└── database/prisma/models/
    └── voucher.prisma                 # SearchQuery model
```

### Security Considerations

1. **SQL Injection Protection**: Uses parameterized queries
2. **Rate Limiting**: Inherits from API Gateway rate limiting
3. **Privacy**: No user-specific data is tracked, only anonymous search terms
4. **Normalization**: Prevents duplicate entries with different casing

### Performance Optimizations

1. **Asynchronous Tracking**: Search tracking doesn't impact search response time
2. **Database Indexes**: Optimized for both write (upsert) and read (top queries) operations
3. **Redis Caching**: 6-hour cache reduces database load
4. **Efficient SQL**: Single upsert query for tracking, single select for retrieval

### Testing

Comprehensive integration tests covering:

- Empty state handling
- Search query tracking and counting
- Query normalization (case, whitespace)
- Environment variable limits
- Short query filtering
- Database error handling
- Public access (no auth)
- Cache behavior

All tests passing as of implementation date.

### Future Enhancements

1. **Personalization**: Track user-specific popular searches
2. **Time-based Trends**: Show trending searches over different time periods
3. **Category-specific**: Popular searches per category
4. **Search Suggestions**: Auto-complete based on popular searches
5. **Analytics Dashboard**: Admin panel to view search analytics
6. **Decay Algorithm**: Weight recent searches more heavily than old ones
7. **Stop Words**: Filter common words that don't add search value
8. **Synonyms**: Group similar search terms together

### Related Features

- **Search Functionality**: Core voucher search system
- **Analytics System**: Part of broader analytics infrastructure
- **Cache System**: Leverages platform-wide Redis caching

### Dependencies

- PostgreSQL (analytics schema)
- Redis (caching)
- Prisma ORM (database access)
- Express.js (HTTP routing)
- Zod (schema validation)

### Monitoring

Key metrics to track:

- Number of unique search terms
- Search frequency distribution
- Cache hit rate
- Query response time
- Error rate for tracking failures

### Rollback Plan

If issues arise:

1. Disable tracking by removing the tracking call in VoucherService
2. Return empty array from popular searches endpoint
3. No database migration rollback needed (additive change)

## Contact

- **Backend Implementation**: Completed
- **Frontend Integration**: Pending
- **Product Owner**: VoucherBook Team
- **Technical Lead**: Engineering Team
