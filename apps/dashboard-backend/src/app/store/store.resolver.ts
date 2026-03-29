import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AddToCartInput } from './dto/add-to-cart.input';
import { CheckoutStoreInput } from './dto/checkout-store.input';
import { CreateStoreCategoryInput } from './dto/create-store-category.input';
import { CreateStoreProductInput } from './dto/create-store-product.input';
import { ProcessStorePaymentInput } from './dto/process-store-payment.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { UpdateStoreCategoryInput } from './dto/update-store-category.input';
import { UpdateStoreOrderStatusInput } from './dto/update-store-order-status.input';
import { UpdateStoreProductInput } from './dto/update-store-product.input';
import { StoreCartItem } from './entities/store-cart-item.entity';
import { StoreCategory } from './entities/store-category.entity';
import { StoreOrder } from './entities/store-order.entity';
import { StoreProduct } from './entities/store-product.entity';
import { StoreService } from './store.service';

@UseGuards(BetterAuthGuard, PermissionsGuard)
@Resolver()
export class StoreResolver {
  constructor(private readonly storeService: StoreService) {}

  // --- Catalog (VIEW_STORE) ---
  @RequirePermissions(Perm.VIEW_STORE)
  @Query(() => [StoreCategory], { name: 'storeCategories' })
  storeCategories(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.storeCategories(schoolId);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Query(() => [StoreProduct], { name: 'storeProducts' })
  storeProducts(
    @Args('schoolId', { type: () => String }) schoolId: string,
    @Args('search', { type: () => String, nullable: true }) search?: string,
    @Args('categoryId', { type: () => String, nullable: true }) categoryId?: string,
  ) {
    return this.storeService.storeProducts(schoolId, search, categoryId);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Query(() => StoreProduct, { name: 'storeProduct', nullable: true })
  storeProduct(@Args('id', { type: () => String }) id: string) {
    return this.storeService.storeProduct(id);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Query(() => [StoreCartItem], { name: 'myStoreCart' })
  myStoreCart(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.myCart(schoolId);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Mutation(() => StoreCartItem)
  addToStoreCart(@Args('input') input: AddToCartInput) {
    return this.storeService.addToCart(input);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Mutation(() => StoreCartItem)
  updateStoreCartItem(@Args('input') input: UpdateCartItemInput) {
    return this.storeService.updateCartItem(input);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Mutation(() => Boolean)
  removeStoreCartItem(@Args('cartItemId', { type: () => String }) cartItemId: string) {
    return this.storeService.removeFromCart(cartItemId);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Mutation(() => Boolean)
  clearStoreCart(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.clearCart(schoolId);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Mutation(() => StoreOrder)
  checkoutStore(@Args('input') input: CheckoutStoreInput) {
    return this.storeService.checkout(input);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Mutation(() => StoreOrder)
  processStorePayment(@Args('input') input: ProcessStorePaymentInput) {
    return this.storeService.processPayment(input);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Query(() => [StoreOrder], { name: 'myStoreOrders' })
  myStoreOrders(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.myOrders(schoolId);
  }

  @RequirePermissions(Perm.VIEW_STORE)
  @Query(() => StoreOrder, { name: 'storeOrder' })
  storeOrder(@Args('id', { type: () => String }) id: string) {
    return this.storeService.storeOrder(id);
  }

  // --- Admin (MANAGE_STORE) ---
  @RequirePermissions(Perm.MANAGE_STORE)
  @Query(() => [StoreCategory], { name: 'storeCategoriesAdmin' })
  storeCategoriesAdmin(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.storeCategoriesAdmin(schoolId);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => StoreCategory)
  createStoreCategory(@Args('input') input: CreateStoreCategoryInput) {
    return this.storeService.createCategory(input);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => StoreCategory)
  updateStoreCategory(@Args('input') input: UpdateStoreCategoryInput) {
    return this.storeService.updateCategory(input);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => Boolean)
  deleteStoreCategory(@Args('id', { type: () => String }) id: string) {
    return this.storeService.deleteCategory(id);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Query(() => [StoreProduct], { name: 'storeProductsAdmin' })
  storeProductsAdmin(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.storeProductsAdmin(schoolId);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => StoreProduct)
  createStoreProduct(@Args('input') input: CreateStoreProductInput) {
    return this.storeService.createProduct(input);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => StoreProduct)
  updateStoreProduct(@Args('input') input: UpdateStoreProductInput) {
    return this.storeService.updateProduct(input);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => Boolean)
  deleteStoreProduct(@Args('id', { type: () => String }) id: string) {
    return this.storeService.deleteProduct(id);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Query(() => [StoreOrder], { name: 'storeOrdersAdmin' })
  storeOrdersAdmin(@Args('schoolId', { type: () => String }) schoolId: string) {
    return this.storeService.storeOrdersAdmin(schoolId);
  }

  @RequirePermissions(Perm.MANAGE_STORE)
  @Mutation(() => StoreOrder)
  updateStoreOrderStatus(@Args('input') input: UpdateStoreOrderStatusInput) {
    return this.storeService.updateOrderStatus(input);
  }
}
