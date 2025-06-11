Table users {
  _id string [primary key]
  name string [not null]
  userName string [not null, unique]
  password string [not null]
  role userRoles [not null]
  profileImage string
  status userStatus [not null]
  createdAt timestamp [not null]
  deletedAt timestamp
}

Enum userRoles {
  ADMIN
  MANAGER
  TOTEM
  ATTENDANT
  ATTENDANT_ADMIN
}

Enum userStatus {
  ACTIVE
  INACTIVE
}

Table services {
  _id string [primary key]
  name string [not null]
  value decimal [not null]
  promoValue decimal
  promoEnabled bool [default: false]
  description string
  coverImage string
  weight int [default: 1]
  createdAt timestamp [not null]
  deletedAt timestamp
}

Table products {
  _id string [primary key]
  name string [not null]
  value decimal [not null]
  promoValue decimal
  promoEnabled bool [default: false]
  description string
  coverImage string
  createdAt timestamp [not null]
  deletedAt timestamp
}

Table customers {
  _id string [primary key]
  name string [not null]
  phoneNumber string [not null, unique]
  profileImage string
  birthDate timestamp [not null]
  gender string [not null]
  referralCodeUsed string
  referralCode string [unique]
  referralCodeUseCount int [default: 0]
  partnershipId string
  partnershipIdentificationId string
  createdAt timestamp [not null]
}

Ref: customers.partnershipId > partnerships._id

Table appointments {
  _id string [primary key]
  customerId string [not null]
  attendantId string 
  serviceIds string[] [not null]
  productIds string[]
  partnershipId string[]
  totalPrice decimal [not null]
  discount decimal
  finalPrice decimal [not null]
  paymentMethod appointment_payment_methods
  redeemCoupon string
  status appointment_statuses [not null]
  createdAt timestamp [not null]
  onServiceAt timestamp
  finishedAt timestamp
}

Ref: appointments.attendantId > users._id
Ref: appointments.serviceIds > services._id
Ref: appointments.productIds > products._id
Ref: appointments.customerId > customers._id
Ref: appointments.partnershipId > partnerships._id

Enum appointment_statuses{
  WAITING
  ON_SERVICE
  FINISHED
  CANCELED
  NO_SHOW
}

Enum appointment_payment_methods{
  CASH
  CREDIT_CARD
  DEBIT_CARD
  PIX
  TRANSFER
  BONUS
}

Table partnerships {
  _id string [primary key]
  name string [not null]
  identificationLabel string [not null]
  type partnership_types [not null, default: "COMMON"]
  discountValue decimal [not null, default: 0]
  discountType partnership_discount_types [not null, default: "PERCENTAGE"]
  createdAt timestamp [not null]
  deletedAt timestamp
}

Enum partnership_discount_types {
  FIXED
  PERCENTAGE
}

Enum partnership_types {
  COMMON
  PARKING
}