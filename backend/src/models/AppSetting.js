import mongoose from 'mongoose';

/**
 * Settings edited in the admin panel, one document per key
 * (e.g. "rewards" holds habit coin values and the premium plan).
 */
const appSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, minimize: false },
);

const AppSetting = mongoose.model('AppSetting', appSettingSchema);

export default AppSetting;
