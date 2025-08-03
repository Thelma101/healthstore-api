
{
  username: String,
  email: String,
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  address: String,
  phone: String,
  createdAt: Date,
  updatedAt: Date
}