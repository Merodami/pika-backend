import { OpenAPIV3 } from 'openapi-types'

export const EventIdParam: OpenAPIV3.ParameterObject = {
  name: 'eventId',
  in: 'path',
  required: true,
  description: 'Unique identifier of a specific event log entry',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  },
  example: '123e4567-e89b-12d3-a456-426614174000',
}

export const EventTypeParam: OpenAPIV3.ParameterObject = {
  name: 'eventType',
  in: 'query',
  required: false,
  description: 'Filter events by event type',
  schema: {
    type: 'string',
    enum: [
      'SESSION_STARTED',
      'SESSION_ENDED',
      'SERVICE_REQUEST_CREATED',
      'SERVICE_REQUEST_ACKNOWLEDGED',
      'SERVICE_REQUEST_RESOLVED',
    ],
  },
  examples: {
    session_only: {
      summary: 'Filter by session events',
      value: 'SESSION_STARTED',
    },
  },
}
