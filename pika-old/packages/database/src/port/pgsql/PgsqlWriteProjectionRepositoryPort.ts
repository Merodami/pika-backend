export interface PgsqlWriteProjectionRepositoryPort<TDto> {
  saveProjection(
    dtoData: TDto,
    mapToDocument: (dto: TDto) => Record<string, any>,
  ): Promise<string>

  updateProjection<T extends TDto>(
    id: string,
    changes: Partial<T>,
    allowedFields: Array<keyof T>,
    errorCode: string,
    errorMessage: string,
  ): Promise<void>

  softDelete(id: string, errorCode: string, errorMessage: string): Promise<void>
}
