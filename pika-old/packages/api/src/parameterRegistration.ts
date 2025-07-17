import { registry } from '@api/schemaRegistry.js'

import * as params from './parameters/index.js'

// Auth parameters
registry.registerParameter('tokenParam', params.TokenParam)

// User parameters
registry.registerParameter('addressIdParam', params.AddressIdParam)
registry.registerParameter('paymentMethodIdParam', params.PaymentMethodIdParam)
registry.registerParameter('userRoleParam', params.UserRoleParam)
registry.registerParameter('userStatusParam', params.UserStatusParam)

// Customer
registry.registerParameter('customerIdParam', params.CustomerIdParam)

// Provider parameters
registry.registerParameter('providerIdParam', params.ProviderIdParam)
registry.registerParameter(
  'providerVerifiedParam',
  params.ProviderVerifiedParam,
)
registry.registerParameter('providerActiveParam', params.ProviderActiveParam)
registry.registerParameter(
  'providerBusinessNameParam',
  params.ProviderBusinessNameParam,
)
registry.registerParameter(
  'providerMinRatingParam',
  params.ProviderMinRatingParam,
)
registry.registerParameter(
  'providerMaxRatingParam',
  params.ProviderMaxRatingParam,
)

// Category parameters
registry.registerParameter('categoryIdParam', params.CategoryIdParam)
registry.registerParameter(
  'categoryParentIdParam',
  params.CategoryParentIdParam,
)
registry.registerParameter('categoryLevelParam', params.CategoryLevelParam)
registry.registerParameter('categoryActiveParam', params.CategoryActiveParam)
registry.registerParameter(
  'categoryIncludeChildrenParam',
  params.CategoryIncludeChildrenParam,
)

// Voucher parameters
registry.registerParameter('voucherIdParam', params.VoucherIdParam)
registry.registerParameter(
  'voucherProviderIdParam',
  params.VoucherProviderIdParam,
)
registry.registerParameter(
  'voucherCategoryIdParam',
  params.VoucherCategoryIdParam,
)
registry.registerParameter('voucherStateParam', params.VoucherStateParam)
registry.registerParameter(
  'voucherDiscountTypeParam',
  params.VoucherDiscountTypeParam,
)
registry.registerParameter('voucherLatitudeParam', params.VoucherLatitudeParam)
registry.registerParameter(
  'voucherLongitudeParam',
  params.VoucherLongitudeParam,
)
registry.registerParameter('voucherRadiusParam', params.VoucherRadiusParam)

// Review parameters
registry.registerParameter('reviewIdParam', params.ReviewIdParam)
registry.registerParameter(
  'reviewProviderIdParam',
  params.ReviewProviderIdParam,
)
registry.registerParameter(
  'reviewCustomerIdParam',
  params.ReviewCustomerIdParam,
)
registry.registerParameter('reviewRatingParam', params.ReviewRatingParam)

// Payment parameters
registry.registerParameter('paymentIdParam', params.PaymentIdParam)
registry.registerParameter('paymentStatusParam', params.PaymentStatusParam)
registry.registerParameter('paymentFromDateParam', params.PaymentFromDateParam)
registry.registerParameter('paymentToDateParam', params.PaymentToDateParam)

// Language parameters
registry.registerParameter('acceptLanguageParam', params.AcceptLanguageParam)

// Pagination and sorting parameters
registry.registerParameter('paginationPageParam', params.PaginationPageParam)
registry.registerParameter('paginationLimitParam', params.PaginationLimitParam)

// Sorting parameters
registry.registerParameter('sortParam', params.SortParam)
registry.registerParameter('sortByParam', params.SortByParam)
registry.registerParameter('sortOrderParam', params.SortOrderParam)

// Messaging parameters
registry.registerParameter('conversationIdParam', params.ConversationIdParam)
registry.registerParameter('messageIdParam', params.MessageIdParam)
registry.registerParameter('messagesLimitParam', params.MessagesLimitParam)
registry.registerParameter('messagesBeforeParam', params.MessagesBeforeParam)
registry.registerParameter('messagesAfterParam', params.MessagesAfterParam)
registry.registerParameter(
  'conversationsLimitParam',
  params.ConversationsLimitParam,
)
registry.registerParameter(
  'conversationsOffsetParam',
  params.ConversationsOffsetParam,
)
registry.registerParameter('includeArchivedParam', params.IncludeArchivedParam)

// Notification parameters
registry.registerParameter('notificationIdParam', params.NotificationIdParam)
registry.registerParameter(
  'notificationsLimitParam',
  params.NotificationsLimitParam,
)
registry.registerParameter(
  'notificationsOffsetParam',
  params.NotificationsOffsetParam,
)
registry.registerParameter('unreadOnlyParam', params.UnreadOnlyParam)
registry.registerParameter(
  'notificationTypesParam',
  params.NotificationTypesParam,
)
