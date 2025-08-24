# Test Images Integration with Database Seeding

## Overview

The test images are now fully integrated with the VoucherBook database seeding process. This allows you to seed the database with realistic data that includes actual image URLs pointing to uploaded files in MinIO storage.

## New Seeding Commands

### With Images

```bash
# Seed all modules with test images
yarn db:seed:dev quick seedWithImages

# Cleanup all modules including images
yarn db:seed:dev quick cleanWithImages
```

### Traditional (Without Images)

```bash
# Regular seeding without images
yarn db:seed:dev quick seedAll

# Regular cleanup
yarn db:seed:dev quick cleanAll
```

## How It Works

### 1. Image Upload Process

When you run `seedWithImages`, the system:

1. **Scans** the `assets/test-images/` directory
2. **Uploads** all images to MinIO storage in organized folders
3. **Returns** categorized image URLs for use in seeding

### 2. Database Integration

- **Businesses**: Get random business images assigned as `logoUrl`
- **Users**: Can get random avatar images (future enhancement)
- **Vouchers**: Can get promotional images (future enhancement)

### 3. Storage Organization

Images are uploaded to MinIO with this structure:

```
test-seed-images/
├── small/
│   ├── business/
│   ├── voucher/
│   ├── users/
│   └── general/
└── medium/
    ├── business/
    ├── voucher/
    ├── users/
    └── general/
```

## Available Image Categories

### Business Images (10 total)

- Restaurant, cafe, gym, spa, hotel, shop, salon, bakery, bar, cinema
- Perfect for business profile pictures and logos

### Voucher Images (10 total)

- Gift cards, discounts, sales, coupons, promotions
- Ideal for voucher thumbnails and promotional graphics

### User Avatars (5 total)

- Professional diverse portraits
- Ready for user profile pictures

### General Images (5 total)

- Logos, placeholders, backgrounds, patterns
- Useful for general app content

## Usage Examples

### Basic Seeding with Images

```bash
# Start with fresh database
yarn db:migrate:deploy

# Seed everything with images
yarn db:seed:dev quick seedWithImages
```

### Development Workflow

```bash
# Reset everything including images
yarn db:seed:dev quick cleanWithImages

# Seed fresh data with new images
yarn db:seed:dev quick seedWithImages
```

### Check What's Seeded

```bash
# Check module status
yarn db:seed:dev check

# Check MinIO storage
yarn open:minio  # http://localhost:9001
```

## Image URLs in Database

After seeding with images, your database will contain:

### Business Records

```json
{
  "id": "business-id",
  "businessNameKey": "dev.business.restaurant.name",
  "logoUrl": "http://localhost:9000/pika-uploads/test-seed-images/small/business/restaurant-1.jpg",
  "verified": true,
  "active": true
}
```

### Future: User Records (Planned)

```json
{
  "id": "user-id",
  "email": "admin@example.com",
  "avatarUrl": "http://localhost:9000/pika-uploads/test-seed-images/small/users/avatar-1.jpg"
}
```

## Benefits

### 🎯 **Realistic Development**

- Test with actual images instead of placeholders
- Validate image loading, caching, and display
- Test responsive image handling

### 🚀 **Complete Testing**

- Frontend can fetch real images from MinIO
- Test image upload/storage workflows
- Validate CDN and caching behavior

### 🛠️ **Easy Management**

- One command seeds everything with images
- Easy cleanup when needed
- Organized storage structure

### 📱 **Mobile Development**

- Flutter app gets realistic images
- Test image caching and offline handling
- Validate different image sizes

## Architecture Integration

### MinIO Storage

- **Endpoint**: `http://localhost:9000`
- **Console**: `http://localhost:9001` (admin: minioadmin/minioadmin)
- **Bucket**: `pika-uploads`
- **Folder**: `test-seed-images/`

### Database Schema

The seeding process creates `FileStorageLog` entries for tracking:

```sql
-- Example storage log entry
INSERT INTO FileStorageLog (
  fileId, fileName, contentType, size, folder,
  url, status, provider, uploadedAt
) VALUES (
  'uuid-here', 'restaurant-1.jpg', 'image/jpeg', 45678,
  'test-seed-images', 'http://localhost:9000/...',
  'uploaded', 'minio', NOW()
);
```

## Extending the System

### Adding New Image Categories

1. Create new folder in `assets/test-images/size-small/` and `size-medium/`
2. Add images to the folders
3. Update `image-seeder.ts` to handle the new category
4. Update seeding modules to use the new images

### Adding Images to Other Modules

```typescript
// Example: Update voucher seeder to use images
export async function seedVouchers(prisma: PrismaClient, images?: ImageSeedingResult): Promise<void> {
  // Use images.voucherImages for voucher thumbnails
  const thumbnailUrl = images ? getRandomVoucherImage(images.voucherImages) : undefined

  await prisma.voucher.create({
    data: {
      // ... other fields
      ...(thumbnailUrl && { thumbnailUrl }),
    },
  })
}
```

## Troubleshooting

### Images Not Uploading

1. Check MinIO is running: `docker ps | grep minio`
2. Verify images exist: `ls -la assets/test-images/`
3. Check MinIO logs: `docker logs pika_minio`

### Database Seeding Fails

1. Check database connection: `yarn db:generate`
2. Run migration: `yarn db:migrate:deploy`
3. Check logs for specific error

### Images Not Displaying

1. Check MinIO console: `yarn open:minio`
2. Verify bucket exists: `pika-uploads`
3. Check image URLs in database records

This integration provides a complete development environment where your application can work with realistic image data from day one!
