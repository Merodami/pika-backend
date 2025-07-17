import { Type } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

export const EntityRefSchema = Type.Object({
  entityType: Type.String({ minLength: 1, maxLength: 50 }),
  entityId: Type.String({ minLength: 36, maxLength: 36 }),
})

export type EntityRefType = typeof EntityRefSchema.static

export class EntityRef {
  private constructor(
    public readonly entityType: string,
    public readonly entityId: string,
  ) {}

  static create(data: EntityRefType): EntityRef {
    if (!Value.Check(EntityRefSchema, data)) {
      throw new Error('Invalid EntityRef data')
    }

    return new EntityRef(data.entityType, data.entityId)
  }

  toString(): string {
    return `${this.entityType}:${this.entityId}`
  }

  equals(other: EntityRef): boolean {
    return (
      this.entityType === other.entityType && this.entityId === other.entityId
    )
  }
}
