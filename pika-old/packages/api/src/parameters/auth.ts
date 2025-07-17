import { OpenAPIV3 } from 'openapi-types'

export const TokenParam: OpenAPIV3.ParameterObject = {
  name: 'token',
  in: 'path',
  required: true,
  description: 'Verification token for email confirmation or password reset',
  schema: {
    type: 'string',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
}
