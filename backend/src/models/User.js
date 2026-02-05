const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const SALT_ROUNDS = 10

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    // store a single active refresh token for simplicity
    refreshToken: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash
        delete ret.__v
        delete ret.refreshToken
        return ret
      }
    }
  }
)

UserSchema.methods.setPassword = async function (plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS)
  this.passwordHash = await bcrypt.hash(plainPassword, salt)
  return this.passwordHash
}

UserSchema.methods.validatePassword = async function (plainPassword) {
  if (!this.passwordHash) return false
  return bcrypt.compare(plainPassword, this.passwordHash)
}

UserSchema.statics.findByEmail = function (email) {
  if (!email) return Promise.resolve(null)
  return this.findOne({ email: String(email).toLowerCase().trim() })
}

UserSchema.pre('save', function (next) {
  if (this.email) this.email = this.email.toLowerCase().trim()
  next()
})

module.exports = mongoose.model('User', UserSchema)