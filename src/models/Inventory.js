import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    sku: { type: String, unique: true, sparse: true }
  },
  { timestamps: true }
);

export default mongoose.model('Inventory', inventorySchema);
