-- CreateTable
CREATE TABLE "analytics"."search_queries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "query" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "last_searched" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_queries_count_idx" ON "analytics"."search_queries"("count" DESC);

-- CreateIndex
CREATE INDEX "search_queries_last_searched_idx" ON "analytics"."search_queries"("last_searched");

-- CreateIndex
CREATE INDEX "search_queries_query_idx" ON "analytics"."search_queries"("query");

-- CreateIndex
CREATE UNIQUE INDEX "search_queries_query_key" ON "analytics"."search_queries"("query");
