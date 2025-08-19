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
            .populate({
                path: 'user',
                select: 'firstName lastName email phone'
            })
            .populate({
                path: 'items.drug',
                select: 'name price images prescriptionRequired category manufacturer dosage'
            });

        if (!cart) {
            const newCart = await Cart.create({
                user: req.user._id,
                items: [],
                totalAmount: 0,
                totalItems: 0
            });

            await newCart.populate([
                { path: 'user', select: 'firstName lastName email phone' },
                { path: 'items.drug', select: 'name price images prescriptionRequired category' }
            ]);

            return successResponse(res, newCart);
        }

        return successResponse(res, cart);
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
        await cart.populate('items.drug', 'name price images prescriptionRequired');

        return successResponse(res, cart, 'Item added to cart successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to add item to cart: ' + err.message);
    }
};


exports.updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (quantity === undefined || quantity === null) {
            return badRequestResponse(res, 'Quantity is required');
        }

        if (quantity < 1 || quantity > 10) {
            return badRequestResponse(res, 'Quantity must be between 1 and 10');
        }

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return notFoundResponse(res, 'Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
        );

        if (itemIndex === -1) {
            return notFoundResponse(res, 'Item not found in cart');
        }

        // Check stock availability
        const drug = await Drug.findById(cart.items[itemIndex].drug);
        if (drug.quantity < quantity) {
            return badRequestResponse(res, `Only ${drug.quantity} items available in stock`);
        }

        cart.items[itemIndex].quantity = quantity;
        await cart.save();
        await cart.populate('items.drug', 'name price images prescriptionRequired');

        return successResponse(res, cart, 'Cart item updated successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to update cart item: ' + err.message);
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return notFoundResponse(res, 'Cart not found');
        }

        const itemIndex = cart.items.findIndex(
            item => item._id.toString() === itemId
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