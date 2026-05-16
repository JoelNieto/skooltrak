import { BetterAuthGuard, Perm, PermissionsGuard, RequirePermissions } from '@/auth';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AddToCartInput } from './dto/add-to-cart.input';
import { CheckoutStoreInput } from './dto/checkout-store.input';
import { CreateStoreCategoryInput } from './dto/create-store-category.input';
import { CreateStoreProductInput } from './dto/create-store-product.input';
import { ProcessStorePaymentInput } from './dto/process-store-payment.input';
import { UpdateCartItemInput } from './dto/update-cart-item.input';
import { UpdateStoreCategoryInput } from './dto/update-store-category.input';
import { UpdateStoreOrderStatusInput } from './dto/update-store-order-status.input';
import { UpdateStoreProductInput } from './dto/update-store-product.input';
import { StoreService } from './store.service';

@ApiTags('store')
@ApiBearerAuth()
@UseGuards(BetterAuthGuard, PermissionsGuard)
@Controller('v1/store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get('categories')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Store categories' })
  storeCategories(@Query('schoolId') schoolId: string) {
    return this.storeService.storeCategories(schoolId);
  }

  @Get('products')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Store products' })
  storeProducts(
    @Query('schoolId') schoolId: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.storeService.storeProducts(schoolId, search, categoryId);
  }

  @Get('cart')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'My cart' })
  myStoreCart(@Query('schoolId') schoolId: string) {
    return this.storeService.myCart(schoolId);
  }

  @Get('orders')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'My orders' })
  myStoreOrders(@Query('schoolId') schoolId: string) {
    return this.storeService.myOrders(schoolId);
  }

  @Get('orders/:id')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Order by id' })
  storeOrder(@Param('id') id: string) {
    return this.storeService.storeOrder(id);
  }

  @Get('products/:id')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Product by id' })
  storeProduct(@Param('id') id: string) {
    return this.storeService.storeProduct(id);
  }

  @Post('cart/items')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Add to cart' })
  addToStoreCart(@Body() input: AddToCartInput) {
    return this.storeService.addToCart(input);
  }

  @Patch('cart/items')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Update cart item' })
  updateStoreCartItem(@Body() input: UpdateCartItemInput) {
    return this.storeService.updateCartItem(input);
  }

  @Delete('cart/items/:cartItemId')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Remove cart item' })
  removeStoreCartItem(@Param('cartItemId') cartItemId: string) {
    return this.storeService.removeFromCart(cartItemId);
  }

  @Post('cart/clear')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Clear cart' })
  clearStoreCart(@Body() body: { schoolId: string }) {
    return this.storeService.clearCart(body.schoolId);
  }

  @Post('checkout')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Checkout' })
  checkoutStore(@Body() input: CheckoutStoreInput) {
    return this.storeService.checkout(input);
  }

  @Post('payments/process')
  @RequirePermissions(Perm.VIEW_STORE)
  @ApiOperation({ summary: 'Process payment' })
  processStorePayment(@Body() input: ProcessStorePaymentInput) {
    return this.storeService.processPayment(input);
  }

  @Get('admin/categories')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Admin categories' })
  storeCategoriesAdmin(@Query('schoolId') schoolId: string) {
    return this.storeService.storeCategoriesAdmin(schoolId);
  }

  @Post('admin/categories')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Create category' })
  createStoreCategory(@Body() input: CreateStoreCategoryInput) {
    return this.storeService.createCategory(input);
  }

  @Patch('admin/categories')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Update category' })
  updateStoreCategory(@Body() input: UpdateStoreCategoryInput) {
    return this.storeService.updateCategory(input);
  }

  @Delete('admin/categories/:id')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Delete category' })
  deleteStoreCategory(@Param('id') id: string) {
    return this.storeService.deleteCategory(id);
  }

  @Get('admin/products')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Admin products' })
  storeProductsAdmin(@Query('schoolId') schoolId: string) {
    return this.storeService.storeProductsAdmin(schoolId);
  }

  @Post('admin/products')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Create product' })
  createStoreProduct(@Body() input: CreateStoreProductInput) {
    return this.storeService.createProduct(input);
  }

  @Patch('admin/products')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Update product' })
  updateStoreProduct(@Body() input: UpdateStoreProductInput) {
    return this.storeService.updateProduct(input);
  }

  @Delete('admin/products/:id')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Delete product' })
  deleteStoreProduct(@Param('id') id: string) {
    return this.storeService.deleteProduct(id);
  }

  @Get('admin/orders')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Admin orders' })
  storeOrdersAdmin(@Query('schoolId') schoolId: string) {
    return this.storeService.storeOrdersAdmin(schoolId);
  }

  @Patch('admin/orders/status')
  @RequirePermissions(Perm.MANAGE_STORE)
  @ApiOperation({ summary: 'Update order status' })
  updateStoreOrderStatus(@Body() input: UpdateStoreOrderStatusInput) {
    return this.storeService.updateOrderStatus(input);
  }
}
