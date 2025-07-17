import { CategoryMapper } from '@pika/sdk'
import { describe, expect, it } from 'vitest'

import { Category } from '../read/domain/entities/Category.js'

describe('Category Domain Entity', () => {
  it('should create a category and convert to DTO', () => {
    const category = new Category({
      id: 'test-id',
      name: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
      description: { en: 'Test desc', es: 'Desc prueba', gn: 'Desc prueba' },
      iconUrl: null,
      slug: 'test',
      parentId: null,
      level: 1,
      path: '/',
      active: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Test toObject method
    const obj = category.toObject()

    expect(obj).toHaveProperty('id', 'test-id')
    expect(obj).toHaveProperty('name')
    expect(obj.name).toEqual({ en: 'Test', es: 'Prueba', gn: 'Prueba' })

    // Test DTO conversion
    const dto = CategoryMapper.toDTO(obj)

    expect(dto).toHaveProperty('id', 'test-id')
    expect(dto).toHaveProperty('name')
    expect(dto).toHaveProperty('icon_url')
    expect(dto).toHaveProperty('parent_id')
  })
})
