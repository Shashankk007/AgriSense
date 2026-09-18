import wrapAsync from "../utils/wrapAsync.js";
import Inventory from "../models/Inventory.js";
import apiError from "../utils/apiError.js";
import { pick } from "../utils/ownership.js";

export const addItem = wrapAsync(async (req, res) => {
    const userId = req.user._id;
    const { itemName, category, quantity, unit, price, purchaseDate } = req.body;
    if (!itemName || quantity === undefined) throw new apiError(400, "itemName and quantity required");
    const item = await Inventory.create({ userId, itemName, category, quantity, unit, price, purchaseDate });
    res.status(201).json({ success: true, item });
});

export const getItems = wrapAsync(async (req, res) => {
    const items = await Inventory.find({ userId: req.user._id });
    res.status(200).json({ success: true, items });
});

export const updateItem = wrapAsync(async (req, res) => {
    const item = await Inventory.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, pick(req.body, ["itemName", "category", "quantity", "unit", "price", "purchaseDate"]), { new: true, runValidators: true });
    if (!item) throw new apiError(404, "Item not found");
    res.status(200).json({ success: true, item });
});

export const deleteItem = wrapAsync(async (req, res) => {
    const item = await Inventory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) throw new apiError(404, "Item not found");
    res.status(200).json({ success: true, message: "Item deleted" });
});
