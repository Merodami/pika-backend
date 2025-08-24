# Test Images for VoucherBook Development

## Overview

This directory contains test images for development and testing purposes. All images are sourced from Unsplash and are free to use.

## Directory Structure

```
assets/test-images/
├── size-small/          # 400x300px images (thumbnails)
│   ├── business/        # 10 business-related images
│   ├── voucher/         # 10 voucher/discount-related images
│   ├── users/           # 5 user avatar images
│   └── general/         # 5 general placeholder images
└── size-medium/         # 800x600px images (larger previews)
    ├── business/        # Same 10 business images in higher resolution
    ├── voucher/         # Same 10 voucher images in higher resolution
    ├── users/           # Same 5 user avatars in higher resolution
    └── general/         # Same 5 general images in higher resolution
```

## Image Categories

### Business Images (10 total)

- `restaurant-1.jpg` - Restaurant interior
- `cafe-2.jpg` - Coffee shop
- `gym-3.jpg` - Fitness center
- `spa-4.jpg` - Spa/wellness center
- `hotel-5.jpg` - Hotel lobby
- `shop-6.jpg` - Retail store
- `salon-7.jpg` - Beauty salon
- `bakery-8.jpg` - Bakery
- `bar-9.jpg` - Bar/pub
- `cinema-10.jpg` - Movie theater

### Voucher Images (10 total)

- `gift-card-1.jpg` - Gift card concept
- `discount-2.jpg` - Discount/sale imagery
- `sale-3.jpg` - Sale promotion
- `coupon-4.jpg` - Coupon design
- `shopping-5.jpg` - Shopping bags
- `promo-6.jpg` - Promotional content
- `deal-7.jpg` - Special deals
- `offer-8.jpg` - Limited offers
- `rewards-9.jpg` - Rewards program
- `special-10.jpg` - Special promotions

### User Avatar Images (5 total)

- `avatar-1.jpg` - Professional woman
- `avatar-2.jpg` - Professional man
- `avatar-3.jpg` - Young woman
- `avatar-4.jpg` - Young man
- `avatar-5.jpg` - Diverse professional

### General Images (5 total)

- `logo-1.jpg` - Brand/logo concept
- `placeholder-2.jpg` - Generic placeholder
- `background-3.jpg` - Abstract background
- `pattern-4.jpg` - Pattern/texture
- `texture-5.jpg` - Texture background

## Image Specifications

### Size Small (Thumbnails)

- Dimensions: 400x300px (except user avatars which are 400x400px)
- Use case: Thumbnail views, list items, cards
- File size: Optimized for quick loading

### Size Medium (Previews)

- Dimensions: 800x600px (except user avatars which are 800x800px)
- Use case: Detail views, modals, larger displays
- File size: Higher quality for better viewing

## Usage in Development

These images can be used for:

- Testing image upload functionality
- Populating seed data with realistic images
- UI/UX development with proper content
- Responsive image handling testing
- Performance testing with actual image files

## Usage Example

```typescript
// Example usage in seed scripts
const businessImages = [
  'assets/test-images/size-small/business/restaurant-1.jpg',
  'assets/test-images/size-small/business/cafe-2.jpg',
  // ... more images
]

// Example usage in tests
const avatarPath = 'assets/test-images/size-small/users/avatar-1.jpg'
```

## Notes

- All images are from Unsplash and are free to use
- Images are provided in both thumbnail and preview sizes
- Filenames are descriptive for easy identification
- Total images: 58 files (29 unique images in 2 sizes each)
- All images are in JPEG format for compatibility

## Attribution

All images are sourced from [Unsplash](https://unsplash.com) under the Unsplash License, which allows free use for any purpose.
