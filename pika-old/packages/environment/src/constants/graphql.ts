import { getEnvVariable } from '../getEnvVariable.js'

export const GRAPHQL_GATEWAY_URL = getEnvVariable(
  'GRAPHQL_GATEWAY_URL',
  String,
  'http://localhost:4001',
)
export const GRAPHQL_GATEWAY_HEALTH_URL = getEnvVariable(
  'GRAPHQL_GATEWAY_HEALTH_URL',
  String,
  'http://localhost:9668',
)
