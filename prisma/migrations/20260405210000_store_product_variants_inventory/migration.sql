-- CreateTable
CREATE TABLE "store_product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_product_variants_productId_label_key" ON "store_product_variants"("productId", "label");

-- CreateIndex
CREATE INDEX "store_product_variants_productId_idx" ON "store_product_variants"("productId");

-- AddForeignKey
ALTER TABLE "store_product_variants" ADD CONSTRAINT "store_product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "store_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One variant per product from legacy stock (label updated from size column when present)
INSERT INTO "store_product_variants" ("id", "productId", "label", "stock", "sortOrder", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p.id,
    'Único',
    p."stock",
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "store_products" p;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'store_products' AND column_name = 'size'
    ) THEN
        UPDATE "store_product_variants" v
        SET "label" = COALESCE(NULLIF(TRIM(p."size"), ''), 'Único')
        FROM "store_products" p
        WHERE v."productId" = p.id;
    END IF;
END $$;

-- Cart: add variant, backfill, drop product reference
ALTER TABLE "store_cart_items" ADD COLUMN "variantId" TEXT;

UPDATE "store_cart_items" c
SET "variantId" = (
    SELECT v.id
    FROM "store_product_variants" v
    WHERE v."productId" = c."productId"
    ORDER BY v."sortOrder" ASC, v.id ASC
    LIMIT 1
);

ALTER TABLE "store_cart_items" DROP CONSTRAINT "store_cart_items_productId_fkey";

DROP INDEX IF EXISTS "store_cart_items_userId_productId_key";

ALTER TABLE "store_cart_items" DROP COLUMN "productId";

ALTER TABLE "store_cart_items" ALTER COLUMN "variantId" SET NOT NULL;

ALTER TABLE "store_cart_items" ADD CONSTRAINT "store_cart_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "store_product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "store_cart_items_userId_variantId_key" ON "store_cart_items"("userId", "variantId");

-- Order lines: snapshot size label, optional FK to variant
ALTER TABLE "store_order_items" ADD COLUMN "variantId" TEXT;
ALTER TABLE "store_order_items" ADD COLUMN "variantLabel" TEXT;

UPDATE "store_order_items" oi
SET
    "variantId" = (
        SELECT v.id
        FROM "store_product_variants" v
        WHERE v."productId" = oi."productId"
        ORDER BY v."sortOrder" ASC, v.id ASC
        LIMIT 1
    ),
    "variantLabel" = (
        SELECT v.label
        FROM "store_product_variants" v
        WHERE v."productId" = oi."productId"
        ORDER BY v."sortOrder" ASC, v.id ASC
        LIMIT 1
    );

ALTER TABLE "store_order_items" ADD CONSTRAINT "store_order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "store_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop legacy product columns
ALTER TABLE "store_products" DROP COLUMN IF EXISTS "size";
ALTER TABLE "store_products" DROP COLUMN "stock";
