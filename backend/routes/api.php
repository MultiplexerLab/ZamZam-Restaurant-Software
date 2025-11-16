<?php

use App\Http\Controllers\FoodExchangeItemController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FoodController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SetMenuController;
use App\Http\Controllers\SetMenuControllerV1;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [UserController::class, 'getUser']);


    Route::prefix('admin')->group(function () {

        Route::get('categories/{category}/foods', [FoodController::class, 'getByCategory']);


        Route::apiResource('set-menus', SetMenuControllerV1::class);
        Route::post('set-menus/{setMenu}/slots', [SetMenuControllerV1::class, 'addSlot']);
        Route::put('set-menus/{setMenu}/slots/{slot}', [SetMenuControllerV1::class, 'updateSlot']);
        Route::delete('set-menus/{setMenu}/slots/{slot}', [SetMenuControllerV1::class, 'deleteSlot']);
    });

    Route::apiResource('branch', BranchController::class);
    Route::apiResource('category', CategoryController::class);
    Route::apiResource('employee', EmployeeController::class);
    Route::apiResource('food', FoodController::class);
    Route::apiResource('purchase', PurchaseController::class);
    Route::apiResource('setmenu', SetMenuController::class);
//    Route::apiResource('food-exchange-items', FoodExchangeItemController::class);
    Route::post('/food-exchange-items', [FoodExchangeItemController::class, 'store']);
    Route::get('/food-exchange-items', [FoodExchangeItemController::class, 'index']);
    Route::delete('/food-exchange-items/{id}', [FoodExchangeItemController::class, 'destroy']);


    Route::get('/foods/{food}/similar', [FoodController::class, 'getSimilarCategoryFoods']);


    Route::get('/cart', [CartController::class,'index']);
    Route::post('/cart/add', [CartController::class,'add']);
    Route::put('/cart/{id}', [CartController::class,'update']);
    Route::delete('/cart/{id}', [CartController::class,'destroy']);

    Route::post('/order', [OrderController::class,'store']);
    Route::get('/orders', [OrderController::class,'index']);
    Route::get('/user-orders', [OrderController::class,'myTableOrders']);
    Route::get('/table-orders', [OrderController::class,'getTableOrders']);
    Route::get('/orders/{id}', [OrderController::class,'show']);
    Route::put('/orders/{id}', [OrderController::class,'update']);
    Route::delete('/orders/{id}', [OrderController::class,'destroy']);
    Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
    Route::put('/table-payments/{tableNumber}', [OrderController::class, 'payTableOrders']);
    Route::put('/table-pay', [PaymentController::class, 'payTable']);
    Route::get('/payment-history', [PaymentController::class, 'paymentHistory']);
    Route::get('/table-pending-orders/{table_number}', [OrderController::class, 'getPendingOrdersByTable']);
});
