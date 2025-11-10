import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['seller', 'rigger', 'buyer', 'admin'],
    required: true
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  riggerInfo: {
    shopName: String,
    licenseNumber: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verificationDocuments: [String],
    // Extended profile information
    bio: String,
    yearsOfExperience: Number,
    certifications: [{
      name: String,
      issuer: String,
      issueDate: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    specialties: [String], // e.g., ['Rig Inspection', 'Reserve Repack', 'AAD Service']
    location: {
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    responseTime: String, // e.g., 'Within 24 hours', 'Within 48 hours'
    averageResponseTime: Number, // in hours
    shopAddress: String,
    shopPhone: String,
    shopEmail: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      linkedin: String
    },
    businessHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean }
    },
    gallery: [String], // Array of image URLs
    averageRating: {
      type: Number,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  paymentInfo: {
    bankAccount: {
      accountNumber: String,
      routingNumber: String,
      accountHolderName: String
    },
    cryptoWallet: String
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

