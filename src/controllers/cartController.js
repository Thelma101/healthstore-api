const Cart = require('../models/cartModel');
const Drug = require('../models/drugModel');
const {
    successResponse,
    createdResponse,
    noContentResponse,
    badRequestResponse,
    notFoundResponse,
    validationErrorResponse,
    errorResponse
} = require('../utils/apiResponse');


exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('user', 'firstName lastName email phone')
            .populate('items.drug', 'name price category images prescriptionRequired');

        if (!cart) {
            return successResponse(res, {
                cartId: null,
                user: { 
                    userId: req.user._id, 
                    fullName: `${req.user.firstName} ${req.user.lastName}` 
                },
                items: [],
                summary: { 
                    totalItems: 0, 
                    subtotal: 0, 
                    fullTotal: "₦0", 
                    requiresPrescription: false 
                },
                timestamps: { createdAt: null, updatedAt: null }
            }, 'Cart is empty');
        }

        const response = {
            cartId: cart._id,
            user: {
                userId: cart.user._id,
                fullName: `${cart.user.firstName} ${cart.user.lastName}`,
                email: cart.user.email,
                phone: cart.user.phone
            },
            items: cart.items.map(item => ({
                cartItemId: item._id,
                drugId: item.drug._id,
                name: item.drug.name,
                category: item.drug.category,
                price: item.price,
                quantity: item.quantity,
                itemTotal: item.price * item.quantity,
                prescriptionRequired: item.drug.prescriptionRequired,
                image: item.drug.images[0]?.url || null,
                addedAt: item.addedAt
            })),
            summary: {
                totalItems: cart.totalItems,
                subtotal: cart.totalAmount, // ✅ FIX: Use totalAmount, not subtotal
                fullTotal: `₦${cart.totalAmount?.toLocaleString() || '0'}`, // ✅ FIX: Use totalAmount
                requiresPrescription: cart.items.some(item => item.drug.prescriptionRequired)
            },
            timestamps: {
                createdAt: cart.createdAt,
                updatedAt: cart.updatedAt
            }
        };

        return successResponse(res, response, 'Cart retrieved successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to fetch cart: ' + err.message);
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { drugId, quantity = 1 } = req.body;

        if (!drugId) {
            return badRequestResponse(res, 'Drug ID is required');
        }

        const drug = await Drug.findById(drugId);
        if (!drug) {
            return notFoundResponse(res, 'Drug not found');
        }

        if (!drug.isActive) {
            return badRequestResponse(res, 'Drug is not available');
        }

        if (drug.quantity < quantity) {
            return badRequestResponse(res, `Only ${drug.quantity} items available in stock`);
        }

        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(
            item => item.drug.toString() === drugId
        );

        if (existingItemIndex > -1) {
            const newQuantity = cart.items[existingItemIndex].quantity + quantity;

            if (newQuantity > 10) {
                return badRequestResponse(res, 'Cannot add more than 10 of the same drug');
            }

            if (drug.quantity < newQuantity) {
                return badRequestResponse(res, `Only ${drug.quantity} items available in stock`);
            }

            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            cart.items.push({
                drug: drugId,
                quantity: quantity,
                price: drug.price,
                prescriptionRequired: drug.prescriptionRequired
            });
        }

        await cart.save();
        // await cart.populate('items.drug', 'name price images prescriptionRequired');
        const populatedCart = await Cart.findById(cart._id)
            .populate('user', 'firstName lastName email phone')
            .populate('items.drug', 'name price category images prescriptionRequired');

        const response = {
            cartId: populatedCart._id,
            user: {
                userId: populatedCart.user._id,
                fullName: `${populatedCart.user.firstName} ${populatedCart.user.lastName}`,
                email: populatedCart.user.email,
                phone: populatedCart.user.phone
            },
            items: populatedCart.items.map(item => ({
                cartItemId: item._id,
                drugId: item.drug._id,
                name: item.drug.name,
                category: item.drug.category,
                price: item.price,
                quantity: item.quantity,
                itemTotal: item.price * item.quantity,
                prescriptionRequired: item.drug.prescriptionRequired,
                image: item.drug.images[0]?.url || null,
                addedAt: item.addedAt
            })),
            summary: {
                totalItems: populatedCart.totalItems,
                subtotal: populatedCart.totalAmount, // ✅ FIX: Use totalAmount
                fullTotal: `₦${populatedCart.totalAmount?.toLocaleString() || '0'}`, // ✅ FIX: Use totalAmount
                requiresPrescription: populatedCart.items.some(item => item.drug.prescriptionRequired)
            },
            timestamps: {
                createdAt: populatedCart.createdAt,
                updatedAt: populatedCart.updatedAt
            }
        };

        return successResponse(res, response, 'Item added to cart successfully');

    } catch (err) {
        return errorResponse(res, 'Failed to add item to cart: ' + err.message);
    }
};


exports.updateCartItem = async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (!cartItemId || cartItemId === 'undefined') {
            return badRequestResponse(res, 'Cart Item ID is required in the URL parameters');
        }

        console.log('Updating cart item:', { cartItemId, quantity, userId: req.user._id });

        if (quantity === undefined || quantity === null) {
            return badRequestResponse(res, 'Quantity is required');
        }

        if (quantity < 1 || quantity > 10) {
            return badRequestResponse(res, 'Quantity must be between 1 and 10');
        }

        // First find the cart with populated items
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('items.drug', 'quantity');

        if (!cart) {
            return notFoundResponse(res, 'Cart not found');
        }

        console.log('Cart items:', cart.items.map(item => ({ 
            cartItemId: item._id.toString(), 
            drugId: item.drug?._id.toString() 
        })));

        // Find the item in the cart
        const cartItem = cart.items.find(item => item._id.toString() === cartItemId);
        
        if (!cartItem) {
            console.log('Item not found. Looking for:', cartItemId);
            return notFoundResponse(res, 'Item not found in cart');
        }

        // Check stock availability
        if (cartItem.drug.quantity < quantity) {
            return badRequestResponse(res, `Only ${cartItem.drug.quantity} items available in stock`);
        }

        // Update the cart item using array position
        const itemIndex = cart.items.findIndex(item => item._id.toString() === cartItemId);
        cart.items[itemIndex].quantity = quantity;
        
        // Recalculate totals
        await cart.save();

        // Populate the updated cart for response
        const populatedCart = await Cart.findById(cart._id)
            .populate('user', 'firstName lastName email phone')
            .populate('items.drug', 'name price category images prescriptionRequired');

        const response = {
            cartId: populatedCart._id,
            user: {
                userId: populatedCart.user._id,
                fullName: `${populatedCart.user.firstName} ${populatedCart.user.lastName}`,
                email: populatedCart.user.email,
                phone: populatedCart.user.phone
            },
            items: populatedCart.items.map(item => ({
                cartItemId: item._id,
                drugId: item.drug._id,
                name: item.drug.name,
                category: item.drug.category,
                price: item.price,
                quantity: item.quantity,
                itemTotal: item.price * item.quantity,
                prescriptionRequired: item.drug.prescriptionRequired,
                image: item.drug.images[0]?.url || null,
                addedAt: item.addedAt
            })),
            summary: {
                totalItems: populatedCart.totalItems,
                subtotal: populatedCart.totalAmount,
                fullTotal: `₦${populatedCart.totalAmount?.toLocaleString() || '0'}`,
                requiresPrescription: populatedCart.items.some(item => item.drug.prescriptionRequired)
            },
            timestamps: {
                createdAt: populatedCart.createdAt,
                updatedAt: populatedCart.updatedAt
            }
        };

        return successResponse(res, response, 'Cart item updated successfully');
    } catch (err) {
        console.error('Error updating cart item:', err);
        return errorResponse(res, 'Failed to update cart item: ' + err.message);
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { cartItemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return notFoundResponse(res, 'Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === cartItemId
        );

        if (itemIndex === -1) {
            return notFoundResponse(res, 'Item not found in cart');
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();
        await cart.populate('items.drug', 'name price images prescriptionRequired');

        return successResponse(res, cart, 'Item removed from cart successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to remove item from cart: ' + err.message);
    }
};

exports.clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return notFoundResponse(res, 'Cart not found');
        }

        cart.items = [];
        await cart.save();

        return successResponse(res, cart, 'Cart cleared successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to clear cart: ' + err.message);
    }
};

exports.getCartSummary = async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            return successResponse(res, {
                totalItems: 0,
                totalAmount: 0,
                items: []
            });
        }

        const summary = {
            totalItems: cart.totalItems,
            totalAmount: cart.totalAmount,
            items: cart.items.length
        };

        return successResponse(res, summary);
    } catch (err) {
        return errorResponse(res, 'Failed to get cart summary: ' + err.message);
    }
};