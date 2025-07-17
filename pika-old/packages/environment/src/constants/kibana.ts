import { getEnvVariable } from '../getEnvVariable.js'
import { parseNumber } from '../parsers.js'

export const KIBANA_PORT = getEnvVariable('KIBANA_PORT', parseNumber, 5601)
