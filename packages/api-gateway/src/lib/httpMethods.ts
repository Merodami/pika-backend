// const VALID_HTTP_METHODS = [
//   'get',
//   'post',
//   'put',
//   'patch',
//   'delete',
//   'head',
//   'options',
//   'trace',
//   'x-amazon-apigateway-any-method',
// ] as const

// export type HTTPMethodLowercase = (typeof VALID_HTTP_METHODS)[number]
// export type HTTPMethodUppercase = Uppercase<HTTPMethodLowercase>
// type HTTPMethod = HTTPMethodLowercase | HTTPMethodUppercase

// export const isValidHttpMethod = (method: string): method is HTTPMethod => {
//   return VALID_HTTP_METHODS.includes(method.toLowerCase() as any)
// }
