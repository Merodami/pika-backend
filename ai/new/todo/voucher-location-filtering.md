# TODO: Implement Voucher Location Filtering

## Task

Implement geospatial filtering for vouchers using PostGIS in the PrismaVoucherReadRepository.

## Location

`packages/services/voucher/src/read/infrastructure/persistence/pgsql/repositories/PrismaVoucherReadRepository.ts`

## Current Issue

The voucher search supports location parameters (latitude, longitude, radius) but the actual PostGIS query implementation is missing. Currently lines 72-84 have a placeholder.

## Implementation Options

1. Use Prisma's raw query feature with PostGIS ST_DWithin function
2. Install a Prisma PostGIS extension if available
3. Create a custom Prisma middleware for location queries

## Example Query

```sql
SELECT * FROM vouchers
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(longitude, latitude)::geography,
  radius_in_meters
)
```

## References

- PostGIS documentation: https://postgis.net/docs/ST_DWithin.html
- Prisma raw queries: https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access
