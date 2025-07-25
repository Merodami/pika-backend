Pika Platform MVP Blueprint

1. Domain Model Diagrams
   Core Entities & Relationships: The Pika voucher platform involves several key entities: Customer, Retailer, Voucher, Redemption, Review, and supporting structures for location and notifications. A Customer can discover and claim vouchers, redeem them, and leave reviews. A Retailer (or admin user) issues vouchers and validates redemptions. A Voucher represents a discount offer or coupon, with a lifecycle of states from creation to expiration. A Redemption records the usage of a voucher (who redeemed it, when, and where). A Review captures a customer’s rating and feedback on a voucher or the retailer. The diagram below illustrates the domain model with these entities and their relationships:
   Figure: UML Class Diagram of the Pika domain model, showing Customers, Retailers, Vouchers, Redemptions, and Reviews, along with key fields and associations.
   In this model, a Customer may have many favorite or claimed Vouchers, and can write Reviews for vouchers they redeemed. A Retailer offers many Vouchers and validates their Redemptions. Each Voucher is issued by a Retailer and can be claimed/redeemed by many Customers (one redemption per 1
   customer) . A Redemption event links a Customer (who redeemed) and a Voucher (that was used), and the Retailer validates it face-to-face. Key fields include voucher details (title, description, terms, expiration date, multi-language content), a geolocation (for “near me” searches using PostGIS), and unique codes (QR token and human-readable short code). The Voucher entity also tracks its state (e.g. NEW , PUBLISHED , CLAIMED , REDEEMED , EXPIRED ) as it moves through its lifecycle.
   Voucher Lifecycle: New vouchers are created (state NEW) by a retailer or admin (e.g. via an admin app). Once approved or ready, they are published (state PUBLISHED) and become visible to customers in the app. Customers can then claim a voucher (state CLAIMED for that customer’s instance of the voucher) – claiming could simply mark that voucher in the user’s account for later use. When a customer uses the voucher at the retailer, it becomes redeemed (state REDEEMED). Eventually, if not used in time, vouchers expire (state EXPIRED after the expiration date or after a redemption occurs). The sequence diagram below illustrates this lifecycle:
   @startuml VoucherLifecycle
   actor Retailer as R
   actor Customer as C
   participant VoucherService as VS
   R -> VS: POST /vouchers (create NEW voucher)
   VS --> R: 201 Created (voucherId, state=NEW)
   R -> VS: PATCH /vouchers/{id} (publish voucher)
   VS --> R: 200 OK (state=PUBLISHED)
   ... (Voucher now visible to customers) ...
   C -> VS: GET /vouchers (browse available)
   VS --> C: 200 OK (includes new voucher)
   C -> VS: POST /vouchers/{id}/claim
   1
   VS --> C: 200 OK (marked CLAIMED for user)
   ... (Customer visits retailer to redeem) ...
   C -> R: Presents QR code (voucher id & signature)
   R -> VS: POST /redeem { code: QR or shortCode }
   VS --> R: 200 OK (redemption recorded, state=REDEEMED)
   VS -> VS: (Schedule expiry at end date -> state=EXPIRED)
   @enduml
   Sequence Diagram: Voucher lifecycle from creation to expiration. In this flow, a Retailer creates a voucher (state NEW) and publishes it. A Customer finds and claims the voucher. The voucher is redeemed when the customer presents it in-store and the retailer validates it (via the platform). Finally, the voucher is marked expired after its validity period lapses (or immediately after redemption if one-time use). The system ensures one redemption per customer by tying vouchers to user accounts and unique codes
   1
   .
   Redemption Validation (Face-to-Face): When a customer arrives at a store to redeem a voucher, the validation process involves the customer’s app, the retailer’s app, and the backend service. The typical face-to-face redemption flow is:
   •  
   The customer opens their app (which works offline) and displays the voucher’s QR code (containing a signed token for that voucher redemption). Alternatively, a short alphanumeric code is shown as fallback.
   •  
   The retailer, using the retailer app (which can also work offline), scans the QR code or enters the short code.
   •  
   The retailer’s app validates the voucher: if online, it calls the backend redemption API; if offline, it verifies the QR token’s digital signature and checks expiry.
   •  
   The backend (Voucher/Redemption service) checks that the token is valid (untampered, not expired) and that this voucher hasn’t already been redeemed by the same user. It then records the redemption (marking that voucher as redeemed for that user, and logging time/location). •  
   The backend returns a success response. The retailer’s app shows confirmation to the retailer (and possibly to the customer). If the retailer was offline, the redemption is queued locally to sync later.
   •  
   A push notification could be sent to the customer’s device confirming the redemption (e.g. “Voucher XYZ redeemed successfully”), via Firebase Cloud Messaging.
   Below is a sequence diagram for an online redemption validation:
   @startuml RedemptionValidation
   actor Customer as C
   actor Retailer as R
   participant VoucherService as VS
   C -> C: Display QR (JWT with voucherId, userId, exp, signature) R -> C: Scan QR code (camera)
   R -> VS: POST /redeem { code } <<if online>>
   VS -> VS: Verify JWT (signature, exp, voucherId)
   VS -> VS: Check redemption status (not already used by user)
   VS --> R: 200 OK (valid; mark redeemed)
   2
   VS --> C: (via FCM) Redemption confirmation push
   @enduml
   Sequence Diagram: In-person voucher redemption and validation. If either device is offline, the flow adjusts: the Retailer app can verify the QR token offline using the public key for the JWT signature and ensure the token’s TTL has not passed. It then marks the voucher as redeemed locally. When connectivity is restored, the retailer app will sync the redemption record to the server (see Offline Sync in Section 5). The short code (a human-readable code) provides a fallback if QR scanning fails – the retailer can type the code into their app to find and validate the voucher. The system supports multiple 2
   code formats (QR, barcode, text) for flexibility .
   Customer & Retailer Application Flows: Both customers and retailers have dedicated app workflows:
   •  
   Customer App Flow: The customer opens the Pika mobile app (which loads cached data for offline use). They browse available vouchers (filtering by category or location as needed). They can favorite vouchers to save them, or claim a voucher to indicate intent to use it (adding it to their “wallet”). The app displays voucher details and reviews. When ready to redeem, the customer shows the voucher’s QR code (or reads out the short code) to the retailer. After redemption, the app may prompt the customer to review the voucher/experience. The customer can operate entirely offline: browsing and claiming use locally cached vouchers, and redemption uses the QR’s offline verification. All actions are synced when connectivity is available (favorites, claims, and reviews will upload, and new vouchers or updates will download). Multilingual support allows the customer to see content in Guaraní, Spanish, English, or Portuguese based on their preference (the app loads language packs or localized strings accordingly).
   •  
   Retailer App Flow: The retailer (or their staff) uses a companion app (or web portal) to manage vouchers and scan redemptions. A retailer can create a new voucher (enter details, upload an image, set terms, set expiration date, etc.) and publish it to make it live. The app might allow scheduling (e.g., set a start date when the voucher becomes PUBLISHED). The retailer app also handles redemption scanning – it uses the device camera to scan a customer’s QR code or has an input for short codes. When a code is scanned, the retailer app validates it (offline or via the server) and then confirms to the staff if the voucher is valid and can be honored. The retailer can see an indication if a voucher code was already used or expired (the backend ensures a code cannot be used twice) – if online, this is checked on the server in real time; if offline, the JWT’s 3
   one-time signature and short TTL prevent reuse . Retailers can also view analytics or lists of redemptions in their app (e.g., number of vouchers redeemed this month) once those records sync. Retailer accounts are likely associated with specific store locations (each redemption record includes location via PostGIS geometry for analysis). The retailer app, like the customer app, works offline-first: voucher lists and redemption logs are cached locally, and any new voucher creation or redemption is queued for sync.
2. API Contracts (OpenAPI 3)
   All functionality is exposed via a set of RESTful APIs (JSON over HTTPS), structured as multiple services in a Node.js 20 backend (organized in an Nx monorepo). We define OpenAPI 3.0 specifications for each domain: Auth, Voucher, Redemption, Review, Notification, PDF Generation, and Admin. JWT authentication (bearer token) secures the APIs, integrating with AWS Cognito or Firebase Auth for token issuance/validation. Below is an outline of the API endpoints (with example OpenAPI paths). For brevity, we summarize the main paths and methods for each service:
   3
   2.1 Auth & User Service
   Authentication is primarily handled by Firebase Auth/Cognito, so the backend mainly verifies tokens. However, we include endpoints for user profile management and possibly custom auth flows:
   openapi: 3.0.3
   info:
   title: Auth Service
   version: 1.0
   components:
   securitySchemes:
   jwtAuth:
   type: http
   scheme: bearer
   bearerFormat: JWT
   paths:
   /auth/login:
   post:
   summary: "Exchange credentials for JWT (if using custom auth)" requestBody:
   content:
   application/json:
   schema:
   $ref: "#/components/schemas/LoginRequest"
   responses:
   "200":
   description: JWT issued
   /auth/refresh:
   post:
   summary: "Refresh JWT token"
   responses:
   "200":
   description: New JWT
   /users/me:
   get:
   summary: "Get current user profile"
   security:

- jwtAuth: []
  responses:
  "200":
  description: "User info"
  content:
  application/json:
  schema:
  $ref: "#/components/schemas/User"
  Auth notes: In practice, the mobile app will use Firebase Auth for sign-up/sign-in (email/password, OAuth, etc.), obtaining a JWT from Firebase. That JWT is sent to our backend on requests. The backend will verify it (using Firebase SDK or Cognito JWT verification) and create a corresponding user record in our database if needed. The /users/me endpoint allows retrieving or updating profile info (e.g.,
  4
  4
  preferred language, notification settings). Amazon Cognito has a free tier up to 50k MAUs , and 5
  Firebase Auth is free up to 50k MAUs , so either approach will not incur cost at 10k users. Password resets and email verification are handled by Firebase/Cognito directly.
  2.2 Voucher Service API
  This service handles voucher discovery, retrieval, and lifecycle actions (creation, publication, claiming). It is likely backed by PostgreSQL with PostGIS for geospatial queries. Example specification:
  openapi: 3.0.3
  info:
  title: Voucher Service
  version: 1.0
  paths:
  /vouchers:
  get:
  summary: "List available vouchers"
  parameters:
- in: query
  name: category
  schema: { type: string }
- in: query
  name: location
  schema: { type: string, format: "geo-point" }
- in: query
  name: radius_km
  schema: { type: number, default: 10 }
  responses:
  "200":
  description: "Array of Voucher"
  content:
  application/json:
  schema:
  type: array
  items: $ref: "#/components/schemas/Voucher"
  post:
  summary: "Create a new voucher"
  security:
- jwtAuth: [ "admin", "retailer" ]
  requestBody:
  content:
  application/json:
  schema: $ref: "#/components/schemas/VoucherCreate"
  responses:
  "201":
  description: "Voucher created"
  content:
  application/json:
  schema: $ref: "#/components/schemas/Voucher"
  /vouchers/{voucherId}:
  5
  get:
  summary: "Get voucher details"
  responses:
  "200":
  description: "Voucher object"
  content:
  application/json:
  schema: $ref: "#/components/schemas/Voucher"
  patch:
  summary: "Update voucher (e.g. publish or edit)"
  security:
- jwtAuth: [ "admin", "retailer" ]
  requestBody:
  content:
  application/json:
  schema: $ref: "#/components/schemas/VoucherUpdate"
  responses:
  "200": { description: "Updated" }
  /vouchers/{voucherId}/claim:
  post:
  summary: "Claim a voucher"
  security:
- jwtAuth: [ "customer" ]
  responses:
  "200": { description: "Voucher claimed for user" }
  /vouchers/{voucherId}/reviews:
  get:
  summary: "List reviews for this voucher"
  responses:
  "200":
  content:
  application/json:
  schema:
  type: array
  items: $ref: "#/components/schemas/Review"
  post:
  summary: "Submit a review for voucher"
  security:
- jwtAuth: [ "customer" ]
  requestBody:
  content:
  application/json:
  schema: $ref: "#/components/schemas/ReviewCreate"
  responses:
  "201": { description: "Review submitted" }
  Voucher API details: Customers call GET /vouchers to discover deals. Query params allow filtering by category or geography (e.g., location=LAT,LNG&radius_km=5 to get vouchers within 5 km). The server uses PostGIS to efficiently find vouchers within radius using spatial indices (e.g., using ST_DWithin for distance filtering ). The vouchers returned include essential info like title,
  6
  description (possibly in multiple languages), discount details, expiration date, and maybe a preview 6
  image. POST /vouchers allows a retailer or admin to create a new voucher (with necessary authorization). Fields in the request include category, description in multiple languages, location (could be a point or region defining where it’s applicable), validity dates, and the quantity or per-user limits (if any). The response returns the created voucher (initially state NEW). PATCH /vouchers/{id} is used to update voucher info or change its state – for example, an admin can set state=PUBLISHED to publish it (alternatively we could have a dedicated publish endpoint). Only authorized users can create/ update vouchers (enforced via JWT roles/claims like “retailer” or “admin”).  
  For claiming vouchers, a customer calls POST /vouchers/{id}/claim . This could create a record linking that user to the voucher (e.g., in a UserVoucher table) and mark the voucher as claimed in the user’s context. The response confirms the claim. Claiming might also generate a unique redemption token for the user if we choose to pre-generate unique QR codes at claim time. (Alternatively, the QR code can be generated on the fly when viewing the voucher, containing user ID and voucher ID.)
  2.3 Redemption Service API
  The redemption service handles validating and recording voucher uses. It needs to be fast and secure, as it’s used in real-time at point of sale. Endpoints:
  openapi: 3.0.3
  info:
  title: Redemption Service
  paths:
  /redemptions:
  post:
  summary: "Redeem a voucher code (QR or short code)"
  security:
- jwtAuth: [ "retailer", "admin" ] # retailer must be logged in to redeem
  requestBody:
  content:
  application/json:
  schema:
  type: object
  properties:
  code:
  type: string
  description: "QR token or short code presented by customer"
  responses:
  "200":
  description: "Redemption successful"
  content:
  application/json:
  schema: $ref: "#/components/schemas/RedemptionResult"
  "400":
  description: "Invalid or already redeemed"
  /redemptions/{id}:
  get:
  summary: "Get details of a redemption"
  security:
  7
- jwtAuth: [ "admin", "retailer" ]
  responses:
  "200":
  content:
  application/json:
  schema: $ref: "#/components/schemas/Redemption"
  Redemption API details: The primary operation is POST /redemptions for when a retailer scans a code. The request contains the code which could be the raw JWT string from the QR or a short code. The backend will attempt to validate the code. If the code is a JWT, the service will decode and verify its 3
  signature (using ECDSA public key) and check the exp claim to ensure it’s not expired . The payload will contain the voucher ID and possibly the user ID (or a one-time redemption ID). The service then checks that this voucher is still available: e.g., it queries if there’s already a redemption recorded for that voucher and user. If all checks pass, it records a new Redemption entry in the database (with timestamp and the retailer/store info from the auth token or code). The response returns a result (e.g., success with some details like “give 20% off” or error message if invalid). If the code was already used or is invalid/expired, a 400/409 error is returned and the retailer app will show that the voucher is not valid.
  We also include GET /redemptions/{id} for completeness, which allows retrieving a specific redemption record (for audit or admin purposes). Additionally, an admin or the system might have an endpoint to invalidate or cancel a redemption (not shown above) in case of errors or fraud reversals.
  Security: Only authorized retailer accounts (or an admin override) can redeem a voucher via the API, ensuring that random users cannot call redeem endpoints. The system also uses short token expiration and one-time use logic to prevent QR reuse fraud – the QR JWT token is valid for only a brief period 3
  and cannot be replayed . If offline redemption occurs, the retailer app will later call this endpoint when online to officially record it, at which point the backend may double-check the timestamp (it might accept slightly stale tokens if coming from a trusted retailer app that validated offline, using a separate offline signature verification process).
  2.4 Review Service API
  This handles customer reviews for vouchers or retailers:
  openapi: 3.0.3
  info:
  title: Review Service
  paths:
  /vouchers/{id}/reviews:
  get:
  summary: "Get all reviews for a voucher"
  responses:
  "200":
  content:
  application/json:
  schema:
  type: array
  items: $ref: "#/components/schemas/Review"
  post:
  8
  summary: "Submit a new review for this voucher"
  security:
- jwtAuth: [ "customer" ]
  requestBody:
  content:
  application/json:
  schema: $ref: "#/components/schemas/ReviewCreate"
  responses:
  "201": { description: "Created review" }
  /reviews/{reviewId}:
  delete:
  summary: "Delete/Moderate a review"
  security:
- jwtAuth: [ "admin" ]
  responses:
  "204": {}
  Customers can GET reviews for a voucher to help decide on claiming it (each review might include a rating (e.g., 1-5 stars) and comment text, possibly username or anonymous). They can POST a review after they have redeemed a voucher. (We might enforce that a user can only review if they actually redeemed that voucher; this can be enforced in the backend by checking the Redemptions for that user.) Admins (or possibly retailers for their own vouchers) can delete or hide inappropriate reviews via the DELETE endpoint. Reviews are stored in Postgres (with perhaps a full-text index for searching keywords if needed in future).
  2.5 Notification Service API
  Most notifications (e.g., push messages) are sent from the backend to Firebase Cloud Messaging, rather than via client pull. However, we provide an API for device registration and possibly for admin-triggered broadcasts:
  paths:
  /devices:
  post:
  summary: "Register device for push notifications"
  security:
- jwtAuth: [ "customer", "retailer" ]
  requestBody:
  content:
  application/json:
  schema:
  type: object
  properties:
  token: { type: string, description: "FCM device token" }
  platform: { type: string, enum: [ "ANDROID", "IOS", "WEB" ] }
  responses:
  "200": { description: "Device registered" }
  /notifications/broadcast:
  post:
  summary: "Send a broadcast notification"
  9
  security:
- jwtAuth: [ "admin" ]
  requestBody:
  content:
  application/json:
  schema:
  properties:
  title: { type: string }
  message: { type: string }
  target: { type: string, enum: [ "all", "customers",
  "retailers" ] }
  responses:
  "202": { description: "Notification sent" }
  Using POST /devices , the mobile apps will register their Firebase Cloud Messaging token with the
  backend (including what user and device it’s associated with). This allows our server to know where to send push notifications (e.g., for new vouchers or redemption confirmations). The Notification/ Broadcast endpoint is for admins to send out announcements or marketing pushes (for example, “New voucher book available for January!”). It would iterate through stored device tokens (or use an FCM topic) and send the message via Firebase Cloud Messaging. Note that FCM usage is completely free for 7
  unlimited messages , making it cost-effective to engage 10k+ users in real time with minimal cost.
  2.6 PDF Generation Service API
  This service is responsible for producing the monthly print-ready voucher book PDFs. It may be implemented as an AWS Lambda function that generates PDF pages from voucher data and stores them on S3. Endpoints:
  paths:
  /pdf/monthly:
  get:
  summary: "Download current monthly voucher book PDF"
  responses:
  "200":
  description: "PDF file"
  content:
  application/pdf:
  schema:
  type: string
  format: binary
  /admin/pdf/generate:
  post:
  summary: "Trigger generation of a new voucher book PDF"
  security:
- jwtAuth: [ "admin" ]
  responses:
  "202": { description: "PDF generation started" }
  For users, GET /pdf/monthly returns the latest PDF file (or a redirect to an S3 URL). This allows anyone (even without the app) to obtain the physical-like voucher book. The PDF contains all currently
  10
  active vouchers for the month, each with its own QR and short code (see Print Layout section). For administrators, POST /admin/pdf/generate triggers on-demand regeneration of the PDF (for example, if new vouchers were added mid-month or to generate the next month’s book). This could enqueue a job to a Lambda that fetches all PUBLISHED vouchers, lays them out into a PDF using HTML/ CSS or a template, and saves it. The generation might also happen on a schedule (e.g., on the 1st of each month automatically, via CloudWatch Scheduled Event triggering the Lambda). The PDF file is stored in an S3 bucket and possibly cached via CloudFront for fast download. The API may simply provide a link to the file. We apply a content-disposition so that downloading yields a nice filename like “Pika-VoucherBook-Jan2025.pdf”.
  2.7 Admin Service API
  The Admin interface might reuse many of the above endpoints with elevated permissions, but also include administrative functions (user management, analytics). For completeness, some admin endpoints might include:
  paths:
  /admin/vouchers:
  get:
  summary: "List all vouchers (any state)"
  security: [ { jwtAuth: [ "admin" ] } ]
  parameters:
- name: state
  in: query
  schema: { type: string, enum: [ "NEW","PUBLISHED","EXPIRED" ] } responses:
  "200": { ... list of vouchers ... }
  /admin/retailers:
  post:
  summary: "Create a new retailer account"
  security: [ { jwtAuth: [ "admin" ] } ]
  requestBody:
  ... retailer registration info ...
  responses:
  "201": {}
  /admin/redemptions:
  get:
  summary: "List redemptions (with filters)"
  security: [ { jwtAuth: [ "admin" ] } ]
  responses:
  "200": { ... list of redemptions ... }
  These allow an admin user (perhaps via a web dashboard) to oversee the system. For example, they can list all vouchers in the system, filter by state or retailer, etc. They can add new retailers (creating login credentials or linking to an Auth user, possibly done via Cognito/Firebase invitation). And they can view redemption logs to detect unusual activity (e.g., many redemptions of the same voucher in a short time indicating possible fraud).
  OpenAPI and Integration: Each of these OpenAPI specs would include schemas for request and response bodies (e.g., Voucher , Review , Redemption objects), error formats, and security
  11
  definitions for JWT. The APIs are stateless and use JWT bearer auth on each request. The mobile app uses these APIs through a REST client, and we ensure the OpenAPI definitions are complete so that tools or even AI code generators (like AWS API Gateway or documentation via ReDoc) can use them. For instance, we can auto-generate API client code for Flutter from OpenAPI. All endpoints use standard HTTP verbs and codes (200 for success, 201 for created, 400 for invalid requests, 401 for unauthorized, etc.).  
  Geo queries: The backend uses PostgreSQL 15 + PostGIS for location-based features. Vouchers have a location (point for a single store location or polygon for an area, depending on voucher applicability). We create a spatial index on these. A query for vouchers within X km of a user’s location uses a PostGIS function like ST_DWithin(location, user_location, radius) for performance
  6
  . This allows efficient retrieval of vouchers relevant to Asunción or any area as we expand. PostGIS
  extends Postgres with geospatial support to store points, perform distance calculations, and spatial 8
  joins . This is crucial for the Initial Market: Asunción, Paraguay where a user might search “Deals near me in Asunción” – the app calls GET /vouchers?location=-25.3,-57.6&radius_km=5 and the service returns vouchers in that radius, thanks to PostGIS.

3. Flutter App Feature Blueprint
   The Pika mobile app is built with Flutter 3 for cross-platform support (iOS/Android), following an offline-first design. It uses Riverpod for state management, GoRouter for navigation, and integrates Firebase for authentication and push messaging. This section outlines the app’s architecture: key screens (widgets), state providers, routes, and how offline data is handled.
   3.1 App Architecture & State Management: We adopt a MVVM (Model-View-ViewModel) or Redux like approach using Riverpod’s providers to separate UI from business logic. The app’s state is stored locally (in Hive databases) to allow offline use. Riverpod providers (both StateNotifier and
   FutureProvider / StreamProvider as appropriate) manage data such as the list of vouchers, the user’s favorites/claimed vouchers, and network sync status.
   •  
   We define data models: Voucher , Review , User , etc. (possibly generated from OpenAPI schemas). These models use e.g. freezed for immutability and easy JSON serialization.
   •  
   Hive (a local NoSQL DB) is used to cache lists of vouchers, user’s claimed vouchers, and any
   pending actions (outbox) for sync. We create Hive adapters for each model and initialize Hive in a local service layer. For example, a VoucherBox stores all vouchers and a SyncStatusBox 9 10
   tracks pending operations (similar to the approach in offline Sudoku app) .
   •  
   Riverpod Providers:
   •  
   voucherRepositoryProvider : provides an instance of a repository class that handles
   fetching from API or local cache. It might expose methods like fetchVouchers() , claimVoucher(id) , redeemVoucher(code) etc.
   •  
   vouchersProvider : a StateNotifierProvider that holds the list of vouchers. It loads
   from Hive on app start, and updates when new data comes from the server. It might also have filtering logic (by category or search query).
   •  
   favoritesProvider : tracks vouchers the user favorited. This can be a subset of vouchers
   stored by IDs.
   •  
   claimedVouchersProvider : tracks vouchers the user claimed (for quick access to their QR
   codes).
   •  
   authProvider : listens to FirebaseAuth for login state (a StreamProvider<User?> ). When
   the user logs in/out, this triggers the app to load appropriate data. 12
   •  
   networkStatusProvider : a StreamProvider or StateNotifier that uses Connectivity Plus to
   report online/offline status.
   •  
   syncQueueProvider : holds a queue of offline actions to sync (with methods to add action and
   to flush queue). Possibly implemented via a StateNotifier that monitors connectivity and time.
   The Riverpod architecture ensures that widgets can watch these providers. For instance, the voucher list screen listens to vouchersProvider (which yields a list of vouchers from cache and updates when network fetch occurs).  
   3.2 Widget Tree & Navigation: The app’s UI is split into a few main screens (pages), with nested widgets for components like lists and forms. Using GoRouter, we define routes for each screen. Example route setup:
   final \_router = GoRouter(
   routes: [
   GoRoute(path: '/', name: 'home', builder: (ctx, state) => HomeScreen()), GoRoute(path: '/voucher/:id', name: 'detail', builder: (ctx, state) { final id = state.params['id'];
   return VoucherDetailScreen(voucherId: id);
   }),
   GoRoute(path: '/favorites', builder: (ctx, state) => FavoritesScreen()), GoRoute(path: '/profile', builder: (ctx, state) => ProfileScreen()), // ... other routes
   ],
   );
   We use nested navigation for any tab views if present. The main screens include:
   •  
   HomeScreen – the landing page showing featured vouchers and categories. It might have a list
   or grid of vouchers. If geolocation is enabled, it could show “Nearby deals” by querying vouchersProvider with location filter.
   •  
   Contains child widgets: e.g., CategoryFilterBar (horizontal list of categories to filter), a search bar, and a VoucherList (ListView or GridView of VoucherCard widgets).
   •  
   Each VoucherCard displays summary info (title, discount, maybe distance away using the PostGIS data) and a “favorite” icon to toggle favorite status.
   •  
   VoucherDetailScreen – shows detailed info of a selected voucher: description, terms & conditions, reviews list, retailer info (address, map), and buttons to “Claim” or “Unclaim” and “Navigate” (maybe open map to retailer location). If the voucher is claimed by the user, this screen will show the QR code and short code for redemption.
   •  
   If offline, all info is still shown from cache. Claim button will work offline (mark in Hive and queue sync).
   •  
   Contains a ReviewsList sub-widget to display user reviews (with an option to add a review if eligible).
   •  
   FavoritesScreen – list of vouchers the user favorited (or claimed). Possibly with quick access to
   their QR codes if claimed.
   •  
   ProfileScreen – user account info, settings (language switch, offline data status, sync button,
   etc.). The user can see their saved vouchers, change language (the app would then load new localized strings or voucher content).
   13
   •  
   Retailer-Specific Screens: If the same app is used by retailers in a “mode” or we have a separate
   retailer app. For MVP, we might not have a separate Flutter app for retailers (could be web based), but assuming a separate mode:
   •  
   RetailerHomeScreen – list of that retailer’s vouchers (stats like how many redeemed). •  
   VoucherEditorScreen – form to create/edit a voucher (title, description in multiple languages, category, expiration date, upload image, etc).
   •  
   ScanScreen – opens camera to scan QR. (This uses mobile_scanner or similar Flutter plugin for QR scanning.)
   •  
   RedemptionListScreen – view recent redemptions at that retailer’s store, possibly with
   customer info if available.
   We ensure multilingual support by using Flutter’s localization facilities ( Localizations with ARB files or intl package). All static texts have translations for Spanish, Guaraní, English, Portuguese.
   Voucher content itself is delivered in multiple languages (either via separate fields or via a localized content API) and the app picks the appropriate field based on user’s language. For example, the Voucher model might have title_en , title_es , etc., or a structure like title: { "en": "...", "es": "..." } . The app can choose voucher.title[locale] . All UI messages (like buttons, error messages) are localized as well.
   Widget structure example:
   HomeScreen (Scaffold)
   ├─ AppBar (title, language switch)
   11
   ├─ OfflineBanner (shows if offline mode)
   ├─ CategoryFilterBar (horizontally scrollable chips)
   ├─ Expanded(
   │ VoucherList (ListView.builder of VoucherCard)
   │ └─ VoucherCard (for each voucher, shows image, title, etc.) │ └─ FavoriteButton (toggles favorite state)
   └─ BottomNavBar (tabs for Home, Favorites, Profile)
   Many widgets are responsive to state via Riverpod. For instance, FavoriteButton might call a toggleFavorite(voucherId) method on a FavoritesController (StateNotifier) which updates Hive and triggers a UI refresh. The OfflineBanner is a widget listening to networkStatusProvider – if status is offline, it displays a message (e.g., “Offline mode – changes will sync when connection is 11
   back” as shown in similar apps ).
   3.3 Offline-First State Management: The app works offline by design. On first launch, it will try to fetch vouchers from the API, but it also saves them to Hive. Subsequent launches load from Hive instantly, and then do a network call in background to refresh. Any action a user takes (claiming a voucher, adding a review, etc.) is applied optimistically to the local state and UI, even if the device is offline. These actions are stored in an outbox for syncing. For example, when a user taps "Claim", the app will:
   •  
   Mark that voucher as claimed in local Hive storage (so the UI updates to show it as claimed and
   available in their claimed list).
   •  
   Add a “claim action” to a Hive box (or a list in memory) indicating voucher X needs to be claimed on the server.
   •  
   Immediately reflect in UI (optimistic UI).
   14
   •  
   A background process (triggered by connectivity or scheduled) will send that claim to the server (API call) and mark the action as synced or retry if it fails.
   We leverage Riverpod to encapsulate this logic in controllers. For instance, a ClaimVoucherNotifier can handle the claim action. It might look like:
   class ClaimVoucherNotifier extends StateNotifier<AsyncValue<void>> { ClaimVoucherNotifier(...dependencies...);
   Future<void> claimVoucher(String voucherId) async {
   // update local state
   localDb.markVoucherClaimed(voucherId);
   // queue for sync
   offlineQueue.add(Action.claim(voucherId));
   state = const AsyncValue.data(null);
   // try to sync if online
   if (await connectivity.isConnected()) {
   await syncService.processQueue();
   }
   }
   }
   This ensures the app remains responsive offline. We also implement conflict handling: e.g., if two devices or sessions try to claim or redeem the same voucher, the server ultimately decides the outcome (the second attempt might get a failure if already redeemed). The app will handle server responses on sync to reconcile. If a conflict arises (server rejects an offline action), the app can undo the optimistic change or inform the user.
   Connectivity & Sync: We use the connectivity_plus plugin to listen for network changes. A ConnectivityService object streams updates to Riverpod (like a networkStatusProvider ).
   When the app transitions from offline to online, we trigger a sync of all pending actions. We also attempt periodic syncs via background tasks. On Android, WorkManager is used to schedule a background job (with networkType=NETWORK_TYPE_UNMETERED maybe) to run our sync logic when connectivity is available (even if the app is not open). On iOS, we use BGTaskScheduler (via
   flutter_workmanager or background_fetch ). Note: background task scheduling can be finicky – 12
   iOS may defer tasks until the app is opened unless it’s used frequently . We mitigate this by also performing sync on app launch/resume and when push notifications arrive (e.g., a push indicating new data will wake the app to sync in the background).
   Example Offline Sync Flow: (Detailed pseudocode is in Section 5, but in summary) – The app maintains a local storage provider and a sync service. The local storage provider (Hive) stores data and a boolean 10 13
   synced flag per item . The SyncService periodically checks for unsynced items and attempts to 14
   send them to the backend one by one . After successfully syncing an item, it marks it as synced in 15 16
   local storage . If an error occurs, the sync stops or marks error state to retry later . Conflict resolution is handled either by the server or with a strategy on the client (e.g., last write wins by 17
   timestamp , or merging changes). In a simple case, voucher redemption conflicts shouldn’t occur per user (one per voucher), but if they did, server would reject a duplicate redemption and the app would mark that action as failed.
   Push Notifications & Real-time updates: The app subscribes to relevant FCM topics or messages. For example, an admin could push “New vouchers added” – on receiving this, the app could automatically
   15
   fetch new vouchers in background so that even offline users get updated data when they connect. Similarly, after a redemption is recorded on the server, the user’s app might get a push confirmation (used to update UI or show “Thanks for redeeming!”). This keeps data in sync without requiring the user to manually refresh.
   Riverpod & GoRouter integration: We use GoRouter’s refreshListenable or Riverpod integration to react to auth state changes. If authProvider becomes null (logged out), the router can redirect to
   a LoginScreen. If not, proceed to the main app. This ensures a smooth login flow. We also protect routes (like retailer admin screens) by checking user roles from JWT (we could store a simple isRetailer flag in user profile and guard those screens).
   Finally, the app includes robust error handling and UI states. If the user is offline and tries to do something that absolutely requires internet (not many cases, since almost everything is offline-capable), we show a friendly message. Most actions queue silently, but we provide feedback for transparency, e.g., a small icon or message “Saved offline (will sync later)” for a review submitted offline. If a sync fails (maybe due to invalid data), the app will notify the user and allow retry. Overall, the Flutter app prioritizes usability offline to fulfill the “offline-first” requirement: users and retailers can accomplish everything (browsing, claiming, scanning) without network, and the data will eventually sync up.
4. Print Layout Specification (Monthly Voucher Book)
   To support the legacy of physical voucher books, Pika will generate a print-ready PDF each month containing all active vouchers. This PDF is designed with consistent formatting using Tailwind CSS for styling (via a print-optimized stylesheet). We output an HTML template of the voucher book and convert it to PDF (using a headless browser like Puppeteer or a library) so that the printed result is well formatted.
   Tailwind CSS for Print: We leverage Tailwind’s utility classes and a print media query to style the PDF. Tailwind can be configured to recognize print as a screen target in its config (adding a custom screen 18
   called "print" in theme.extend.screens ) . This allows us to use classes like print:hidden 19
   or print:text-black etc., which apply only when printing . Our print stylesheet ensures that the output is high-contrast, ink-friendly, and paginated properly:
   •  
   We define a page size (likely A4) with appropriate margins. Tailwind doesn’t directly set page size, but we can use CSS @page rule in a global CSS or configure Puppeteer to A4.
   •  
   Layout: Each voucher is formatted as a voucher card. Likely, we can fit 2 or 3 voucher cards per
   page (depending on size). For example, two per A4 page (one top half, one bottom half) to be cut out, or a 3-column layout for smaller coupons. Each card is contained in a fixed-size box with border lines (for cutting guides) and consistent styling.
   •  
   We use Tailwind utility classes for styling elements: e.g., a voucher card might be a <div  class="border p-4 print:m-2 print:mb-4"> with structured content inside. •  
   Voucher Card Contents:
   •  
   Title and description: We display the voucher title (bold, large font), subtitle (e.g., retailer name or category), and a brief description or terms (smaller font). The text is in whichever language the voucher was authored; since the PDF is one per region (Asunción) and likely bilingual, we might include both Spanish and Guaraní description if available, or just Spanish for now depending on content strategy.
   •  
   Expiration date: clearly shown (e.g., “Valid until 31 Jan 2025”). 16
   •  
   QR Code: A QR code image is generated for the voucher (see below for encoding). We embed this as an image (SVG or PNG) on the voucher card. It should be large enough to scan (at least ~1 inch/2.5cm in print, ~300 DPI).
   •  
   Short Code: Below the QR, we print a short alphanumeric code in a bold, large font (e.g., ABCD-1234 ). This code can be used if the QR cannot be scanned. We also label it, e.g., “Code: ABCD-1234”.
   •  
   Instructions: possibly small text like “Present this coupon at [Retailer Name] to redeem” in the local language.
   •  
   Terms & conditions snippet: if space permits, or a note “See app for full terms”.
   •  
   Multilingual notes: If needed, some text might be repeated in a second language (e.g., terms in
   Spanish and English).
   We ensure consistent sizing with Tailwind. For example, we might use a CSS grid or flexbox for the card: left side text, right side QR, or top text bottom QR for narrow cards. The design will avoid color backgrounds to be print-friendly (mostly white background with black text, maybe one accent color). We use Tailwind’s utility classes to adjust for print: for instance, hide any elements that are screen-only (no need for interactive elements in print). If the HTML template includes buttons or links, we either hide 20
   them or convert links to plain text URLs for print (though likely not needed for a coupon book).
   Page-breaking rules: We utilize CSS to control page breaks so each coupon card stays intact on one page or column. For example, adding break-inside: avoid on the card container ensures the printer/PDF doesn’t cut a coupon in half. Tailwind allows custom CSS if needed or we use the print: prefix with a utility if configured. We also ensure each card has some margin so that when cutting, no content is too close to the edge.
   QR Code Encoding Scheme: Each voucher’s QR code encodes a JWT token that represents a redemption right. The JWT is signed with ECDSA (using an EC private key, e.g., P-256 curve). The token contains claims such as: - voucher_id : the unique ID of the voucher (or a specific coupon instance ID). - user_id (optional for printed generic codes, see below). - exp : an expiration timestamp for the token’s validity. - Possibly a nonce or unique token ID to prevent reuse.
   For printed vouchers distributed to the public (e.g., a PDF anyone can download), we might not tie the QR to a specific user (since anyone could use the printed coupon). In that case, the QR might encode just the voucher_id and an exp. To prevent unlimited reuse, we design the system so that the JWT can only be redeemed once per user account – the server will enforce one redemption per user for that 1
   voucher_id . The JWT’s main role is to prove authenticity (that the code was generated by us and not fabricated) and freshness (via exp ). We set a short TTL in the QR if possible. However, printed books need a longer validity (maybe the whole month). A compromise is to use two-layer tokens as in some systems: an outer JWT that is short-lived and an inner token that is longer. In our case, because the 21
   printed code might be static for the month, we can’t have a 1-minute TTL like in-app codes . Instead, we ensure the code is signed and include the expiration date of the voucher as exp . This prevents use after expiry. For digital in-app QR codes, we can use a much shorter TTL (e.g., 1-5 minutes) for extra 3
   security , since the app can generate a fresh QR on the fly. But for print, TTL might be the campaign end date.
   The JWT signature (ECDSA) ensures that even offline, the retailer app can verify the QR’s authenticity by checking the signature against the known public key (the public key would be embedded in the app). 22
   This guards against fraud like someone generating their own QR with a fake voucher_id . The ECDSA algorithm (e.g., ES256) produces a compact signature that fits in a QR. We base64url-encode the JWT, which becomes the QR data. We are mindful of QR capacity: a typical JWT might be ~200-300 bytes; encoded, it could be ~270 characters. This is somewhat large but still scannable as a QR (QR Code
   17
   version 10+ can handle this). If needed, we can compress the JWT payload (e.g., remove unnecessary 23
   whitespace, use shorter claim names, or use a compression as suggested by experts) , but it's likely fine with an alphanumeric mode.
   Short Code Format: Each voucher also has a short code, designed to be easy to read and enter manually. We choose a format like 8 characters (alphanumeric), possibly grouped (e.g., AB12-CD34 ). The short code is essentially a human-friendly key that maps to the voucher (and possibly a specific issuance). It could be derived from the voucher ID or generated uniquely. For example, we could base32-encode a voucher’s internal ID or use a code generation service. To reduce confusion, we avoid ambiguous characters (e.g., I, l, O, 0). A possible approach: use only consonants and digits, or use a known pattern. For instance, Groupon-style codes often include parts of the company or campaign name. For MVP, a random code from a safe alphabet of length 6-8 should suffice (yielding millions of combinations).  
   Short Code Validation: When a short code is entered by a retailer, the app/back-end will look up the corresponding voucher. The retailer app might call an endpoint like /redeem?code=AB12CD34 . The server can maintain a lookup (perhaps a Redis cache or a database table) mapping short codes to voucher IDs (and sign them to detect forgery if not easily guessable). Because the short code isn’t signed like the JWT, it should only be accepted if the retailer is online (so the server can check it). However, we can mitigate risk by making the code sufficiently random (hard to guess) and one-time: for instance, assign unique short codes to each printed voucher issue and mark them as used once redeemed. If the printed book uses one static code per voucher for all users, we rely on login to prevent abuse (i.e., you need a user account to redeem, and that account can only redeem once despite the code being same for everyone). This is a weaker point for offline usage (someone could use the printed code on a new account), so as a future improvement we might switch to personalized or one-scan codes in printed materials too (for example, require that the user still has to have an account to redeem even a printed code, which our flow does).
   Print PDF Assembly: Using the Tailwind-styled HTML, our PDF generator (likely a Node script using Headless Chrome) will produce the final PDF. We test the print layout in a browser’s print preview 24
   (Tailwind’s print utilities allow us to simulate print styles easily ). We ensure that: - The PDF has a cover page or at least a heading (e.g., "Pika Deals – January 2025"). - Each coupon card is clearly separated. We might include cut lines or whitespace between coupons. - We include both languages where appropriate (in Paraguay, we might label things in Spanish and Guaraní to reach all audiences). - All coupons fit nicely, possibly sorted by category or retailer for reader convenience. - The file size is optimized (we use vector QR codes or high-res only as needed, compress images).
   Finally, the PDF is made available to users via the app (download link) and possibly email or website. This printed book approach helps onboard users who are used to the old physical books and provides a fallback if someone prefers paper or doesn’t have a smartphone.
5. Offline Data Sync Algorithm (Caching & Sync)
   One of the most critical technical components is the offline synchronization logic. Below is a pseudocode outline of how the app caches data, queues operations, syncs in background, handles conflicts, and implements optimistic UI updates. This pseudocode is a conceptual representation applicable to our Flutter app (Dart-like syntax for client-side, and some logic for server conflict resolution):
   18
   // Local storage using Hive (or similar)
   class LocalDatabase {
   var voucherBox = Hive.box<Voucher>('vouchers');
   var actionBox = Hive.box<SyncAction>('pending_actions'); // Save or update a voucher list
   void saveVouchers(List<Voucher> apiVouchers) {
   for (v in apiVouchers) {
   voucherBox.put(v.id, v);
   }
   }
   Voucher? getVoucher(String id) => voucherBox.get(id);
   void markVoucherClaimed(String id) {
   Voucher v = voucherBox.get(id);
   if (v != null) {
   v.claimed = true;
   voucherBox.put(id, v);
   }
   }
   // ...similar for redeemed, etc.
   }
   // Define an action type for sync
   enum ActionType { CLAIM, REDEEM, REVIEW }
   class SyncAction {
   String id = UUID(); // unique action id
   ActionType type;
   String voucherId;
   dynamic payload; // e.g. review content or redemption details DateTime lastAttempt;
   bool synced = false;
   }
   // Queue an action (called when user performs an offline-able action) void enqueueAction(ActionType type, String voucherId, [dynamic payload]) { SyncAction action = SyncAction(type: type, voucherId: voucherId, payload: payload, lastAttempt: DateTime.now(), synced: false); actionBox.put(action.id, action);
   }
   // Optimistic UI example for claiming a voucher
   Future<void> onClaimButtonPressed(String voucherId) async { localDb.markVoucherClaimed(voucherId);
   enqueueAction(ActionType.CLAIM, voucherId);
   // UI already updated optimistically
   // Trigger background sync attempt (if online)
   syncService.attemptSync();
   }
   // Sync service that runs in background or on demand
   class SyncService {
   19
   final api = RemoteAPI();
   final local = LocalDatabase();
   bool syncing = false;
   Future<void> attemptSync() async {
   if (syncing) return;
   if (!await Connectivity().checkConnection()) {
   return; // offline, cannot sync now
   }
   syncing = true;
   List<SyncAction> pending = actionBox.values.where((a) => ! a.synced).toList();
   for (action in pending) {
   try {
   switch(action.type) {
   case ActionType.CLAIM:
   await api.claimVoucher(action.voucherId);
   break;
   case ActionType.REDEEM:
   await api.redeemVoucher(action.payload['code']);
   break;
   case ActionType.REVIEW:
   await api.submitReview(action.voucherId,
   action.payload);
   break;
   }
   // If success:
   action.synced = true;
   actionBox.put(action.id, action);
   // If this was a redeem, update local voucher state:
   if (action.type == ActionType.REDEEM) {
   Voucher v = local.getVoucher(action.voucherId);
   if (v != null) {
   v.redeemed = true;
   local.voucherBox.put(v.id, v);
   }
   }
   } catch (e) {
   action.lastAttempt = DateTime.now();
   actionBox.put(action.id, action);
   // If server indicated conflict or invalid, handle  
   accordingly:
   if (e is ConflictException) {
   handleConflict(action);
   action.synced = true; // mark as resolved (don't retry)
   actionBox.put(action.id, action);
   }
   // If network error, just break loop to retry later
   if (e is NetworkException) {
   break;
   }
   20
   }
   }
   syncing = false;
   }
   void handleConflict(SyncAction action) {
   if (action.type == ActionType.CLAIM) {
   // Conflict could mean voucher expired or already redeemed by someone else or duplicate claim
   // We decide to undo the optimistic claim in UI
   Voucher? v = local.getVoucher(action.voucherId);
   if (v != null) {
   v.claimed = false;
   local.voucherBox.put(v.id, v);
   }
   // Notify user maybe
   } else if (action.type == ActionType.REVIEW) {
   // Could mark review as failed to post
   }
   // etc. for other types
   }
   }
   In the above pseudocode, LocalDatabase and SyncService encapsulate the offline-first logic:
   •  
   Caching Data: Whenever the app fetches data from the server (like the voucher list), it saves it to the local database (Hive). This ensures that if the app is opened offline later, it can load the last known vouchers. For instance, saveVouchers() writes all fetched vouchers into a Hive box. We also store related data like retailer info or categories as needed. The local DB uses persistent storage so data survives app restarts.
   •  
   Queueing Actions (Outbox): We define a SyncAction data class that represents an operation to sync (claim, redeem, review, etc.) with necessary details (IDs, payload, timestamps). When a user does something offline, we enqueue a SyncAction. In the claim example, we immediately mark the voucher as claimed in local storage and queue a CLAIM action. Similarly, if a user redeems offline (retailer scans in offline mode), the retailer’s device would queue a REDEEM action with the voucher/code details.
   Optimistic Updates: The UI update happens before the server call. This gives a snappy
   •  
   experience. In case of failure on sync, we may need to rollback. For example, if a CLAIM action ultimately fails (say the voucher was out of stock or expired), our handleConflict would un mark the voucher as claimed and inform the user. We assume such conflicts are rare if we keep data fresh, but the code accounts for it.
   •  
   Background Sync Triggers: The SyncService.attemptSync() is called in various scenarios: •  
   Immediately after queuing an action, if we detect the network is available (as in onClaimButtonPressed above).
   •  
   On a connectivity change to online (the Connectivity listener can call attemptSync). •  
   On app startup/resume (to flush any backlog).
   21
   •  
   Periodically via WorkManager. We would schedule a WorkManager task, say every 15 minutes
   or so when the device is charging & connected, to run attemptSync() in the background. This addresses cases where the app wasn’t opened but we want to push updates (especially on retailer devices to send redemption logs).
   •  
   Possibly triggered by FCM data messages – e.g., if the server knows there are new vouchers or
   needs the app to sync, it could send a silent push message that our app receives and then calls attemptSync().
   Conflict Resolution: The pseudocode’s handleConflict is a simplistic placeholder. A more
   •  
   robust conflict resolution can be implemented. For many cases, we can use a Last-Write-Wins 17
   strategy with timestamps . For instance, if the app has a voucher marked as not redeemed, but on syncing a redemption the server says “already redeemed” (maybe by the same user via another device), the server’s state is authoritative if its timestamp is newer. In that case, the app would update its local data to mark it redeemed. The Chipode example demonstrates merging 25
   by lastModified timestamp or domain-specific rules (like highest score in a game) . In our domain:
   •  
   For voucher details (mostly read-only to users), conflicts are unlikely except maybe multi-lingual
   updates from admin; we simply overwrite local when server has changes.
   •  
   For claim/redemption, the main conflict is if a user tries to use a voucher in two places or time.
   The server will reject second redemption; the app can then just mark that action as failed and inform the user that voucher was already used.
   •  
   For reviews, if offline, a user might post a review that someone else also posts – no conflict, both
   exist. If an admin deleted a review while user offline, syncing might attempt to post an already moderated one; server might accept or not, minor issue.
   •  
   Data Integrity: Each sync action updates local data when successful. E.g., after a redeem sync,
   we mark voucher as redeemed in cache to reflect that state. If new vouchers are available on server, we fetch them. The sync process can also pull data: for example, after pushing all outgoing actions, we might call api.getUpdates(since=lastSyncTime) to get any new vouchers or changes (like if an admin expired a voucher early). This two-way sync keeps the cache fresh. Because we rely on FCM for notifications of new content, we might simply call fetchVouchers() upon receiving such a notification rather than polling.
   •  
   Performance: Sync is done in batches if needed. If many actions queued, we iterate through
   them. We could optimize by combining some (but in our domain, actions are usually independent). To avoid battery drain, if offline periods generate a large queue, we might process 26
   only a subset at a time (Chipode mentions batch processing to avoid long loops) . But given our user counts and actions per user are moderate, this might not be an issue.
   •  
   WorkManager details: We use the Flutter WorkManager plugin to register a background task. The task entrypoint will instantiate SyncService.attemptSync() . On iOS, we register a background fetch event. These tasks must be carefully tested due to OS restrictions (especially iOS which may delay execution). We keep tasks short (just syncing a few KB of data typically) to avoid being killed. We also ensure to schedule them with constraints (only run when network is available, etc., to avoid waking radio unnecessarily). As noted by community experiences, 12
   background tasks aren’t guaranteed to run exactly on schedule , so we rely on multiple triggers (push, user opening app) to cover gaps.
   22
   Summary: This offline sync algorithm ensures resilience and a good user experience: - The user can use the app fully offline. Data is stored locally with Hive (like how Flutter Data uses Hive to allow offline mode ). - On reconnection, the app asynchronously synchronizes changes without user
   27 28 intervention, merging any conflicts appropriately. - We optimize for low bandwidth: by sending only what’s changed (outbox actions) and maybe compressing data if needed. We could compress large payloads (not usually needed for small JSON, but images or attachments would be handled differently). 29
   The Chipode example showed how to compress game state for sync , which we may not need for text data, but it’s an option if needed (or simply relying on network). - The algorithm handles error cases gracefully: network outages (just wait and retry later), server rejects (mark conflict and resolve), etc. It ensures no action is lost – actions are only removed from the queue when confirmed by server.
   In essence, local data is the source of truth when offline, and the cloud becomes source of truth 30
   once reconnected, with a reconciliation process to update local accordingly . This approach aligns 28
   with the principles of offline-first design (local data priority, async sync, conflict resolution) . Our pseudocode above captures the core of that logic for implementation.
6. CI/CD Pipeline (GitHub Actions Workflow)
   We establish a continuous integration and deployment pipeline using GitHub Actions to automate building, testing, and deploying the Pika platform. The monorepo contains both the Flutter app and Node.js services (managed by Nx), so the pipeline will cover both. Key stages include linting, testing, building artifacts, deploying infrastructure, and releasing apps. We also incorporate jobs for preview environments and manual promotion to production.
   A simplified YAML workflow for CI/CD is outlined below:
   name: Pika CI/CD Pipeline
   on:
   pull_request:
   branches: [ develop ]
   push:
   branches: [ main ]
   env:
   NX_BRANCH: ${{ github.ref }}
   jobs:

# 1. Static Analysis & Unit Tests

build-test:
runs-on: ubuntu-latest
strategy:
matrix:
include:

- task: backend # run Node backend tests
- task: frontend # run Flutter app tests
  steps:
- uses: actions/checkout@v4
  with: { fetch-depth: 0 }
- uses: actions/setup-node@v3
  23
  if: matrix.task == 'backend'
  with: { node-version: 20 }
- uses: subosito/flutter-action@v2
  if: matrix.task == 'frontend'
  with: { flutter-version: '3.10.5' } # example Flutter version - run: npm ci
  if: matrix.task == 'backend'
- run: nx format:check && nx lint && nx test
  if: matrix.task == 'backend'
- run: flutter pub get && flutter analyze && flutter test
  if: matrix.task == 'frontend'

# 2. Build & Package (if tests passed)

package:
needs: build-test
runs-on: ubuntu-latest
steps:

- uses: actions/checkout@v4
  with: { fetch-depth: 0 }
- uses: actions/setup-node@v3
  with: { node-version: 20 }
- run: npm ci
- run: nx build # build Node services (e.g., compile TypeScript)
- run: nx run pdf-service:build # example: build PDF generator Lambda (if separate)
- uses: subosito/flutter-action@v2
  with: { flutter-version: '3.10.5' }
- run: flutter pub get && flutter build apk --release
- run: flutter build ios --release # (on macOS runner in reality, separate job)
- uses: actions/upload-artifact@v3
  name: Upload APK
  with:
  name: pika-app-preview.apk
  path: build/app/outputs/flutter-apk/app-release.apk

# 3. Deploy to Staging (for main branch)

deploy-staging:
if: github.ref == 'refs/heads/main'
needs: package
runs-on: ubuntu-latest
environment: staging
steps:

- uses: actions/checkout@v4
- uses: actions/setup-node@v3
  with: { node-version: 20 }
- run: npm ci
- run: nx run-many --target=deploy --configuration=staging # This could trigger deploy scripts or IaC (CloudFormation/CDK/SAM) for all services
  24
- run: echo "Backend deployed to staging"
- run: echo "Uploading Flutter app to Firebase App Distribution (staging)"

# (Using Firebase CLI or fastlane if we distribute staging app builds)

# 4. Promotion to Production (manual approval)

deploy-prod:
if: github.ref == 'refs/heads/main'
needs: deploy-staging
runs-on: ubuntu-latest
environment:
name: production
url: https://pika.yourdomain.com

# GitHub environment can require manual approval here

steps:

- uses: actions/checkout@v4
- uses: actions/setup-node@v3
  with: { node-version: 20 }
- run: npm ci
- run: nx run-many --target=deploy --configuration=production
- run: echo "Backend deployed to production"
- run: echo "Trigger App Store/TestFlight release"

# (This might be a manual step or separate workflow)

This YAML outlines a possible workflow:
Triggering: We run CI on pull requests to the develop branch and full CI/CD on pushes to
•  
main . The idea is that feature development happens in branches/PRs, which get validated by CI, and merging to main triggers deployment to staging/production.
•  
Job 1: Build & Test – This uses a matrix to run both backend and frontend tasks in parallel. For the backend (Node/Nx), we check code format, run linters, and run unit tests ( nx format:check , nx lint , nx test ). This uses Nx’s affected commands to only run on 31
changed projects, which speeds up CI for monorepo . For the Flutter app, we run flutter analyze (static analysis) and flutter test (unit/widget tests). This ensures no code goes forward if tests fail or code is badly formatted.
•  
Job 2: Package – After tests pass, we build the artifacts. We compile the Node services – if using TypeScript, Nx build might use Webpack or tsc to produce bundles. We might build multiple deployable units: e.g., one for the main API (could be multiple lambdas or a single one), one for the PDF generator lambda, etc. Each can have a deploy target in Nx that packages it (possibly as a zip). For Flutter, we build the Android APK (and potentially an iOS app, which in GitHub Actions would require a Mac runner; we might run iOS build in a separate job or use Codemagic for mobile CI). We upload the APK as an artifact so it can be downloaded (for testers of that specific build or for attaching to a GitHub release). We might also integrate Firebase App Distribution to automatically distribute the app to testers whenever main is updated.
•  
Job 3: Deploy to Staging – This runs only for main branch pushes (post-merge). It uses the artifacts from packaging (or could rebuild if needed, but better to reuse artifacts or use Nx
25
caching). We deploy all services to a staging environment. Since we are using AWS Lambda and other AWS resources, this step could involve:
•  
Running infrastructure as code (IaC) deployments: possibly we have AWS SAM or
CloudFormation templates, or use the AWS CDK. For instance, Nx could have a target like nx deploy voucher-service --configuration=staging that uses CDK to deploy a stack (Lambda, API Gateway, RDS instance endpoint, etc.) to a staging AWS account or namespace. In our YAML, we showed nx run-many --target=deploy --configuration=staging which would deploy all relevant projects.
•  
Deploying the Node Lambdas: e.g., packaging zip and uploading to AWS Lambda, updating
functions. If using Serverless Framework or SAM, this could be a CLI command. If using CDK, the deploy target runs cdk deploy for each stack.
•  
Database migrations: If there are schema changes, we run migrations on the staging database
(could be part of deploy script).
•  
Uploading static assets: e.g., ensure the latest PDF (if any) is on S3, etc., though PDF is generated
dynamically.
•  
After backend is deployed, we might deploy the Flutter app to a staging distribution. For example, we could use the Firebase CLI to upload the APK to App Distribution for QA testers. This is hinted by the echo line; in practice, we'd integrate a real step using firebase-app distribution action or Fastlane for iOS TestFlight.
The staging environment allows final testing with real integrations. It might use a separate Postgres database (perhaps a smaller instance), a Redis instance, etc., all in AWS. We might protect it with basic auth or separate credentials, but since it’s internal, not critical.
•  
Job 4: Deploy to Production – This job depends on staging deployment and is tied to the production environment in GitHub (which can require manual approval). We configured environment: production with an URL (just for reference). GitHub Actions supports
environment protection; we will set that deploying to prod requires a human to approve (e.g., tech lead reviews staging and clicks "Approve" in GitHub UI). Once approved, this job runs: •  
Similar steps to staging: checkout, setup node, etc.
•  
Run nx deploy --configuration=production which deploys to the production AWS
environment. This would use production settings (like bigger DB instance, actual domain names, etc.). Perhaps this triggers deploying to AWS prod account via credentials configured in secrets.
•  
Post deployment, we might run smoke tests or health checks (not shown, but a good idea – e.g.,
call the health endpoint of the API, or run a quick Selenium test on critical flows).
•  
For the mobile app, production release might be manual (e.g., submit to App Store/Play Store). If
we wanted CI to handle it, we could integrate Fastlane: on a git tag, for instance, we trigger a separate workflow to push to app stores. Given the MVP scope, we might initially distribute the app via direct APK for Android and TestFlight for iOS. Long-term, releasing to stores would be a separate pipeline with manual steps (since store approvals are manual).
Additional CI/CD considerations:
•  
Secrets & Config: We use GitHub Actions secrets to store sensitive info like AWS credentials, Firebase service account keys, etc. Our deploy scripts use these to authenticate to AWS and Firebase. For example, we might have AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for a deploy user, and FIREBASE_TOKEN for distribution.
•  
Monorepo Nx optimizations: Nx Cloud or caching could be used so that if only frontend code
changed, we don’t rebuild backend and vice versa, saving time. We included nx format:check and such, which runs affected checks – the snippet from Nx docs shows
26
31
using nx affected to only run for changed projects . This can cut CI time significantly on large repos.
•  
Testing Environments: We might add an integration test job that, after deploying to staging, runs API tests against the staging URL (ensuring endpoints respond). Also, if we spin up ephemeral test environments for PRs (using something like Vercel preview or Heroku review apps), we could integrate that, but given AWS infra, we stick to a shared staging.
•  
Preview Apps: On each pull request, we have the artifacts (like the APK). We could automatically
post a link for QA to download the PR’s app build. Also, we might deploy a preview backend (maybe using a separate short-lived environment or mocking data). However, since we have staging, we might not do per-PR deploy due to complexity. Instead, PRs are tested via unit tests and maybe developer-run tests, and once merged to main it hits staging where QA can test the combined changes.
•  
GitHub Actions runners: We use ubuntu-latest for most. If we wanted to build iOS in CI, we’d need runs-on: macos-latest for that step, with appropriate steps (and provisioning profiles managed via secrets).
CI Speed and Cache: We ensure dependencies are cached. For Node, we used
•  
actions/setup-node with cache. For Flutter, subosito/flutter-action caches Flutter SDK but we might want to cache pub packages. This can be done with cache action keyed on pubspec. We also might cache Nx build outputs or use Nx Cloud for distributed builds.
•  
Quality Gates: We could include steps for code coverage (upload to Codecov) or static code analysis (like running SonarCloud or SAST tools). Not mandatory for MVP, but we set up a foundation so it can be added easily.
The pipeline described ensures that any code change goes through automated checks and that deployments are consistent and reproducible. By using Infrastructure as Code and Nx, we maintain parity between environments (staging mirrors production setup). Deployment via GitHub Actions automates what would otherwise be manual AWS console work, reducing error. We also have rollback strategies: since we use Lambdas, deploying a new version doesn’t immediately break the old one – we can switch traffic if needed, or redeploy a previous stable version quickly (especially if using tools like SAM or CDK). Additionally, having a staging environment means we catch issues before users do.  
In terms of cost and efficiency: using GitHub Actions for CI is free for a fair amount of minutes per month; our build times for Flutter and Node for 10k users scale (the build time doesn’t depend on user count, just codebase size). The AWS deployment part might incur some cost (API calls, etc., negligible). We might consider self-hosted runners if needed for cost or speed (especially for the Mac builds), but initially, the hosted runners suffice. 7. Risk Register (Technical & Security Risks)
We identify key risks for the platform and mitigation strategies for each. Below is a register of major risks, including fraud scenarios and compliance concerns:
27
Risk Impact Mitigation Strategies
Unique, secure codes: Use signed JWT QR codes
with short expiration to ensure a code cannot be
3
reused after a brief window . Each voucher
Financial loss to retailers
redemption requires a one-time token. One
(coupons redeemed
redemption per user enforcement: Even if a
Voucher Fraud
more times than
printed code is shared, the backend checks the
& Code Reuse
intended), erosion of
user’s account – each code can only be redeemed
(Customers
trust in the platform’s
once per user . Rate limiting and alerts:
1
exploiting
deals. For example, if a
Monitor redemption frequency; flag if a single
vouchers
QR or code leaks
voucher code is attempted by many users or
multiple times
publicly, many
unusually rapid scans. The Retailer app also shows
or generating
unauthorized
if a code is already redeemed, preventing reuse in
fake codes)
redemptions could
real-time. Short code complexity: Use sufficiently
occur.
complex short codes (8+ characters alphanumeric)
to prevent brute-force guessing. Store a mapping in
Redis for quick validation and mark codes as
consumed atomically.
Digital signatures & verification: The QR code
JWT is signed and includes an expiration and
voucher ID, so a fake voucher code will be detected
Because the system
by the retailer app (signature won’t verify) even
allows offline operation,
offline . The retailer app will not accept a code it
22
a savvy user or
can’t verify. Client-side validation: Retailer app
malicious retailer might
uses the public key to validate JWT offline and
attempt to alter app
checks exp to avoid accepting an expired token. It
data or redeem without
Offline
also should refuse a token that appears used – for
server verification,
Redemption
instance, we can include a unique nonce in each
risking unauthorized
Abuse
token; if a token is presented twice offline, the
usage (e.g., editing local
(Manipulating
retailer app can catch that (if we store recently seen
Hive data to mark a
offline mode to
nonce in local memory). Post-sync reconciliation:
voucher as redeemed
bypass rules)
When offline data syncs to server, the server
without actual
double-checks everything. If it finds anomalies (e.g.,
redemption). Also, if the
two redemptions of same voucher by one user from
retailer device is offline
offline), it can retroactively flag them. Possibly
for long, multiple uses
revoke one and notify the retailer. Secure local
of the same code might
storage: Use Flutter secure storage or obfuscation
slip in.
for sensitive flags (to reduce casual tampering). For
example, the “redeemed” status in the app is not
the source of truth – the server’s reconciliation is.

28
Risk Impact Mitigation Strategies
Strong Authentication & Authorization: All API
calls require JWT tokens; we validate them with
Firebase/Cognito. Use fine-grained roles (customer
vs retailer vs admin) in tokens or internal ACL. JWT
security: Use high entropy secrets or ECDSA keys
for signing tokens. Short token lifespan for critical
An attacker might target
operations (the QR token TTL) limits replay window
our APIs or cloud
. TLS everywhere: All network calls are over
3
resources. E.g., without
HTTPS to prevent sniffing tokens or codes. Rate
proper auth, someone
limiting: Apply per-IP/user rate limits (via API
Unauthorized
could list vouchers or
Gateway or a middleware) to prevent brute force on
Access & Data
redeem them. Or an
short codes or token guessing. Possibly use AWS
Leaks
attacker could steal a
WAF or similar to block malicious patterns. Cloud
JWT and reuse it quickly.
Security: Limit IAM permissions for our services;
Also, personal data (like
for example, the Lambda that generates PDFs can
emails, reviews) must be
only access the S3 bucket for PDFs, nothing else.
protected.
Enable server-side encryption on S3 for stored PDFs
(even if they’re not highly sensitive). Monitoring
and Alerts: Set up CloudWatch alarms for
suspicious activity (e.g., sudden spike in
redemption failures or many 401 responses
indicating token issues).
Data Minimization: Collect only data needed for
service (name, email, location if user allows for
“near me” – and we ask permission explicitly). Avoid
storing sensitive personal data unnecessarily.  
Consent for location and notifications: Clearly
ask user permission for GPS location to find nearby
Though launching in
vouchers, and for sending push notifications, per
Paraguay, if the app
platform standards. Privacy Policy & Options:
might have
Provide a privacy policy in-app. Allow users to
international users or
delete their account/data. Implement a process to
later expand, it must
delete or anonymize personal data upon request
GDPR and Data
handle personal data
(e.g., remove reviews or personal identifiers).  
Privacy
carefully. Risk of
Secure storage: Encrypt personal data at rest
Compliance
violating privacy laws by
(Postgres uses disk encryption via RDS, we could
mishandling user data
additionally encrypt fields like emails if needed). For
(e.g., emails, location) or
European users, we’d consider storing data in EU
not honoring deletion
regions, but for now, we at least document where
requests. Also local laws
data is stored (likely AWS us-east or sa-east region
for data might apply.
for PY). GDPR Readiness: Though not immediately
required, design the system so that implementing
GDPR rights is possible: e.g., we can delete a user’s
reviews and redemption history if they request (or
aggregate it so it’s not personally identifiable). We
ensure not to log excessive PII in logs.

29
Risk Impact Mitigation Strategies
Process & fallback: Encourage retailers/admin to
provide voucher descriptions in all target
languages; the system can have a fallback (e.g., if
The app supports four
Guaraní text is missing, show Spanish as default) to
languages; there’s a risk
avoid blank fields. Mark clearly which language a
Multilingual
that some voucher info
review is in, or possibly separate reviews by locale.  
Data
is missing a translation
Testing: Have bilingual QA verify that switching app
Consistency
or a user-submitted
language shows the right content. Use translation
(Incorrect or
review in one language
services for the app UI text; maintain a glossary for
inconsistent
is seen by others who
deal terms to ensure consistency. This is largely
translations)
can’t read it. Not a
procedural – technically, the platform stores
security risk but affects
multiple text fields and the app picks according to
user experience.
locale. We also plan for scalability: adding more
languages just means adding fields, the design
supports it.

30
Risk Impact Mitigation Strategies
Caching & Optimization: We use Redis to cache
frequent reads like top vouchers, reducing DB load.
E.g., when the app queries GET /vouchers , we
can cache the result set for popular filters (or at
least cache static content like voucher images or
translations). Redis can also help store session or
rate-limit counters. PostgreSQL tuning: Use proper
indexes (we will definitely index voucher  
location (PostGIS) and perhaps fields like
category or expiration for quick queries). At 10k
users, if each has, say, 100 vouchers, that’s 1M rows
in a join table at most – well within Postgres
capabilities with indexing. Use connection pooling
If the system isn’t
(AWS RDS Proxy or PgBouncer) to handle many
optimized, by 10k users
concurrent Lambda invocations hitting the DB.  
(or beyond), certain
Serverless scaling: AWS Lambda will auto-scale for
components could lag.
API traffic up to concurrency limits; we configure
Scaling &
E.g., the database might
those limits and monitor (and can request
Performance
get heavy reads for
increases). The stateless nature of our Node
Bottlenecks (as
vouchers, or the PDF
services means scaling horizontally is trivial. We
user count
generation might be
must ensure cold start times are small (use smaller
grows)
slow with many
Lambda packages, maybe provisioned concurrency
vouchers, or push
if needed for consistent low latency). PDF
notifications to
generation: This could be heavy if done
thousands might stall.
synchronously. We mitigate by doing it in a
separate Lambda asynchronously (the admin call
returns 202 Accepted). The Lambda can have more
memory for faster headless browser performance.
We might limit PDF generation to at most once a
month or on-demand by admin to avoid excessive
load. For 100 vouchers, a PDF ~10-20 pages is fine;
if we ever had 1000 vouchers in a book, we might
need to paginate by category or produce multiple
books. Firebase Messaging: sending 10k
notifications is easy (FCM can handle bulk topics). If
we do user-specific messages (confirmation after
redemption), that’s 1:1 and fine. For broadcasts, we
use FCM’s topic messaging to fan out efficiently.

31
Risk Impact Mitigation Strategies
Cost Monitoring: Set up AWS budget alerts for
early warning (e.g., notify if monthly cost exceeds
$X). Right-sizing: Start with small instances: e.g.,
db.t3.small for Postgres in early stage (~$30/mo)
and scale up when needed to t3.medium (~$60) at
10k users – we will monitor DB CPU/memory and
upgrade only when necessary. Use AWS Auto
Not exactly security, but
Scaling for Lambdas (concurrency limits to avoid
a business risk: if our
runaway costs from a bug). CloudFront caching:
usage patterns or
Use CDN (CloudFront) for static assets like images
misconfigurations lead
AWS Cost
and PDF to reduce S3 direct egress costs –
to unexpectedly high
Overrun
CloudFront has cheaper rates and caches content
AWS bills (e.g.,
(Infrastructure
at edge. We estimate CloudFront to cost only a few
unbounded Lambda
costs exceed
dollars at our scale . By caching the monthly PDF
32
invocations in a bug
budget)
on CloudFront, if 10k users download it, the origin
loop, or large data
(S3) isn’t hit 10k times, maybe only a few times.  
egress, or an oversized
Developer diligence: Optimize code to avoid chatty
database instance), this
patterns (combine DB queries, avoid retrieving
could hurt the project.
huge data unnecessarily). Using Nx and linters will
catch some inefficiencies early. We also keep an eye
on external API usage (Firebase is mostly free at
our scale, but if we used other APIs like Google
Maps for geocoding, that might add cost – for now
we don’t). In section 8 we detail expected costs,
which are manageable, but vigilance is important.

Each risk above is addressed with a multi-layer approach. For example, fraud prevention is not just one thing but a combination of technical controls (signed tokens, unique codes, backend checks) and process (monitoring, setting one redemption per customer policy). By planning these mitigations from the start, we reduce the chances of incidents. We’ll continuously revise this register as we test the system and gather real-world usage data, adding new risks or updating strategies. 8. Cost Forecast (0 to 10k Users on AWS & Firebase)
We estimate the infrastructure costs for scaling Pika from launch (no users) to about 10,000 monthly active users. The stack is largely serverless and managed, which helps keep costs low at low usage, and scales with demand. Below is a breakdown of key services and their expected monthly cost:
•  
AWS Lambda (Node.js backend functions): At 0 users, Lambda usage is near zero (maybe a few test invocations). AWS’s free tier provides 1M free requests and 400,000 GB-seconds of compute per month, which covers a lot of usage. For 10k users, assume each user triggers ~100 function invocations per month (browsing vouchers, claiming, etc.) → ~1,000,000 invocations. With an average function execution of 100ms on 128MB memory, the monthly compute usage is about 12,800 GB-s (which still falls in the free tier). Even if we exceed free tier slightly, Lambda is very cheap: e.g., 1 million requests cost ~$0.20 and 12,800 GB-s is ~$0.27. So roughly <$1 per month 33
at 10k users, likely covered by free tier . (If usage grows to tens of millions of hits, it will go up linearly.)
32
•  
Amazon API Gateway (if used): Not explicitly listed, but if we put our Lambdas behind API 34
Gateway for REST endpoints, that has a cost of ~$3.50 per million requests . At 1M requests, that’s ~$3.50. If we use an ALB instead, cost structure differs but similar magnitude for low scale. We should budget a few dollars for API Gateway at 10k users.
•  
PostgreSQL (Amazon RDS with PostGIS): The main fixed cost. No “free tier” for RDS beyond a
temporary trial. For development, we could use a small instance or free tier if eligible (db.t3.micro might be free for 12 months). At 0 users, we still likely run an RDS instance to keep the service up. A db.t3.small (2 vCPU, 2GB RAM) costs around $0.027/h (~$20/month) if single AZ. We might use db.t3.medium (4GB) for better performance as we approach 10k users, which 35 36
is ~$0.068/h in us-east (~$50/month) . Storage: say we allocate 20GB GP2 storage (~$2/ month). So:
•  
Initially: ~$20-30/month (small instance).
•  
At 10k users: ~$60/month (medium instance for production, plus storage and multi-AZ maybe +20). If we use AWS Aurora Serverless Postgres, it could auto-scale; but given our user count, a fixed t3 instance is fine. We also consider one staging DB (t3.small ~$20) but that’s optional.
•  
Amazon ElastiCache (Redis): Not strictly needed at day 1, but we have it in tech stack for caching and maybe session store. Smallest instance is cache.t3.micro ~$0.017/hour which is ~$12/month. Let’s round to $15/month with some data transfer. At 10k users, that tiny instance likely suffices because our cache usage is light (mostly caching hot data). If we needed more, a cache.t3.small is ~$30/month, but probably unnecessary until far beyond 10k or if using Redis for heavy analytics. So about $15 (initial) to $30.
• 7
Firebase Cloud Messaging: Free. Firebase does not charge for FCM messages . Even at scale, sending notifications to 10k or 100k devices costs $0 through FCM. We only pay if we use other Firebase features. So $0.
• 5
Firebase/Auth (Cognito): Firebase Auth is free for up to 50k MAUs , so 10k is free. Cognito is 4
free for 50k MAUs as well . So $0 at our scale. If we exceed 50k, Cognito costs $0.0055 per MAU beyond that, but that’s future.
•  
AWS S3 (Storage for PDFs & images): Storing the monthly PDF (say a 5 MB file) and maybe some voucher images. The storage cost: $0.023 per GB-month, negligible (<$0.01). Transfer: if 10k users download 5MB each, that’s ~50 GB outbound per month. S3 egress to internet is ~$0.09/GB, so ~ $4.5. However, if behind CloudFront, the cost shifts to CloudFront which is cheaper per GB in region. Also first 100GB out of S3 per month can be free on AWS free tier. Let’s assume $3-5/month for S3 data transfer at 10k users. (At 0 users, $0.) We might also store voucher images (let’s say 100 vouchers _ maybe 0.1MB each = 10MB), trivial storage. S3 PUT/LIST requests are fractions of cents (couple thousand a month < $0.1). Overall S3 cost ~ $5/month at 37
10k (mostly transfer) .
•  
Amazon CloudFront (CDN): Using CloudFront to serve the PDF and any static assets (images) to users in Paraguay (likely edge location in São Paulo or US). CloudFront has a free tier of 1TB for first year. Even after, 50GB as calculated would cost ~50 _ $0.085 = $4.25 in region (pricing varies 32
but ~9¢/GB). Also small request fees: 10k-50k requests ~$0.1-$0.5 . So ~$5 or less per month at 10k users. CloudFront is very cost-effective at our scale.
33
•  
AWS SES (Simple Email Service): Possibly used for email notifications (password reset, etc.) though Firebase can handle auth emails. If we use SES for any transactional emails (newsletters with the PDF?), the first 62k emails/month are free. For 10k users, if we send one email (like monthly newsletter with PDF link) that’s 10k emails – free. Even if we send a few emails each, likely stays free or <$1 (after free tier, $0.10 per 1000). So ~$0 at start, maybe $1 at 10k if any heavy usage.
•  
AWS SNS or SQS: Not explicitly in our design, but if we use SNS for push (we use FCM instead) or SQS for decoupling, those have minimal costs. Probably not needed now. If we use SQS for background jobs (like PDF generation queue), a few thousand messages costs cents.
•  
Monitoring/Logging: CloudWatch Logs for Lambdas – typically free up to 5GB, then $0.50/GB.
Our logs at 10k users might be few hundred MB, so negligible. CloudWatch Metrics are free for basic usage (custom metrics cost but we may not need many custom ones). So maybe $1-2 at most for logs if verbose.
•  
Domain & SSL: Route53 domain registration ~$12/yr (negligible monthly). Route53 DNS $0.50/
month per zone + $0.40/million queries – trivial cost. SSL cert via AWS is free. Summing it up, approximate monthly costs:
•  
Initial (0 users/dev): Taking into account always-on resources:
•  
RDS db.t3.small: ~$20
•  
Redis micro: ~$15
•  
Minimal Lambda/API Gateway usage: ~$0 •  
S3/CloudFront: ~$0 (tiny usage, within free)
•  
Others: ~$0 (Auth, FCM, SES free).
•  
Total ~ $35/month (development environment, mostly database and cache).
We can reduce this by turning off staging DB out of hours or using serverless Aurora that can pause (Aurora Serverless v2 could scale to 0 when idle, saving costs, but let’s keep it simple with a small instance).
•  
At ~10k MAU:
•  
RDS db.t3.medium: ~$50-60 •  
ElastiCache small: ~$15-20
• 34 33
Lambda & API Gateway: ~$5 (likely less, free covers most) .
• 37 32
S3 & CloudFront: ~$5 (for PDF and images delivery) .
•  
SES emails: ~$1 (if used for monthly mail).
• 4
Cognito/Auth: $0 (within free for 10k) .
•  
CloudWatch/others: ~$2.
•  
Total ~ $80-100/month.
This is very affordable. Even if we double user count or usage, it might go to $150-$200, dominated by the DB and maybe moving to a larger instance or adding multi-AZ (which doubles DB cost for HA). With 10k users mostly reading data, the load on DB is not extreme; writes (claims, redemptions) are proportional to user actions but still manageable.
One-time costs: developer time and perhaps tools (but CI using GitHub Actions likely within free minutes at our project size, or a slight cost if we go beyond – GitHub gives some free minutes, and
34
additional are $0.008 per minute for Linux, but open source or small projects often have enough free minutes).
Scaling beyond 10k: Just for context, if we reached say 100k users: - We’d likely use a larger DB (db.t3.large or cluster) ~$130-200, - Lambda requests maybe 10M ($2) + more compute ($5) ~ $7, - CloudFront maybe 500GB ~ $40, - Still in low hundreds per month total. So the serverless approach is cost-effective until we hit much larger scale (where we’d maybe refactor components, but that’s beyond MVP).
We will continuously monitor these costs. AWS offers detailed billing; we set alarms so if a bug (like a Lambda infinite loop) causes abnormal usage, we catch it quickly. This cost profile is very reasonable for a startup at this stage and allows us to operate the MVP within a modest budget (under $100/month for 10k active users).
35
1
How to Prevent Coupon Fraud and Promotion Abuse in 2025?
https://www.voucherify.io/blog/how-to-prevent-coupon-fraud-and-abuse
2
Offline Coupon Tracking – How to Track Offline Sales?
https://www.voucherify.io/blog/offline-coupon-tracking-without-the-sweat
3 21 23 Overflow
javascript - How can one best compress a JWT before making a QR code from it? - Stack
https://stackoverflow.com/questions/69351341/how-can-one-best-compress-a-jwt-before-making-a-qr-code-from-it
4 32 33 34 37
Cost - Cloud Migration Factory on AWS
https://docs.aws.amazon.com/solutions/latest/cloud-migration-factory-on-aws/cost.html
5
Flutter. Firebase is a trap - Medium
https://medium.com/easy-flutter/flutter-firestore-authentication-cost-fd482a2d51bf
6
sql - POSTGIS Get nearest locations query - Stack Overflow
https://stackoverflow.com/questions/62933390/postgis-get-nearest-locations-query
7
Firebase Cloud messaging costs
https://groups.google.com/g/firebase-talk/c/vtkImpBZbPg
8
PostGIS
https://postgis.net/
9 10 11 13 14 15 16 17 25 26 28 29 30 Management
Chipode En - Offline-First Approach in Flutter: Local Data
https://chipode.com/en/blog/offline-first-approach-in-flutter-local-data-management/
12
Best practice to implement offline sync in flutter app ? : r/FlutterDev
https://www.reddit.com/r/FlutterDev/comments/1g2ed7e/best_practice_to_implement_offline_sync_in/
18 19 20 24
Use CSS print styles with Tailwind
https://www.jacobparis.com/content/css-print-styles
22
[PDF] APPLICATION OF INTERACTIVE QR CODE BASED ONLINE ...
https://repo.ijiert.org/index.php/ijiert/article/download/3106/2704/5664
27
Flutter — Offline First, with Flutter_Data | by simbu | Level Up Coding
https://levelup.gitconnected.com/flutter-offline-first-with-flutter-data-62bad61097be?gi=b6485a406d44
31
Configuring CI Using GitHub Actions and Nx | Nx
https://nx.dev/ci/recipes/set-up/monorepo-ci-github-actions
35
db.t3.medium pricing and specs - Vantage
https://instances.vantage.sh/aws/rds/db.t3.medium
36
db.t3.medium pricing: 80.30 monthly - AWS RDS - Economize Cloud
https://www.economize.cloud/resources/aws/pricing/rds/db.t3.medium/ 36
