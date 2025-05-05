Table users {
  id string [primary key]
  name string [not null]
  user_name string [not null, unique]
  password string [not null]
  role string [not null]
  profile_image string
  created_at timestamp [not null]
}

Enum roles {
  ADMIN
  MANAGER
  TOTEM
  ATTENDANT
}

Table services {
  id string [primary key]
  name string [not null]
  slug string [not null]
  description string [not null]
  value decimal [not null]
  cover_image string
  created_at string [not null]
}

Table customers {
  id string [primary key]
  name string [not null]
  phone_number string [not null, unique]
  profile_image string
  birth_date timestamp [not null]
  created_at timestamp [not null]
}

Table appointment {
  id string [primary key]
  customerId string [not null]
  attendant_id string 
  services services[]
  total_price decimal [not null]
  discounts decimal
  final_price decimal [not null]
  paymenth_method appointment_payment_methods
  redeem_code string
  status appointment_statuses [not null]
  created_at timestamp [not null]
  on_service_at timestamp
  finished_at timestamp
}

Ref: appointment.customerId > customers.id
Ref: appointment.attendant_id > users.id
Ref: appointment.services > services.id

Enum appointment_statuses{
  WAITING
  ON_SERVICE
  FINISHED
  CANCELED
}

Enum appointment_payment_methods{
  CASH
  PIX
  CREDIT_CARD
  DEBIT_CARD
  TRANSFER
}

Table attendant_queue {
  id string [primary key]
  attendant_id string [not null]
  appointments appointment[]
}

Ref: attendant_queue.attendant_id > users.id
Ref: attendant_queue.appointments > appointment.id