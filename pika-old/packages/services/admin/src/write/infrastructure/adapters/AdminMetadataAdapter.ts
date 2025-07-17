/**
 * Temporary adapter to handle admin metadata storage
 * Since User model doesn't have metadata field, we store admin-specific data
 * in memory for now. This should be replaced with a proper Admin table.
 */
export class AdminMetadataAdapter {
  // Temporary in-memory storage for admin metadata
  private static adminMetadata = new Map<string, any>()

  /**
   * Store admin metadata
   */
  static setMetadata(userId: string, metadata: any): void {
    this.adminMetadata.set(userId, metadata)
  }

  /**
   * Get admin metadata
   */
  static getMetadata(userId: string): any {
    return this.adminMetadata.get(userId) || {}
  }

  /**
   * Delete admin metadata
   */
  static deleteMetadata(userId: string): void {
    this.adminMetadata.delete(userId)
  }

  /**
   * Extract admin-specific fields from user metadata
   */
  static extractAdminFields(metadata: any): {
    adminRole?: string
    adminPermissions?: string[]
    adminCreatedBy?: string | null
  } {
    return {
      adminRole: metadata?.adminRole,
      adminPermissions: metadata?.adminPermissions || [],
      adminCreatedBy: metadata?.adminCreatedBy || null,
    }
  }

  /**
   * Merge admin fields into metadata
   */
  static mergeAdminFields(
    existingMetadata: any,
    adminRole?: string,
    adminPermissions?: string[],
    adminCreatedBy?: string | null,
  ): any {
    return {
      ...existingMetadata,
      adminRole,
      adminPermissions,
      adminCreatedBy,
    }
  }
}